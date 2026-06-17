import * as cheerio from 'cheerio';
import type { CarScraper, ScrapedListingDraft, SearchCriteria } from './types';
import { CAR_CATALOG, generateListingsForEntry } from './catalog';
import { politeFetch } from './httpClient';
import { categorySearchUrl, cleanListingUrl } from './urls';
import {
  normalizeFuelType,
  normalizeGearbox,
} from './parseHelpers';

import { getScraperMode } from './mode';

const MAX_LISTINGS_DEFAULT = Number(process.env.SCRAPER_MAX_LISTINGS ?? '8');

/**
 * Scraper Otomoto, oparty na realnej strukturze stron zweryfikowanej ręcznie
 * (czerwiec 2026): https://www.otomoto.pl/osobowe/{marka}/{model} dla listy
 * wyników i https://www.otomoto.pl/osobowe/oferta/...-ID{id}.html dla
 * pojedynczego ogłoszenia. Otomoto ma bogatszą, skategoryzowaną sekcję
 * "Wyposażenie" niż OLX, co wykorzystujemy poniżej.
 *
 * Te same ograniczenia jak w przypadku OLX - patrz komentarz na górze
 * lib/scrapers/olx.ts (brak API, numer telefonu niedostępny, ryzyko
 * blokady ruchu z serwerów/centrów danych, możliwa potrzeba dostrojenia
 * po zmianie struktury strony - użyj `npm run scrape:debug -- <url>`).
 */

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
  if (criteria.priceMax) parts.push(`search[filter_float_price:to]=${criteria.priceMax}`);
  if (criteria.locationRadiusKm) parts.push(`search[filter_float_radius:to]=${criteria.locationRadiusKm}`);
  if (criteria.yearMin) parts.push(`search[filter_float_year:from]=${criteria.yearMin}`);
  if (page > 1) parts.push(`page=${page}`);
  return `${base}?${parts.join('&')}`;
}

function parseSearchResultsHtml(html: string): string[] {
  const $ = cheerio.load(html);
  const urls = new Set<string>();

  $('a[href*="/oferta/"]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    const absolute = href.startsWith('http') ? href : `https://www.otomoto.pl${href}`;
    if (!absolute.includes('otomoto.pl')) return;
    if (!/-ID[a-zA-Z0-9]+\.html/.test(absolute)) return;
    urls.add(cleanListingUrl(absolute));
  });

  return Array.from(urls);
}

async function parseListingDetail(url: string): Promise<ScrapedListingDraft | null> {
  const html = await politeFetch(url);
  const $ = cheerio.load(html);

  const idMatch = url.match(/-ID([a-zA-Z0-9]+)\.html/);
  if (!idMatch) return null;
  const externalId = idMatch[1];

  // Główne źródło: __NEXT_DATA__ JSON (kompletne, strukturalne dane) --------
  let advert: Record<string, any> = {};
  try {
    const nd = $('script#__NEXT_DATA__').html();
    if (nd) advert = JSON.parse(nd)?.props?.pageProps?.advert ?? {};
  } catch {}

  // Helper: pobiera label/value z parametersDict
  const param = (key: string): string | undefined =>
    (advert?.parametersDict?.[key]?.values?.[0]?.label as string | undefined);
  const paramVal = (key: string): string | undefined =>
    (advert?.parametersDict?.[key]?.values?.[0]?.value as string | undefined);

  const title = (advert.title as string | undefined) ??
    $('title').text().replace(/\s*-\s*Otomoto\.pl\s*$/i, '').trim();
  const brand = param('make') ?? 'Nieznana';
  const model = param('model') ?? '';
  const productionYear = Number(paramVal('year')) || 0;
  const price = Number((advert?.price as any)?.value) || 0;
  const mileage = Number(paramVal('mileage')) || 0;
  const engineCapacity = Number(paramVal('engine_capacity')) || undefined;
  const enginePower = Number(paramVal('engine_power')) || undefined;
  const fuelType = normalizeFuelType(param('fuel_type') ?? null);
  const gearbox = normalizeGearbox(param('gearbox') ?? null);
  const bodyType = param('body_type') ?? undefined;
  const color = param('color') ?? undefined;

  const sellerLoc = advert?.seller?.location as Record<string, any> | undefined;
  const city = sellerLoc?.city as string | undefined;
  const voivodeship = (sellerLoc?.region as string | undefined) || undefined;
  const sellerTypeRaw = advert?.seller?.type as string | undefined;
  const sellerType = sellerTypeRaw === 'PROFESSIONAL' ? 'firma'
    : sellerTypeRaw === 'PRIVATE' ? 'prywatny'
    : undefined;
  const sellerName = advert?.seller?.name as string | undefined;

  const photosRaw: any[] = advert?.images?.photos ?? [];
  const photos = (photosRaw as Array<{ url: string }>)
    .map((p) => p.url)
    .filter(Boolean)
    .slice(0, 24);

  // Opis: strip HTML tagów z opisu Otomoto
  const descHtml = (advert.description as string | undefined) ?? '';
  const description = descHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  if (!productionYear || !mileage || price === 0) {
    console.warn(
      `[otomoto scraper] Niepełne dane dla ${url} (rok=${productionYear}, przebieg=${mileage}, cena=${price}). ` +
        'Sprawdź ręcznie z `npm run scrape:debug -- <url>`.'
    );
  }

  return {
    source: 'otomoto',
    externalId,
    url,
    title,
    brand,
    model,
    generation: undefined,
    productionYear,
    engineCapacity,
    enginePower,
    fuelType,
    gearbox,
    bodyType,
    color,
    mileage,
    price,
    currency: 'PLN',
    city,
    voivodeship,
    description,
    equipment: [],
    photos,
    mainPhoto: photos[0],
    sellerPhone: undefined,
    sellerType,
    sellerName,
    listedAt: advert.createdAt ? new Date(advert.createdAt as string) : undefined,
  };
}

async function searchLive(criteria: SearchCriteria, onListingFetched?: () => void): Promise<ScrapedListingDraft[]> {
  const maxPages = criteria.maxPages ?? 1;
  const maxListings = criteria.maxListings ?? MAX_LISTINGS_DEFAULT;
  const found: string[] = [];

  for (let page = 1; page <= maxPages; page++) {
    let html: string;
    try {
      html = await politeFetch(buildSearchUrl(criteria, page));
    } catch (err) {
      console.error('[otomoto scraper] błąd pobierania listy wyników:', err);
      break;
    }
    const pageResults = parseSearchResultsHtml(html);
    if (pageResults.length === 0) break;
    found.push(...pageResults);
    if (found.length >= maxListings) break;
  }

  if (found.length === 0) {
    console.warn(
      '[otomoto scraper] Brak linków do ogłoszeń na stronie wyników. Możliwe przyczyny: ' +
        'zmiana struktury strony Otomoto, blokada / captcha, albo brak ofert dla tych kryteriów. ' +
        `Sprawdź \`npm run scrape:debug -- ${buildSearchUrl(criteria, 1)}\`.`
    );
    return [];
  }

  const urls = found.slice(0, maxListings);
  const results: ScrapedListingDraft[] = [];
  for (const url of urls) {
    try {
      const draft = await parseListingDetail(url);
      if (draft) results.push(draft);
    } catch (err) {
      console.error(`[otomoto scraper] błąd parsowania ${url}:`, err);
    }
    onListingFetched?.();
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
