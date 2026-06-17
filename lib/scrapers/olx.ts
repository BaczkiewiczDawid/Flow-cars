import type { CarScraper, ScrapedListingDraft, SearchCriteria } from './types';
import { CAR_CATALOG, generateListingsForEntry } from './catalog';
import { politeFetch } from './httpClient';
import { normalizeFuelType, normalizeGearbox } from './parseHelpers';
import { getScraperMode } from './mode';

const MAX_LISTINGS_DEFAULT = Number(process.env.SCRAPER_MAX_LISTINGS ?? '8');

const OLX_API = 'https://www.olx.pl/api/v1/offers/';
const OLX_CAT_CARS = 84;
// Lokalizacja domyślna: Gliwice, woj. Śląskie
const OLX_REGION_SLASKIE = 6;
const OLX_CITY_GLIWICE = 6091;

function buildApiUrl(criteria: SearchCriteria, offset: number): string {
  const parts = [
    `offset=${offset}`,
    'limit=50',
    `category_id=${OLX_CAT_CARS}`,
    'sort_by=created_at:desc',
    'filter_enum_condition[0]=notdamaged',
  ];
  if (criteria.priceMax) parts.push(`filter_float_price:to=${criteria.priceMax}`);

  const city = criteria.locationCity?.toLowerCase();
  if (city === 'gliwice' || !city) {
    parts.push(`region_id=${OLX_REGION_SLASKIE}`, `city_id=${OLX_CITY_GLIWICE}`);
  }
  if (criteria.locationRadiusKm) parts.push(`distance=${criteria.locationRadiusKm}`);

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
    .map((ph: any) => (ph.link as string).replace('{width}x{height}', '800x600'))
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
  const maxListings = criteria.maxListings ?? MAX_LISTINGS_DEFAULT;
  const results: ScrapedListingDraft[] = [];
  let offset = 0;

  while (results.length < maxListings) {
    const url = buildApiUrl(criteria, offset);
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
      if (results.length >= maxListings) break;
      results.push(mapListing(item));
      onListingFetched?.();
    }

    if (!json.links?.next || items.length < 50) break;
    offset += 50;
  }

  if (results.length === 0) {
    console.warn(
      '[olx scraper] Brak wyników z API OLX. Sprawdź URL:', buildApiUrl(criteria, 0)
    );
  }

  return results;
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
