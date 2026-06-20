import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { cars, scrapeRuns } from '@/db/schema';
import type { ScrapedListingDraft } from './scrapers/types';
import { recalculateAllMarketStats } from './marketAnalysis';
import { searchAll } from './scrapers';
import type { SearchCriteria } from './scrapers/types';
import { getSettings } from './settings';
import { fetchOtomotoPhotos } from './scrapers/otomoto';

export interface IngestResult {
  totalFound: number;
  newCount: number;
  updatedCount: number;
}

// ponytail: worker-pool concurrency — avoids flooding Supabase/site with unbounded Promise.all
async function withConcurrency<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let idx = 0;
  async function worker() {
    while (idx < tasks.length) {
      const i = idx++;
      results[i] = await tasks[i]();
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}

export async function ingestListings(
  drafts: ScrapedListingDraft[],
  userId: string
): Promise<IngestResult> {
  if (drafts.length === 0) return { totalFound: 0, newCount: 0, updatedCount: 0 };

  const now = new Date();

  // 1. Single query to find all existing records for this user
  const existing = await db
    .select({ id: cars.id, source: cars.source, externalId: cars.externalId })
    .from(cars)
    .where(eq(cars.userId, userId));
  const existingMap = new Map(existing.map((r) => [`${r.source}|${r.externalId}`, r.id]));

  const newDrafts = drafts.filter((d) => !existingMap.has(`${d.source}|${d.externalId}`));
  const updDrafts = drafts.filter((d) => existingMap.has(`${d.source}|${d.externalId}`));

  // 2. Fetch otomoto photos for all new listings in parallel (5 concurrent)
  const otomotoNew = newDrafts.filter((d) => d.source === 'otomoto' && d.url);
  if (otomotoNew.length > 0) {
    await withConcurrency(
      otomotoNew.map((d) => async () => {
        const photos = await fetchOtomotoPhotos(d.url!);
        if (photos.length > 0) {
          d.photos = photos;
          d.mainPhoto = photos[0];
        }
      }),
      2
    );
  }

  // 3. Batch insert all new drafts in one query
  if (newDrafts.length > 0) {
    await db.insert(cars).values(
      newDrafts.map((d) => ({
        source: d.source,
        externalId: d.externalId,
        url: d.url,
        title: d.title,
        brand: d.brand,
        model: d.model,
        generation: d.generation,
        productionYear: d.productionYear,
        engineCapacity: d.engineCapacity,
        enginePower: d.enginePower,
        fuelType: d.fuelType,
        gearbox: d.gearbox,
        bodyType: d.bodyType,
        color: d.color,
        mileage: d.mileage,
        price: d.price,
        currency: d.currency,
        voivodeship: d.voivodeship,
        city: d.city,
        description: d.description,
        equipmentJson: JSON.stringify(d.equipment),
        photosJson: JSON.stringify(d.photos),
        mainPhoto: d.mainPhoto,
        sellerName: d.sellerName,
        sellerPhone: d.sellerPhone,
        sellerType: d.sellerType,
        listedAt: d.listedAt,
        scrapedAt: now,
        createdAt: now,
        updatedAt: now,
        userId,
      }))
    );
  }

  // 4. Parallel update existing records
  if (updDrafts.length > 0) {
    await Promise.all(
      updDrafts.map((d) =>
        db
          .update(cars)
          .set({
            title: d.title,
            price: d.price,
            mileage: d.mileage,
            description: d.description,
            equipmentJson: JSON.stringify(d.equipment),
            sellerName: d.sellerName,
            sellerPhone: d.sellerPhone,
            updatedAt: now,
          })
          .where(eq(cars.id, existingMap.get(`${d.source}|${d.externalId}`)!))
      )
    );
  }

  await recalculateAllMarketStats();

  return { totalFound: drafts.length, newCount: newDrafts.length, updatedCount: updDrafts.length };
}

export async function runScrapeAndIngest(
  criteria: SearchCriteria = {},
  userId: string,
  onProgress?: (done: number, total: number) => void
): Promise<IngestResult & { runId: number }> {
  const settings = getSettings(userId);
  const { listingsPerPortal, locationCity, locationRadiusKm, priceMin, priceMax } = settings;
  const effectiveCriteria: SearchCriteria = {
    priceMin: priceMin || undefined,
    priceMax: priceMax || undefined,
    locationCity,
    locationRadiusKm,
    maxListings: listingsPerPortal,
    maxPages: Math.ceil(listingsPerPortal / 15) + 2,
    ...criteria,
  };
  const total = (effectiveCriteria.maxListings ?? listingsPerPortal) * 3;
  let done = 0;
  const onListingFetched = onProgress
    ? () => { onProgress(++done, total); }
    : undefined;
  const startedAt = new Date();
  const [run] = await db
    .insert(scrapeRuns)
    .values({ source: 'all', startedAt, status: 'running', userId })
    .returning({ id: scrapeRuns.id });

  try {
    const drafts = await searchAll(effectiveCriteria, onListingFetched);
    const result = await ingestListings(drafts, userId);

    const underpricedCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(cars)
      .where(and(eq(cars.userId, userId), eq(cars.isUnderpriced, true)));

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
