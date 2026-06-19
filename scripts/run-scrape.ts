import 'dotenv/config';
import { runScrapeAndIngest } from '@/lib/ingestListings';
import { getScraperMode } from '@/lib/scrapers/mode';

async function main() {
  console.log(`Tryb scrapera: ${getScraperMode()}`);
  // ponytail: userId=1 — CLI scrape runs as the first user account
  const result = await runScrapeAndIngest({}, 1);
  console.log(
    `Skan zakończony. Znaleziono: ${result.totalFound}, nowych: ${result.newCount}, ` +
      `zaktualizowanych: ${result.updatedCount}.`
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Błąd podczas skanowania:', err);
    process.exit(1);
  });
