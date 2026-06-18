import type { CarScraper, ScrapedListingDraft, SearchCriteria } from './types';
import { olxScraper } from './olx';
import { otomotoScraper } from './otomoto';
import { getSettings } from '../settings';

export const ALL_SCRAPERS: CarScraper[] = [olxScraper, otomotoScraper];

/** Szuka na wszystkich serwisach równolegle wg podanych kryteriów (marka/model opcjonalne). */
export async function searchAll(
  criteria: SearchCriteria = {},
  onListingFetched?: () => void
): Promise<ScrapedListingDraft[]> {
  const results = await Promise.all(
    ALL_SCRAPERS.map((scraper) =>
      scraper.search(criteria, onListingFetched).catch((err) => {
        console.error(`[scraper:${scraper.source}] błąd wyszukiwania:`, err);
        return [] as ScrapedListingDraft[];
      })
    )
  );
  const flat = results.flat();

  const { dealerListingThreshold } = getSettings();

  const sellerListingCount = new Map<string, number>();
  for (const l of flat) {
    const sid = l.sellerId ?? l.sellerName;
    if (sid) sellerListingCount.set(sid, (sellerListingCount.get(sid) ?? 0) + 1);
  }

  const seen = new Set<string>();
  return flat.filter((l) => {
    const dedupeKey = `${l.price}|${l.productionYear}|${l.mileage}|${(l.city ?? '').toLowerCase()}`;
    if (seen.has(dedupeKey)) return false;
    seen.add(dedupeKey);

    if (l.sellerType === 'firma') return false;
    const sid = l.sellerId ?? l.sellerName;
    if (sid && (sellerListingCount.get(sid) ?? 0) >= dealerListingThreshold) return false;

    return true;
  });
}

export { olxScraper, otomotoScraper };
export type { CarScraper, ScrapedListingDraft, SearchCriteria };
