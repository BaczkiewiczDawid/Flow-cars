import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';
import { estimateMarketPrice, canonicalFuel } from '@/lib/marketAnalysis';
import { getGenerationRange } from '@/lib/generationLookup';
import { parallelFetch } from '@/lib/scrapers/httpClient';
import { normalizeFuelType } from '@/lib/scrapers/parseHelpers';
import { otomotoScraper, autoplacScraper } from '@/lib/scrapers';
import type { ScrapedListingDraft } from '@/lib/scrapers/types';

interface ParsedParams {
  brand?: string;
  model?: string;
  urlSlug?: string;
  year?: number;
  mileage?: number;
  engineCapacity?: number;
  enginePower?: number;
  fuelType?: string;
}

function bmwOtomotoSlug(model: string): string | undefined {
  const s = model.toUpperCase();
  const series = s.match(/^(\d)\d/);
  if (series) return `seria-${series[1]}`;
  const x = s.match(/^X(\d)/); if (x) return `x${x[1]}`;
  const m = s.match(/^M(\d)/); if (m) return `m${m[1]}`;
  const z = s.match(/^Z(\d)/); if (z) return `z${z[1]}`;
  return undefined;
}

async function parseOtomotoUrl(url: string): Promise<ParsedParams> {
  // Extract brand/model from slug as fallback: /oferta/volkswagen-polo-ID6HX43Y.html
  const slugMatch = url.match(/\/oferta\/(.+?)-ID[a-zA-Z0-9]+\.html/);
  const slug = slugMatch?.[1] ?? '';
  const slugParts = slug.split('-');
  const urlBrand = slugParts[0];
  const urlModel = slugParts[1];

  try {
    const html = await parallelFetch(url);
    const $ = cheerio.load(html);
    const ndRaw = $('script#__NEXT_DATA__').html();
    if (!ndRaw) return { brand: urlBrand, model: urlModel };
    const nd = JSON.parse(ndRaw);

    // Primary: pageProps.advert.parametersDict (current OtoMoto structure)
    const advert = nd?.props?.pageProps?.advert;
    if (advert?.parametersDict) {
      const pd = advert.parametersDict as Record<string, { values: { value: string }[] }>;
      const pval = (k: string) => { const v = Number(pd[k]?.values?.[0]?.value); return v || undefined; };
      const pstr = (k: string) => pd[k]?.values?.[0]?.value as string | undefined;
      return {
        brand: pstr('make') ?? urlBrand,
        model: pstr('model') ?? urlModel,
        year: pval('year'),
        mileage: pval('mileage'),
        engineCapacity: pval('engine_capacity'),
        enginePower: pval('engine_power'),
        fuelType: normalizeFuelType(pstr('fuel_type') ?? null),
      };
    }

    // Fallback: urqlState (older OtoMoto structure)
    const urqlState: Record<string, { data: string }> =
      nd?.props?.pageProps?.urqlState ?? {};
    let params: Array<{ key: string; value: string }> = [];
    for (const key of Object.keys(urqlState)) {
      const parsed = JSON.parse(urqlState[key]?.data ?? '{}');
      if (parsed?.advert?.params) { params = parsed.advert.params; break; }
    }
    if (!params.length) params = advert?.params ?? advert?.parameters ?? [];
    if (!params.length) return { brand: urlBrand, model: urlModel };

    const pval = (k: string) => { const v = Number(params.find((p) => p.key === k)?.value); return v || undefined; };
    const pstr = (k: string) => params.find((p) => p.key === k)?.value;
    return {
      brand: urlBrand,
      model: urlModel,
      year: pval('year'),
      mileage: pval('mileage'),
      engineCapacity: pval('engine_capacity'),
      enginePower: pval('engine_power'),
      fuelType: normalizeFuelType(pstr('fuel_type') ?? null),
    };
  } catch {
    return { brand: urlBrand, model: urlModel };
  }
}

async function parseOlxUrl(url: string): Promise<ParsedParams> {
  try {
    // OLX is a SPA — no __NEXT_DATA__. JSON-LD Vehicle schema IS in SSR HTML.
    const html = await parallelFetch(url.split('?')[0]);
    const $ = cheerio.load(html);

    let ldJson: any = null;
    $('script[type="application/ld+json"]').each((_, el) => {
      const text = $(el).html() ?? '';
      if (text.includes('"Vehicle"')) {
        try { ldJson = JSON.parse(text); } catch { /* skip malformed */ }
      }
    });
    if (!ldJson) return {};

    const brand = ldJson.brand as string | undefined;
    const model = ldJson.model as string | undefined;
    const yearFromLd = ldJson.productionDate ? Number(ldJson.productionDate) : undefined;
    const sku = ldJson.sku as string | undefined;

    if (!sku) return { brand, model, year: yearFromLd };

    // sku is the numeric offer ID — OLX REST API accepts it
    const apiJson = JSON.parse(
      await parallelFetch(`https://www.olx.pl/api/v1/offers/${sku}/`)
    );
    const params: any[] = apiJson.data?.params ?? [];
    // Detail API returns { value: { key: "...", label: "..." } } — not value.value like search
    const pval = (k: string) => {
      const e = params.find((x: any) => x.key === k);
      const v = e?.value?.key ?? e?.value?.value;
      return v !== undefined ? Number(v) : undefined;
    };
    const pstr = (k: string) => {
      const e = params.find((x: any) => x.key === k);
      return (e?.value?.key as string | undefined) ?? (e?.value?.label as string | undefined);
    };

    return {
      brand,
      model,
      year: pval('year') ?? yearFromLd,
      mileage: pval('milage'),
      engineCapacity: pval('enginesize'),
      enginePower: pval('enginepower'),
      fuelType: normalizeFuelType(pstr('petrol') ?? null),
    };
  } catch {
    return {};
  }
}

function deepFind(obj: any, keys: string[]): any {
  if (obj == null) return null;
  if (Array.isArray(obj)) {
    for (const item of obj) { const f = deepFind(item, keys); if (f) return f; }
    return null;
  }
  if (typeof obj !== 'object') return null;
  if (keys.every((k) => k in obj)) return obj;
  for (const v of Object.values(obj)) { const f = deepFind(v, keys); if (f) return f; }
  return null;
}

async function parseAutoplacUrl(url: string): Promise<ParsedParams> {
  const parts = new URL(url).pathname.split('/').filter(Boolean);
  // /oferta/{brand}/{model}/{slug}  (4 parts)
  // /oferta/{brand}/{slug}          (3 parts — no model segment)
  const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : undefined);
  const brandSlug = parts[1] ?? '';
  const brand = cap(brandSlug);
  const hasModelSeg = parts.length >= 4;
  const modelFromPath = hasModelSeg ? cap(parts[2] ?? '') : undefined;
  const slug = hasModelSeg ? (parts[3] ?? '') : (parts[2] ?? '');

  const yearFromSlug = slug.match(/(\d{4})r/)?.[1] ? Number(slug.match(/(\d{4})r/)![1]) : undefined;

  try {
    const html = await parallelFetch(url);
    const $ = cheerio.load(html);

    // ng-state (Angular SSR transfer state)
    const raw = $('script#ng-state').text();
    if (raw) {
      try {
        const offer = deepFind(JSON.parse(raw), ['productionYear', 'mileage']);
        if (offer) {
          const model: string = offer.model ?? modelFromPath ?? '';
          const urlSlug = brand?.toLowerCase() === 'bmw' ? bmwOtomotoSlug(model) : undefined;
          return {
            brand: offer.brand ?? brand,
            model: model || undefined,
            urlSlug,
            year: offer.productionYear,
            mileage: offer.mileage,
            engineCapacity: offer.engineCapacity,
            enginePower: offer.enginePowerKW ? Math.round(offer.enginePowerKW * 1.3596) : undefined,
            fuelType: normalizeFuelType(offer.fuelTypeText ?? offer.fuelType ?? null),
          };
        }
      } catch { /* malformed JSON */ }
    }

    // Fallback: model from img[alt] e.g. "BMW 330i 2021 na sprzedaż"
    let modelFromAlt: string | undefined;
    if (brandSlug) {
      $('img[alt]').each((_, el) => {
        if (modelFromAlt) return;
        const alt = $(el).attr('alt') ?? '';
        const m = alt.match(new RegExp(`${brandSlug}\\s+([A-Za-z0-9]+)`, 'i'));
        if (m?.[1] && m[1].length <= 10) modelFromAlt = m[1];
      });
    }

    const model = modelFromAlt ?? modelFromPath;
    const urlSlug = brand?.toLowerCase() === 'bmw' && model ? bmwOtomotoSlug(model) : undefined;
    return { brand, model, urlSlug, year: yearFromSlug };
  } catch {
    return { brand, model: modelFromPath, year: yearFromSlug };
  }
}

function filterDealers(listings: ScrapedListingDraft[]): ScrapedListingDraft[] {
  const count = new Map<string, number>();
  for (const l of listings) {
    const key = l.sellerId ?? l.sellerName;
    if (key) count.set(key, (count.get(key) ?? 0) + 1);
  }
  return listings.filter((l) => {
    if (l.sellerType === 'firma') return false;
    const key = l.sellerId ?? l.sellerName;
    return !key || (count.get(key) ?? 0) < 3;
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  let { url, brand, model, year, mileage, engineCapacity, fuelType, enginePower } = body as {
    url?: string;
    brand?: string; model?: string;
    year?: number; mileage?: number;
    engineCapacity?: number; enginePower?: number; fuelType?: string;
  };
  let urlSlug: string | undefined;

  if (url) {
    const parsed = url.includes('otomoto.pl')
      ? await parseOtomotoUrl(url)
      : url.includes('olx.pl')
      ? await parseOlxUrl(url)
      : url.includes('autoplac.pl')
      ? await parseAutoplacUrl(url)
      : {};
    brand = brand || parsed.brand;
    model = model || parsed.model;
    urlSlug = parsed.urlSlug;
    year = year || parsed.year;
    mileage = mileage || parsed.mileage;
    engineCapacity = engineCapacity || parsed.engineCapacity;
    enginePower = enginePower || parsed.enginePower;
    fuelType = fuelType || parsed.fuelType;
  }

  if (!brand || !model) {
    return NextResponse.json(
      { error: 'Nie udało się ustalić marki i modelu. Wpisz parametry ręcznie.' },
      { status: 400 }
    );
  }

  // Generation lookup first — defines year bounds for both price and display listings
  const genRange = year ? await getGenerationRange(brand, model, year) : null;

  const carParams = {
    productionYear: year ?? 0,
    mileage: mileage ?? 0,
    fuelType,
    yearFrom: genRange?.yearFrom,
    yearTo: genRange?.yearTo,
  };

  const searchCriteria = {
    brand,
    model,
    urlSlug,
    yearMin: genRange?.yearFrom ?? (year ? year - 1 : undefined),
    yearMax: genRange?.yearTo !== 9999 ? genRange?.yearTo : undefined,
    maxListings: 16,
    includeDealers: true,
  };

  // autoplac needs more pages because brand/model filtering is client-side
  const autoplacCriteria = { ...searchCriteria, maxPages: 8 };
  const otoMotoCriteria = { ...searchCriteria, maxPages: 2 };

  const [priceResult, otomotoListings, autoplacListings] = await Promise.all([
    estimateMarketPrice(brand, model, carParams),
    otomotoScraper.search(otoMotoCriteria),
    autoplacScraper.search(autoplacCriteria),
  ]);
  const rawListings = [...otomotoListings, ...autoplacListings];

  const targetFuel = canonicalFuel(fuelType);
  const listings = rawListings
    .filter((l) => {
      if (!targetFuel) return true;
      const lFuel = canonicalFuel(l.fuelType ?? null);
      return !lFuel || lFuel === targetFuel;
    })
    .map((l) => ({
    url: l.url,
    title: l.title,
    price: l.price,
    year: l.productionYear,
    mileage: l.mileage,
    engineCapacity: l.engineCapacity,
    enginePower: l.enginePower,
    fuelType: l.fuelType,
    city: l.city,
    mainPhoto: l.mainPhoto,
    source: l.source,
  }));

  return NextResponse.json({ brand, model, year, mileage, fuelType, generationRange: genRange, ...priceResult, listings });
}
