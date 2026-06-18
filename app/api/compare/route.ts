import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';
import { estimateMarketPrice, canonicalFuel } from '@/lib/marketAnalysis';
import { getGenerationRange } from '@/lib/generationLookup';
import { parallelFetch } from '@/lib/scrapers/httpClient';
import { normalizeFuelType } from '@/lib/scrapers/parseHelpers';
import { otomotoScraper } from '@/lib/scrapers';
import type { ScrapedListingDraft } from '@/lib/scrapers/types';

interface ParsedParams {
  brand?: string;
  model?: string;
  year?: number;
  mileage?: number;
  engineCapacity?: number;
  enginePower?: number;
  fuelType?: string;
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

  if (url) {
    const parsed = url.includes('otomoto.pl')
      ? await parseOtomotoUrl(url)
      : url.includes('olx.pl')
      ? await parseOlxUrl(url)
      : {};
    brand = brand || parsed.brand;
    model = model || parsed.model;
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

  const [priceResult, rawListings] = await Promise.all([
    estimateMarketPrice(brand, model, carParams),
    otomotoScraper.search({
      brand,
      model,
      yearMin: genRange?.yearFrom ?? (year ? year - 1 : undefined),
      yearMax: genRange?.yearTo !== 9999 ? genRange?.yearTo : undefined,
      maxPages: 2,
      maxListings: 24,
    }),
  ]);

  const targetFuel = canonicalFuel(fuelType);
  const listings = filterDealers(rawListings)
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
