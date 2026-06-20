import type { CarScraper, ScrapedListingDraft, SearchCriteria } from './types';
import { CAR_CATALOG, generateListingsForEntry } from './catalog';
import { normalizeFuelType, normalizeGearbox } from './parseHelpers';
import { getScraperMode } from './mode';
import { getSettings } from '../settings';
import { DELAY_MS } from './httpClient';

const MAX_LISTINGS_DEFAULT = Number(process.env.SCRAPER_MAX_LISTINGS ?? '8');
const API = 'https://api.autoplac.pl/offers/search';
const CITIES_API = 'https://api.autoplac.pl/categories/suggested-cities';
const BASE_URL = 'https://autoplac.pl';

// ponytail: module-level cache, lives as long as the process
const sellerCountCache = new Map<string, number>();

async function getSellerCarCount(userId: string): Promise<number> {
  if (sellerCountCache.has(userId)) return sellerCountCache.get(userId)!;
  try {
    const params = new URLSearchParams({ seoCategories: 'samochody-osobowe', userId });
    const res = await fetch(`${API}?${params}`, { headers: HEADERS });
    if (!res.ok) { sellerCountCache.set(userId, 0); return 0; }
    const data: any = await res.json();
    // totalCount / totalElements / totalPages*perPage are common pagination shapes
    const count: number = (data?.offerCount as number | undefined) ?? 0;
    sellerCountCache.set(userId, count);
    return count;
  } catch {
    sellerCountCache.set(userId, 0);
    return 0;
  }
}

const HEADERS = {
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'pl-PL,pl;q=0.9',
  Referer: 'https://www.autoplac.pl/',
  Origin: 'https://www.autoplac.pl',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
};

function slugify(text: string): string {
  return text.trim().toLowerCase()
    .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e').replace(/ł/g, 'l')
    .replace(/ń/g, 'n').replace(/ó/g, 'o').replace(/ś/g, 's').replace(/ź/g, 'z')
    .replace(/ż/g, 'z').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// ponytail: fetched once per process, good enough for a scraper
let citiesCache: Array<{ displayName: string; latitude: number; longitude: number }> | null = null;

async function getCityCoords(cityName: string): Promise<{ lat: number; lon: number } | null> {
  if (!citiesCache) {
    try {
      const res = await fetch(CITIES_API, { headers: HEADERS });
      const data: any[] = await res.json();
      citiesCache = data.flatMap((v) =>
        (v.districtCities ?? []).map((c: any) => ({
          displayName: c.displayName as string,
          latitude: c.latitude as number,
          longitude: c.longitude as number,
        })),
      );
    } catch {
      citiesCache = [];
    }
  }
  const lower = cityName.toLowerCase();
  const match = citiesCache.find((c) => c.displayName.toLowerCase() === lower);
  return match ? { lat: match.latitude, lon: match.longitude } : null;
}

async function buildParams(criteria: SearchCriteria, page: number): Promise<URLSearchParams> {
  let seoCategories = 'samochody-osobowe';
  // ponytail: seoCategories brand/model slugs are ignored by the API — year/price/location only work

  const params = new URLSearchParams({ seoCategories });
  if (criteria.priceMin) params.set('priceFrom', String(criteria.priceMin));
  if (criteria.priceMax) params.set('priceTo', String(criteria.priceMax));
  if (criteria.yearMin) params.set('yearFrom', String(criteria.yearMin));
  if (criteria.yearMax) params.set('yearTo', String(criteria.yearMax));
  if (page > 1) params.set('p', String(page));

  if (criteria.locationCity) {
    const coords = await getCityCoords(criteria.locationCity);
    if (coords) {
      params.set('latitude', String(coords.lat));
      params.set('longitude', String(coords.lon));
      if (criteria.locationRadiusKm) params.set('range', String(criteria.locationRadiusKm));
    }
  }

  return params;
}

function parseItem(item: any): ScrapedListingDraft | null {
  const { offer, dealer, photoList = [] } = item ?? {};
  if (!offer?.id) return null;

  const url: string | null =
    offer.offerShareUrl ?? (offer.webUrl ? `${BASE_URL}${offer.webUrl}` : null);
  if (!url) return null;

  const photos = (photoList as any[]).map((p) => p.bigUrl ?? p.url ?? p.miniatureUrl).filter(Boolean) as string[];

  // kW → KM (PS); API gives enginePowerKW
  const enginePower = offer.enginePowerKW ? Math.round(offer.enginePowerKW * 1.3596) : undefined;

  return {
    source: 'autoplac',
    externalId: String(offer.id),
    url,
    title: offer.title ?? `${offer.brand ?? ''} ${offer.model ?? ''}`.trim(),
    brand: offer.brand ?? '',
    model: offer.model ?? '',
    productionYear: offer.productionYear ?? 0,
    engineCapacity: offer.engineCapacity ?? undefined,
    enginePower,
    mileage: offer.mileage ?? 0,
    price: offer.price ?? 0,
    currency: offer.currency ?? 'PLN',
    city: offer.city ?? undefined,
    voivodeship: offer.voivodeshipDisplay ?? undefined,
    fuelType: normalizeFuelType(offer.fuelTypeText ?? offer.fuelType ?? null),
    gearbox: normalizeGearbox(offer.transmissionTypeText ?? null),
    bodyType: offer.bodyTypeText?.toLowerCase(),
    sellerId: String(offer.userId ?? ''),
    sellerType: dealer != null ? 'firma' : 'prywatny',
    description: '',
    equipment: [],
    photos,
    mainPhoto: photos[0],
  };
}

async function searchLive(
  criteria: SearchCriteria,
  onListingFetched?: () => void,
): Promise<ScrapedListingDraft[]> {
  const target = criteria.maxListings ?? MAX_LISTINGS_DEFAULT;
  const maxPages = criteria.maxPages ?? 3;
  const dealerThreshold = criteria.dealerListingThreshold ?? getSettings().dealerListingThreshold;

  const all: ScrapedListingDraft[] = [];
  const seenIds = new Set<string>();
  const pendingChecks = new Map<string, Promise<number>>();
  // API doesn't filter by brand/model — collect more pages to compensate for client-side filtering
  const needsBrandFilter = !!(criteria.brand || criteria.model);
  const collectLimit = needsBrandFilter ? target * 12 : target * 3;

  for (let page = 1; page <= maxPages; page++) {
    if (page > 1) await new Promise((r) => setTimeout(r, DELAY_MS));

    const params = await buildParams(criteria, page);
    let data: any;
    try {
      const res = await fetch(`${API}?${params}`, { headers: HEADERS });
      if (!res.ok) {
        console.error(`[autoplac] HTTP ${res.status} dla strony ${page}`);
        break;
      }
      data = await res.json();
    } catch (err) {
      console.error('[autoplac] błąd pobierania:', err);
      break;
    }

    const offerList: any[] = data?.offerList ?? [];
    if (offerList.length === 0) break;

    for (const item of offerList) {
      const draft = parseItem(item);
      if (!draft || seenIds.has(draft.externalId)) continue;
      seenIds.add(draft.externalId);
      all.push(draft);
      // kick off profile check immediately — overlaps with next page fetch
      if (draft.sellerType === 'prywatny' && draft.sellerId && !pendingChecks.has(draft.sellerId)) {
        pendingChecks.set(draft.sellerId, getSellerCarCount(draft.sellerId));
      }
    }

    if (all.length >= collectLimit) break;
  }

  // Client-side brand/model filter (API doesn't support these)
  const brandLower = criteria.brand?.toLowerCase();
  const modelLower = criteria.model?.toLowerCase();
  const pool = all.filter((l) => {
    if (brandLower && l.brand.toLowerCase() !== brandLower) return false;
    if (modelLower && l.model.toLowerCase() !== modelLower) return false;
    return true;
  });

  await Promise.allSettled([...pendingChecks.values()]);

  const dealerIds = new Set(
    [...pendingChecks.keys()].filter((id) => (sellerCountCache.get(id) ?? 0) >= dealerThreshold)
  );
  if (dealerIds.size > 0) {
    console.log(`[autoplac] Odfiltrowano ${dealerIds.size} handlarzy podających się za prywatnych (próg: ${dealerThreshold} ogłoszeń)`);
  }

  const filtered: ScrapedListingDraft[] = [];
  for (const l of pool) {
    if (filtered.length >= target) break;
    if (!criteria.includeDealers) {
      if (l.sellerType === 'firma') continue;
      if (l.sellerId && dealerIds.has(l.sellerId)) continue;
    }
    filtered.push(l);
    onListingFetched?.();
  }

  return filtered;
}

async function searchMock(criteria: SearchCriteria): Promise<ScrapedListingDraft[]> {
  const entries = CAR_CATALOG.filter(
    (e) =>
      (!criteria.brand || e.brand.toLowerCase() === criteria.brand.toLowerCase()) &&
      (!criteria.model || e.model.toLowerCase() === criteria.model.toLowerCase()),
  );
  const listings = entries.flatMap((entry) =>
    generateListingsForEntry(entry, {
      source: 'autoplac',
      seedOffset: 300,
      count: 2,
      priceDeviationsPercent: [-18, 5],
    }),
  );
  return criteria.priceMax ? listings.filter((l) => l.price <= criteria.priceMax!) : listings;
}

export const autoplacScraper: CarScraper = {
  source: 'autoplac',
  async search(criteria: SearchCriteria, onListingFetched?: () => void) {
    return getScraperMode() === 'live' ? searchLive(criteria, onListingFetched) : searchMock(criteria);
  },
};
