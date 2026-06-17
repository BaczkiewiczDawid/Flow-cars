import * as cheerio from 'cheerio';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { cars, type Car } from '@/db/schema';
import { politeFetch } from './scrapers/httpClient';

export const UNDERPRICED_THRESHOLD_PERCENT = Number(
  process.env.UNDERPRICED_THRESHOLD_PERCENT ?? '15'
);

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
  lpg: 'lpg', LPG: 'lpg', 'benzyna+lpg': 'lpg', 'gasoline+lpg': 'lpg', gas: 'lpg',
  elektryczny: 'electric', electric: 'electric',
};
function canonicalFuel(raw: string | null | undefined): string | null {
  if (!raw) return null;
  return FUEL_CANON[raw.trim()] ?? FUEL_CANON[raw.trim().toLowerCase()] ?? null;
}

interface MarketListing {
  price: number;
  year: number;
  mileage: number;
  engineCapacity: number;
  enginePower: number;
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
        enginePower: pval('engine_power'),
        fuelType: canonicalFuel(pstr('fuel_type')),
      };
    })
    .filter((v) => v.price > 0 && v.year > 0);
}

/**
 * Pobiera ogłoszenia Otomoto dla marki/modelu — do 2 stron, żeby mieć
 * wystarczającą próbkę do stopniowego rozluźniania filtrów.
 */
async function fetchOtomotoMarketListings(brand: string, model: string): Promise<MarketListing[]> {
  const base = `https://www.otomoto.pl/osobowe/${slugify(brand)}/${slugify(model)}/`;
  const all: MarketListing[] = [];

  for (let page = 1; page <= 2; page++) {
    const url = page === 1
      ? `${base}?search[order]=created_at:desc&search[filter_enum_damaged][0]=0`
      : `${base}?search[order]=created_at:desc&search[filter_enum_damaged][0]=0&page=${page}`;
    try {
      const listings = parseEdges(await politeFetch(url));
      if (listings.length === 0) break;
      all.push(...listings);
    } catch { break; }
  }

  return all;
}

const YEAR_TOL = 1;
const MILEAGE_TOL = 50_000;

function findComparable(
  listings: MarketListing[],
  car: { productionYear: number; mileage: number; fuelType: string | null },
  matchFuel: boolean
): MarketListing[] {
  const carFuel = canonicalFuel(car.fuelType);
  return listings.filter((c) => {
    if (Math.abs(c.year - car.productionYear) > YEAR_TOL) return false;
    if (Math.abs(c.mileage - car.mileage) > MILEAGE_TOL) return false;
    if (matchFuel && carFuel && c.fuelType && carFuel !== c.fuelType) return false;
    return true;
  });
}

export function deviationFromMarket(
  price: number,
  marketPrice: number
): { priceDeviationPercent: number; isUnderpriced: boolean } {
  const priceDeviationPercent = ((price - marketPrice) / marketPrice) * 100;
  return {
    priceDeviationPercent,
    isUnderpriced: priceDeviationPercent <= -UNDERPRICED_THRESHOLD_PERCENT,
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

  for (const [key, group] of groups) {
    const [brand, model] = key.split('|');
    console.log(`[market] ${brand} ${model}`);
    const marketListings = await fetchOtomotoMarketListings(brand, model);

    for (const car of group) {
      // Próba z paliwem, fallback bez paliwa (rok i przebieg zawsze wymagane)
      let comparable = findComparable(marketListings, car, true);
      if (comparable.length < 3) comparable = findComparable(marketListings, car, false);

      let estimatedMarketPrice: number | null = null;
      let priceDeviationPercent: number | null = null;
      let isUnderpriced = false;

      if (comparable.length > 0) {
        const prices = trimOutliers(comparable.map((c) => c.price));
        estimatedMarketPrice = Math.round(median(prices));
        const dev = deviationFromMarket(car.price, estimatedMarketPrice);
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

export type { Car };
