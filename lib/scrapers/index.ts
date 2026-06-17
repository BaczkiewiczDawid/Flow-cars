import type { CarScraper, ScrapedListingDraft, SearchCriteria } from './types';
import { olxScraper } from './olx';
import { otomotoScraper } from './otomoto';

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
  return results.flat();
}

export { olxScraper, otomotoScraper };
export type { CarScraper, ScrapedListingDraft, SearchCriteria };
