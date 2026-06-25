import type { CarScraper, ScrapedListingDraft, SearchCriteria } from './types';
import { olxScraper } from './olx';
import { otomotoScraper } from './otomoto';
import { autoplacScraper } from './autoplac';
import { getSettings } from '../settings';

export const ALL_SCRAPERS: CarScraper[] = [olxScraper, otomotoScraper, autoplacScraper];

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

  // Scraperzy już usunęli handlarzy — tu filtr cenowy + deduplikacja cross-portal
  const { priceMin, priceMax } = enriched;
  const seen = new Set<string>();
  return results.flat().filter((l) => {
    if (priceMin && l.price < priceMin) return false;
    if (priceMax && l.price > priceMax) return false;
    const key = `${l.price}|${l.productionYear}|${l.mileage}|${(l.city ?? '').toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export { olxScraper, otomotoScraper, autoplacScraper };
export type { CarScraper, ScrapedListingDraft, SearchCriteria };
