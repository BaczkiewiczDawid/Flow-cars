/** Domyślny tryb scrapera to "live" - jeśli .env nie ustawia SCRAPER_MODE, próbujemy realnych danych. */
export function getScraperMode(): 'live' | 'mock' {
  return process.env.SCRAPER_MODE === 'mock' ? 'mock' : 'live';
}
