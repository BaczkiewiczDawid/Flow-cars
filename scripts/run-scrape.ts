import 'dotenv/config';
import { runScrapeAndIngest } from '@/lib/ingestListings';
import { getScraperMode } from '@/lib/scrapers/mode';
import { db } from '@/db';
import { users } from '@/db/schema';

async function main() {
  const [firstUser] = await db.select({ id: users.id }).from(users).limit(1);
  if (!firstUser) throw new Error('Brak użytkowników — utwórz konto na /setup przed scrapowaniem.');

  console.log(`Tryb scrapera: ${getScraperMode()}`);
  const result = await runScrapeAndIngest({}, firstUser.id);
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
