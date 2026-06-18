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
  const { dealerListingThreshold } = getSettings();
  const enriched: SearchCriteria = { dealerListingThreshold, ...criteria };

  const results = await Promise.all(
    ALL_SCRAPERS.map((scraper) =>
      scraper.search(enriched, onListingFetched).catch((err) => {
        console.error(`[scraper:${scraper.source}] błąd wyszukiwania:`, err);
        return [] as ScrapedListingDraft[];
      })
    )
  );

  // Scraperzy już usunęli handlarzy — tu tylko deduplikacja cross-portal
  const seen = new Set<string>();
  return results.flat().filter((l) => {
    const key = `${l.price}|${l.productionYear}|${l.mileage}|${(l.city ?? '').toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export { olxScraper, otomotoScraper };
export type { CarScraper, ScrapedListingDraft, SearchCriteria };
