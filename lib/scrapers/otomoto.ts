import * as cheerio from 'cheerio';
import type { CarScraper, ScrapedListingDraft, SearchCriteria } from './types';
import { CAR_CATALOG, generateListingsForEntry } from './catalog';
import { politeFetch } from './httpClient';
import { categorySearchUrl } from './urls';
import { normalizeFuelType, normalizeGearbox } from './parseHelpers';
import { getScraperMode } from './mode';

const MAX_LISTINGS_DEFAULT = Number(process.env.SCRAPER_MAX_LISTINGS ?? '8');

function buildSearchUrl(criteria: SearchCriteria, page: number): string {
  const citySlug = criteria.locationCity?.toLowerCase().replace(/\s+/g, '-') ?? '';
  let base: string;
  if (criteria.brand && criteria.model) {
    const catUrl = categorySearchUrl('otomoto', criteria.brand, criteria.model, criteria.urlSlug);
    base = citySlug ? `${catUrl.replace(/\/$/, '')}/${citySlug}/` : catUrl;
  } else {
    base = citySlug
      ? `https://www.otomoto.pl/osobowe/${citySlug}/`
      : 'https://www.otomoto.pl/osobowe/';
  }
  const parts = [
    'search[order]=created_at:desc',
    'search[filter_enum_damaged][0]=0',
  ];
  if (criteria.priceMin) parts.push(`search[filter_float_price:from]=${criteria.priceMin}`);
  if (criteria.priceMax) parts.push(`search[filter_float_price:to]=${criteria.priceMax}`);
  if (criteria.locationRadiusKm) parts.push(`search[filter_float_radius:to]=${criteria.locationRadiusKm}`);
  if (criteria.yearMin) parts.push(`search[filter_float_year:from]=${criteria.yearMin}`);
  if (criteria.yearMax) parts.push(`search[filter_float_year:to]=${criteria.yearMax}`);
  if (page > 1) parts.push(`page=${page}`);
  return `${base}?${parts.join('&')}`;
}

function mapEdge(edge: any): ScrapedListingDraft | null {
  const node = edge.node;
  const url = node.url as string | undefined;
  if (!url) return null;
  const idMatch = url.match(/-ID([a-zA-Z0-9]+)\.html/);
  if (!idMatch) return null;

  const params: Array<{ key: string; value: string; displayValue: string }> = node.parameters ?? [];
  const pval = (k: string) => Number(params.find((p) => p.key === k)?.value) || 0;
  const pdisplay = (k: string): string | undefined =>
    params.find((p) => p.key === k)?.displayValue ?? params.find((p) => p.key === k)?.value;

  const photo = (node.thumbnail?.x2 as string | undefined) ?? (node.thumbnail?.x1 as string | undefined);
  const photos = photo ? [photo] : [];

  const sellerTypeName = node.seller?.__typename as string | undefined;
  const sellerType = sellerTypeName === 'ProfessionalSeller' ? 'firma' : 'prywatny';

  return {
    source: 'otomoto',
    externalId: idMatch[1],
    url,
    title: node.title as string ?? '',
    brand: pdisplay('make') ?? (node.title as string ?? '').split(' ')[0] ?? 'Nieznana',
    model: pdisplay('model') ?? '',
    generation: undefined,
    productionYear: pval('year'),
    engineCapacity: pval('engine_capacity') || undefined,
    enginePower: pval('engine_power') || undefined,
    fuelType: normalizeFuelType(pdisplay('fuel_type') ?? null),
    gearbox: normalizeGearbox(pdisplay('gearbox') ?? null),
    bodyType: pdisplay('body_type'),
    color: undefined,
    mileage: pval('mileage'),
    price: Number(node.price?.amount?.value) || 0,
    currency: 'PLN',
    city: node.location?.city?.name as string | undefined,
    voivodeship: node.location?.region?.name as string | undefined,
    description: (node.shortDescription as string | undefined) ?? '',
    equipment: [],
    photos,
    mainPhoto: photos[0],
    sellerId: node.seller?.id ? String(node.seller.id) : undefined,
    sellerName: (node.seller?.name as string | undefined) || undefined,
    sellerPhone: undefined,
    sellerType,
    listedAt: node.createdAt ? new Date(node.createdAt as string) : undefined,
  };
}

async function searchLive(
  criteria: SearchCriteria,
  onListingFetched?: () => void
): Promise<ScrapedListingDraft[]> {
  const maxPages = criteria.maxPages ?? 2;
  const maxListings = criteria.maxListings ?? MAX_LISTINGS_DEFAULT;
  const results: ScrapedListingDraft[] = [];

  for (let page = 1; page <= maxPages && results.length < maxListings; page++) {
    let html: string;
    try {
      html = await politeFetch(buildSearchUrl(criteria, page));
    } catch (err) {
      console.error('[otomoto scraper] błąd pobierania listy:', err);
      break;
    }

    const $ = cheerio.load(html);
    let edges: any[] = [];
    try {
      const nd = $('script#__NEXT_DATA__').html();
      if (!nd) break;
      const urqlState: Record<string, { data: string }> =
        JSON.parse(nd)?.props?.pageProps?.urqlState ?? {};
      for (const key of Object.keys(urqlState)) {
        const parsed = JSON.parse(urqlState[key]?.data ?? '{}');
        if (parsed?.advertSearch?.edges) { edges = parsed.advertSearch.edges; break; }
      }
    } catch { break; }

    if (edges.length === 0) {
      console.warn(`[otomoto scraper] Brak ogłoszeń na stronie ${page}. URL: ${buildSearchUrl(criteria, page)}`);
      break;
    }

    for (const edge of edges) {
      if (results.length >= maxListings) break;
      const draft = mapEdge(edge);
      if (draft) {
        results.push(draft);
        onListingFetched?.();
      }
    }
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
      source: 'otomoto',
      seedOffset: 200,
      count: 3,
      priceDeviationsPercent: [-31, 6, 13],
    })
  );
  return criteria.priceMax ? listings.filter((l) => l.price <= criteria.priceMax!) : listings;
}

export const otomotoScraper: CarScraper = {
  source: 'otomoto',
  async search(criteria: SearchCriteria, onListingFetched?: () => void) {
    return getScraperMode() === 'live' ? searchLive(criteria, onListingFetched) : searchMock(criteria);
  },
};
