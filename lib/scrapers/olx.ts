import type { CarScraper, ScrapedListingDraft, SearchCriteria } from './types';
import { CAR_CATALOG, generateListingsForEntry } from './catalog';
import { politeFetch } from './httpClient';
import { normalizeFuelType, normalizeGearbox, slugifyCity } from './parseHelpers';
import { getScraperMode } from './mode';
import { getSettings } from '../settings';

const MAX_LISTINGS_DEFAULT = Number(process.env.SCRAPER_MAX_LISTINGS ?? '8');

const OLX_API = 'https://www.olx.pl/api/v1/offers/';
const OLX_USER_API = 'https://www.olx.pl/api/v1/users/';
const OLX_CAT_CARS = 84;

// ponytail: module-level cache, lives as long as the process
const sellerCountCache = new Map<string, number>();

async function getSellerCarCount(sellerId: string): Promise<number> {
  if (sellerCountCache.has(sellerId)) return sellerCountCache.get(sellerId)!;
  try {
    const json = JSON.parse(
      await politeFetch(`${OLX_USER_API}${sellerId}/offers/?category_id=${OLX_CAT_CARS}&limit=1`)
    );
    const count = (json.metadata?.total_count as number | undefined) ?? 0;
    sellerCountCache.set(sellerId, count);
    return count;
  } catch {
    sellerCountCache.set(sellerId, 0);
    return 0;
  }
}


interface OlxLocation { cityId: number; regionId: number }
const locationCache = new Map<string, OlxLocation | null>();

async function resolveOlxLocation(city: string): Promise<OlxLocation | null> {
  const slug = slugifyCity(city);
  if (locationCache.has(slug)) return locationCache.get(slug)!;

  try {
    const html = await fetch(`https://www.olx.pl/motoryzacja/samochody/${slug}/`, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'pl-PL' },
    }).then((r) => r.text());

    const cityId = html.match(/city_id=(\d+)/)?.[1];
    const regionId = html.match(/region_id=(\d+)/)?.[1];
    const result = cityId && regionId
      ? { cityId: Number(cityId), regionId: Number(regionId) }
      : null;
    locationCache.set(slug, result);
    if (!result) console.warn(`[olx] Nie udało się ustalić city_id dla: ${city} (slug: ${slug})`);
    return result;
  } catch {
    locationCache.set(slug, null);
    return null;
  }
}

async function buildApiUrl(criteria: SearchCriteria, offset: number): Promise<string> {
  const parts = [
    `offset=${offset}`,
    'limit=50',
    `category_id=${OLX_CAT_CARS}`,
    'sort_by=created_at:desc',
    'filter_enum_condition[0]=notdamaged',
  ];
  if (criteria.priceMin) parts.push(`filter_float_price:from=${criteria.priceMin}`);
  if (criteria.priceMax) parts.push(`filter_float_price:to=${criteria.priceMax}`);

  if (criteria.locationCity) {
    const loc = await resolveOlxLocation(criteria.locationCity);
    if (loc) {
      parts.push(`region_id=${loc.regionId}`, `city_id=${loc.cityId}`);
      if (criteria.locationRadiusKm) parts.push(`distance=${criteria.locationRadiusKm}`);
    }
  }

  return `${OLX_API}?${parts.join('&')}`;
}

function param(params: any[], key: string): string | undefined {
  const entry = params.find((x: any) => x.key === key);
  if (!entry) return undefined;
  return (entry.value?.key as string | undefined) ?? (entry.value?.label as string | undefined);
}

function paramNum(params: any[], key: string): number {
  const v = param(params, key);
  return v ? Number(v) : 0;
}

function mapListing(item: any): ScrapedListingDraft {
  const params: any[] = item.params ?? [];
  const price = (params.find((p: any) => p.key === 'price')?.value?.value as number | undefined) ?? 0;
  const photos: string[] = ((item.photos ?? []) as any[])
    .map((ph: any) => (ph.link as string).replace('{width}x{height}', '1920x1440'))
    .slice(0, 24);

  const model = (params.find((p: any) => p.key === 'model')?.value?.label as string | undefined) ?? '';
  const brand = (item.title as string).split(' ')[0] ?? 'Nieznana';

  return {
    source: 'olx',
    externalId: String(item.id as number),
    url: item.url as string,
    title: item.title as string,
    brand,
    model,
    generation: undefined,
    productionYear: paramNum(params, 'year'),
    engineCapacity: paramNum(params, 'enginesize') || undefined,
    enginePower: paramNum(params, 'enginepower') || undefined,
    fuelType: normalizeFuelType(param(params, 'petrol') ?? null),
    gearbox: normalizeGearbox(param(params, 'transmission') ?? null),
    bodyType: (params.find((p: any) => p.key === 'car_body')?.value?.label as string | undefined) ?? undefined,
    color: (params.find((p: any) => p.key === 'color')?.value?.label as string | undefined) ?? undefined,
    mileage: paramNum(params, 'milage'),
    price: Number(price),
    currency: 'PLN',
    city: (item.location?.city?.name as string | undefined),
    voivodeship: (item.location?.region?.name as string | undefined),
    description: (item.description as string | undefined) ?? '',
    equipment: [],
    photos,
    mainPhoto: photos[0],
    sellerId: item.user?.id ? String(item.user.id as number) : undefined,
    sellerName: (item.user?.name as string | undefined),
    sellerPhone: undefined,
    sellerType: (item.business as boolean) ? 'firma' : 'prywatny',
    listedAt: item.created_time ? new Date(item.created_time as string) : undefined,
  };
}

async function searchLive(
  criteria: SearchCriteria,
  onListingFetched?: () => void
): Promise<ScrapedListingDraft[]> {
  const target = criteria.maxListings ?? MAX_LISTINGS_DEFAULT;
  const dealerThreshold = criteria.dealerListingThreshold ?? getSettings().dealerListingThreshold;

  const pendingChecks = new Map<string, Promise<number>>();
  const all: ScrapedListingDraft[] = [];
  let offset = 0;

  while (true) {
    const url = await buildApiUrl(criteria, offset);
    let json: any;
    try {
      json = JSON.parse(await politeFetch(url));
    } catch (err) {
      console.error('[olx scraper] błąd pobierania API:', err);
      break;
    }

    const items: any[] = json.data ?? [];
    if (items.length === 0) break;

    for (const item of items) {
      const draft = mapListing(item);
      all.push(draft);
      // kick off profile check immediately — overlaps with next page fetch
      if (draft.sellerType === 'prywatny' && draft.sellerId && !pendingChecks.has(draft.sellerId)) {
        pendingChecks.set(draft.sellerId, getSellerCarCount(draft.sellerId));
      }
    }

    const filteredCount = all.filter((l) => {
      if (l.sellerType === 'firma') return false;
      return !l.sellerId || !pendingChecks.has(l.sellerId);
    }).length;

    if (filteredCount >= target) break;
    if (!json.links?.next || items.length < 50) break;
    offset += 50;
  }

  if (all.length === 0) {
    console.warn('[olx scraper] Brak wyników z API OLX.');
  }

  await Promise.allSettled([...pendingChecks.values()]);

  const dealerIds = new Set(
    [...pendingChecks.keys()].filter((id) => (sellerCountCache.get(id) ?? 0) >= dealerThreshold)
  );
  if (dealerIds.size > 0) {
    console.log(`[olx] Odfiltrowano ${dealerIds.size} handlarzy podających się za prywatnych (próg: ${dealerThreshold} ogłoszeń)`);
  }

  const filtered: ScrapedListingDraft[] = [];
  for (const l of all) {
    if (filtered.length >= target) break;
    if (l.sellerType === 'firma') continue;
    if (l.sellerId && dealerIds.has(l.sellerId)) continue;
    filtered.push(l);
    onListingFetched?.();
  }

  return filtered;
}

async function searchMock(criteria: SearchCriteria): Promise<ScrapedListingDraft[]> {
  const entries = CAR_CATALOG.filter(
    (e) =>
      (!criteria.brand || e.brand.toLowerCase() === criteria.brand.toLowerCase()) &&
      (!criteria.model || e.model.toLowerCase() === criteria.model.toLowerCase())
  );

  const listings = entries.flatMap((entry) =>
    generateListingsForEntry(entry, {
      source: 'olx',
      seedOffset: 100,
      count: 4,
      priceDeviationsPercent: [-24, -4, 2, 9],
    })
  );

  return criteria.priceMax ? listings.filter((l) => l.price <= criteria.priceMax!) : listings;
}

export const olxScraper: CarScraper = {
  source: 'olx',
  async search(criteria: SearchCriteria, onListingFetched?: () => void) {
    return getScraperMode() === 'live' ? searchLive(criteria, onListingFetched) : searchMock(criteria);
  },
};
