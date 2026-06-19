import 'dotenv/config';
import { db } from './index';
import { cars, scrapeRuns, users } from './schema';
import { CAR_CATALOG, generateListingsForEntry } from '@/lib/scrapers/catalog';
import { ingestListings } from '@/lib/ingestListings';

/**
 * Generuje deterministyczne dane PRZYKŁADOWE (zawsze tryb mock, niezależnie
 * od SCRAPER_MODE w .env) - przydatne do podglądu UI offline albo do testów,
 * bez wysyłania jakichkolwiek requestów do OLX/Otomoto.
 *
 * Żeby pobrać prawdziwe ogłoszenia, użyj zamiast tego:
 *   npm run scrape
 */
async function main() {
  const [firstUser] = await db.select({ id: users.id }).from(users).limit(1);
  if (!firstUser) throw new Error('Brak użytkowników — utwórz konto na /setup przed seedowaniem.');

  console.log('Czyszczę istniejące dane...');
  await db.delete(cars);
  await db.delete(scrapeRuns);

  console.log('Generuję dane przykładowe (zawsze tryb mock, niezależnie od .env)...');
  const drafts = CAR_CATALOG.flatMap((entry) => [
    ...generateListingsForEntry(entry, {
      source: 'olx',
      seedOffset: 100,
      count: 4,
      priceDeviationsPercent: [-24, -4, 2, 9],
    }),
    ...generateListingsForEntry(entry, {
      source: 'otomoto',
      seedOffset: 200,
      count: 3,
      priceDeviationsPercent: [-31, 6, 13],
    }),
  ]);
  console.log(`Wygenerowano ${drafts.length} ogłoszeń, zapisuję do bazy...`);

  const result = await ingestListings(drafts, firstUser.id);
  console.log(
    `Gotowe. Nowych ofert: ${result.newCount}, zaktualizowanych: ${result.updatedCount}.`
  );
  console.log('To dane przykładowe. Żeby pobrać prawdziwe ogłoszenia, uruchom: npm run scrape');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Błąd podczas seedowania bazy:', err);
    process.exit(1);
  });
