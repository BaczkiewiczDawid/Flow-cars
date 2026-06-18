import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { cars, scrapeRuns } from '@/db/schema';
import type { ScrapedListingDraft } from './scrapers/types';
import { recalculateAllMarketStats } from './marketAnalysis';
import { searchAll } from './scrapers';
import type { SearchCriteria } from './scrapers/types';
import { getSettings } from './settings';

export interface IngestResult {
  totalFound: number;
  newCount: number;
  updatedCount: number;
}

async function upsertListing(draft: ScrapedListingDraft): Promise<'new' | 'updated'> {
  const existing = await db
    .select({ id: cars.id })
    .from(cars)
    .where(and(eq(cars.source, draft.source), eq(cars.externalId, draft.externalId)))
    .limit(1);

  const now = new Date();

  if (existing.length > 0) {
    await db
      .update(cars)
      .set({
        title: draft.title,
        price: draft.price,
        mileage: draft.mileage,
        description: draft.description,
        equipmentJson: JSON.stringify(draft.equipment),
        photosJson: JSON.stringify(draft.photos),
        mainPhoto: draft.mainPhoto,
        sellerName: draft.sellerName,
        sellerPhone: draft.sellerPhone,
        updatedAt: now,
      })
      .where(eq(cars.id, existing[0].id));
    return 'updated';
  }

  await db.insert(cars).values({
    source: draft.source,
    externalId: draft.externalId,
    url: draft.url,
    title: draft.title,
    brand: draft.brand,
    model: draft.model,
    generation: draft.generation,
    productionYear: draft.productionYear,
    engineCapacity: draft.engineCapacity,
    enginePower: draft.enginePower,
    fuelType: draft.fuelType,
    gearbox: draft.gearbox,
    bodyType: draft.bodyType,
    color: draft.color,
    mileage: draft.mileage,
    price: draft.price,
    currency: draft.currency,
    voivodeship: draft.voivodeship,
    city: draft.city,
    description: draft.description,
    equipmentJson: JSON.stringify(draft.equipment),
    photosJson: JSON.stringify(draft.photos),
    mainPhoto: draft.mainPhoto,
    sellerName: draft.sellerName,
    sellerPhone: draft.sellerPhone,
    sellerType: draft.sellerType,
    listedAt: draft.listedAt,
    scrapedAt: now,
    createdAt: now,
    updatedAt: now,
  });
  return 'new';
}

/** Zapisuje listę zeskrapowanych ofert i przelicza wycenę rynkową dla całej bazy. */
export async function ingestListings(
  drafts: ScrapedListingDraft[]
): Promise<IngestResult> {
  let newCount = 0;
  let updatedCount = 0;

  for (const draft of drafts) {
    const result = await upsertListing(draft);
    if (result === 'new') newCount++;
    else updatedCount++;
  }

  if (drafts.length > 0) {
    await recalculateAllMarketStats();
  }

  return { totalFound: drafts.length, newCount, updatedCount };
}

/** Pełny przebieg: wyszukaj na OLX + Otomoto, zapisz, przelicz rynek, zaloguj przebieg skanu. */
export async function runScrapeAndIngest(
  criteria: SearchCriteria = {},
  onProgress?: (done: number, total: number) => void
): Promise<IngestResult & { runId: number }> {
  const { listingsPerPortal, locationCity, locationRadiusKm, priceMin, priceMax } = getSettings();
  const effectiveCriteria: SearchCriteria = {
    priceMin: priceMin || undefined,
    priceMax: priceMax || undefined,
    locationCity,
    locationRadiusKm,
    maxListings: listingsPerPortal,
    maxPages: Math.ceil(listingsPerPortal / 15) + 2,
    ...criteria,
  };
  const total = (effectiveCriteria.maxListings ?? listingsPerPortal) * 2; // OLX + Otomoto
  let done = 0;
  const onListingFetched = onProgress
    ? () => { onProgress(++done, total); }
    : undefined;
  const startedAt = new Date();
  const [run] = await db
    .insert(scrapeRuns)
    .values({ source: 'all', startedAt, status: 'running' })
    .returning({ id: scrapeRuns.id });

  try {
    const drafts = await searchAll(effectiveCriteria, onListingFetched);
    const result = await ingestListings(drafts);

    const underpricedCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(cars)
      .where(eq(cars.isUnderpriced, true));

    await db
      .update(scrapeRuns)
      .set({
        finishedAt: new Date(),
        status: 'success',
        foundCount: result.totalFound,
        newCount: result.newCount,
        underpricedCount: underpricedCount[0]?.count ?? 0,
      })
      .where(eq(scrapeRuns.id, run.id));

    return { ...result, runId: run.id };
  } catch (err) {
    await db
      .update(scrapeRuns)
      .set({
        finishedAt: new Date(),
        status: 'error',
        errorMessage: err instanceof Error ? err.message : String(err),
      })
      .where(eq(scrapeRuns.id, run.id));
    throw err;
  }
}
