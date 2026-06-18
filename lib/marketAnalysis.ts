import * as cheerio from 'cheerio';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { cars, type Car } from '@/db/schema';
import { parallelFetch } from './scrapers/httpClient';
import { getSettings } from './settings';

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function trimOutliers(values: number[]): number[] {
  if (values.length < 5) return values;
  const sorted = [...values].sort((a, b) => a - b);
  const cut = Math.floor(sorted.length * 0.1);
  return sorted.slice(cut, sorted.length - cut);
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e')
    .replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o')
    .replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

const FUEL_CANON: Record<string, string> = {
  diesel: 'diesel',
  benzyna: 'petrol', petrol: 'petrol', gasoline: 'petrol',
  hybryda: 'hybrid', hybrid: 'hybrid',
  lpg: 'petrol', LPG: 'petrol', 'benzyna+lpg': 'petrol', 'gasoline+lpg': 'petrol', gas: 'petrol',
  elektryczny: 'electric', electric: 'electric',
};
export function canonicalFuel(raw: string | null | undefined): string | null {
  if (!raw) return null;
  return FUEL_CANON[raw.trim()] ?? FUEL_CANON[raw.trim().toLowerCase()] ?? null;
}

interface MarketListing {
  price: number;
  year: number;
  mileage: number;
  engineCapacity: number;
  fuelType: string | null;
}

function parseEdges(html: string): MarketListing[] {
  const $ = cheerio.load(html);
  let edges: any[] = [];
  try {
    const nd = $('script#__NEXT_DATA__').html();
    if (!nd) return [];
    const urqlState: Record<string, { data: string }> =
      JSON.parse(nd)?.props?.pageProps?.urqlState ?? {};
    for (const key of Object.keys(urqlState)) {
      const parsed = JSON.parse(urqlState[key]?.data ?? '{}');
      if (parsed?.advertSearch?.edges) { edges = parsed.advertSearch.edges; break; }
    }
  } catch { return []; }

  return edges
    .map((e: any) => {
      const node = e.node;
      const price = Number(node?.price?.amount?.value) || 0;
      const params: Array<{ key: string; value: string }> = node?.parameters ?? [];
      const pval = (k: string) => Number(params.find((p) => p.key === k)?.value) || 0;
      const pstr = (k: string) => params.find((p) => p.key === k)?.value ?? null;
      return {
        price,
        year: pval('year'),
        mileage: pval('mileage'),
        engineCapacity: pval('engine_capacity'),
        fuelType: canonicalFuel(pstr('fuel_type')),
      };
    })
    .filter((v) => v.price > 0 && v.year > 0);
}

async function fetchOtomotoMarketListings(
  brand: string,
  model: string,
  yearRange?: { from?: number; to?: number },
): Promise<MarketListing[]> {
  const base = `https://www.otomoto.pl/osobowe/${slugify(brand)}/${slugify(model)}/`;
  const parts = ['search[order]=created_at:desc', 'search[filter_enum_damaged][0]=0'];
  if (yearRange?.from) parts.push(`search[filter_float_year:from]=${yearRange.from}`);
  if (yearRange?.to) parts.push(`search[filter_float_year:to]=${yearRange.to}`);
  const qs = parts.join('&');
  const all: MarketListing[] = [];

  for (let page = 1; page <= 2; page++) {
    const url = page === 1 ? `${base}?${qs}` : `${base}?${qs}&page=${page}`;
    try {
      const listings = parseEdges(await parallelFetch(url));
      if (listings.length === 0) break;
      all.push(...listings);
    } catch { break; }
  }

  return all;
}

function findComparable(
  listings: MarketListing[],
  car: { productionYear: number; mileage: number; fuelType: string | null; yearFrom?: number; yearTo?: number; engineCapacity?: number },
  matchFuel: boolean,
  s: { yearTolerance: number; mileageTolerance: number; engineTolerance: number }
): MarketListing[] {
  const carFuel = canonicalFuel(car.fuelType);
  const hasYear = car.productionYear > 0;
  const yearFrom = car.yearFrom ?? (hasYear ? car.productionYear - s.yearTolerance : 0);
  const yearTo   = car.yearTo   ?? (hasYear ? car.productionYear + s.yearTolerance : 9999);
  return listings.filter((c) => {
    if (c.year < yearFrom || c.year > yearTo) return false;
    if (Math.abs(c.mileage - car.mileage) > s.mileageTolerance) return false;
    if (s.engineTolerance > 0 && car.engineCapacity && c.engineCapacity > 0 &&
        Math.abs(c.engineCapacity - car.engineCapacity) > s.engineTolerance) return false;
    if (matchFuel && carFuel && c.fuelType && carFuel !== c.fuelType) return false;
    return true;
  });
}

export function deviationFromMarket(
  price: number,
  marketPrice: number,
  threshold?: number
): { priceDeviationPercent: number; isUnderpriced: boolean } {
  const t = threshold ?? getSettings().underpricedThresholdPercent;
  const priceDeviationPercent = ((price - marketPrice) / marketPrice) * 100;
  return {
    priceDeviationPercent,
    isUnderpriced: priceDeviationPercent <= -t,
  };
}

/**
 * Przelicza wycenę rynkową dla wszystkich samochodów w bazie.
 * Grupuje po marce/modelu → 2 strony Otomoto per para.
 * Filtry rozluźniane stopniowo aż do zawsze-wynik (fallback = cała próbka).
 */
export async function recalculateAllMarketStats(): Promise<void> {
  const all = await db
    .select({
      id: cars.id,
      brand: cars.brand,
      model: cars.model,
      productionYear: cars.productionYear,
      mileage: cars.mileage,
      price: cars.price,
      fuelType: cars.fuelType,
    })
    .from(cars);

  const groups = new Map<string, typeof all>();
  for (const car of all) {
    const key = `${car.brand}|${car.model}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(car);
  }

  // Pobierz dane rynkowe dla wszystkich par równolegle
  const entries = Array.from(groups.entries());
  console.log(`[market] Pobieranie danych dla ${entries.length} par marka/model równolegle…`);

  const s = getSettings();

  const marketResults = await Promise.allSettled(
    entries.map(([key, group]) => {
      const [brand, model] = key.split('|');
      const years = group.map((c) => c.productionYear).filter((y) => y > 0);
      const yearRange = years.length > 0
        ? { from: Math.min(...years) - s.yearTolerance, to: Math.max(...years) + s.yearTolerance }
        : undefined;
      return fetchOtomotoMarketListings(brand, model, yearRange).then((listings) => ({ key, listings }));
    })
  );

  const marketMap = new Map<string, MarketListing[]>();
  for (const result of marketResults) {
    if (result.status === 'fulfilled') {
      marketMap.set(result.value.key, result.value.listings);
    }
  }

  for (const [key, group] of groups) {
    const marketListings = marketMap.get(key) ?? [];
    const [brand, model] = key.split('|');
    console.log(`[market] ${brand} ${model} — próbka: ${marketListings.length}`);

    for (const car of group) {
      let comparable = findComparable(marketListings, car, s.requireFuelMatch, s);
      if (comparable.length < 3) comparable = findComparable(marketListings, car, false, s);

      let estimatedMarketPrice: number | null = null;
      let priceDeviationPercent: number | null = null;
      let isUnderpriced = false;

      if (comparable.length > 0) {
        const prices = trimOutliers(comparable.map((c) => c.price));
        estimatedMarketPrice = Math.round(median(prices));
        const dev = deviationFromMarket(car.price, estimatedMarketPrice, s.underpricedThresholdPercent);
        priceDeviationPercent = Math.round(dev.priceDeviationPercent * 10) / 10;
        isUnderpriced = dev.isUnderpriced;
      }

      await db
        .update(cars)
        .set({
          estimatedMarketPrice,
          priceDeviationPercent,
          comparableSampleSize: comparable.length,
          isUnderpriced,
          updatedAt: new Date(),
        })
        .where(eq(cars.id, car.id));
    }
  }
}

export async function estimateMarketPrice(
  brand: string,
  model: string,
  car: { productionYear: number; mileage: number; fuelType?: string | null; yearFrom?: number; yearTo?: number; engineCapacity?: number }
): Promise<{ estimatedMarketPrice: number | null; sampleSize: number }> {
  const s = getSettings();
  const hasYear = (car.productionYear ?? 0) > 0;
  const yearRange = hasYear
    ? { from: (car.yearFrom ?? car.productionYear! - s.yearTolerance), to: (car.yearTo ?? car.productionYear! + s.yearTolerance) }
    : undefined;
  const listings = await fetchOtomotoMarketListings(brand, model, yearRange);
  const carParams = { ...car, fuelType: car.fuelType ?? null };
  let comparable = findComparable(listings, carParams, s.requireFuelMatch, s);
  if (comparable.length < 3) comparable = findComparable(listings, carParams, false, s);
  if (comparable.length === 0) return { estimatedMarketPrice: null, sampleSize: 0 };
  const prices = trimOutliers(comparable.map((c) => c.price));
  return { estimatedMarketPrice: Math.round(median(prices)), sampleSize: comparable.length };
}

export function buildMarketListingUrl(
  brand: string,
  model: string,
  car: { productionYear: number; mileage: number; fuelType: string | null; engineCapacity?: number | null },
  s: { yearTolerance: number; mileageTolerance: number; engineTolerance: number; requireFuelMatch: boolean },
): string {
  const p = new URLSearchParams();
  p.set('search[order]', 'created_at:desc');
  p.set('search[filter_enum_damaged][0]', '0');

  if (car.productionYear > 0) {
    p.set('search[filter_float_year:from]', String(car.productionYear - s.yearTolerance));
    p.set('search[filter_float_year:to]', String(car.productionYear + s.yearTolerance));
  }

  const mileageMin = car.mileage - s.mileageTolerance;
  if (mileageMin > 0) p.set('search[filter_float_mileage:from]', String(mileageMin));
  p.set('search[filter_float_mileage:to]', String(car.mileage + s.mileageTolerance));

  if (s.engineTolerance > 0 && car.engineCapacity) {
    p.set('search[filter_float_engine_capacity:from]', String(car.engineCapacity - s.engineTolerance));
    p.set('search[filter_float_engine_capacity:to]', String(car.engineCapacity + s.engineTolerance));
  }

  if (s.requireFuelMatch) {
    const fuel = canonicalFuel(car.fuelType);
    if (fuel) p.set('search[filter_enum_fuel_type][0]', fuel);
  }

  return `https://www.otomoto.pl/osobowe/${slugify(brand)}/${slugify(model)}/?${p.toString()}`;
}

export type { Car };
