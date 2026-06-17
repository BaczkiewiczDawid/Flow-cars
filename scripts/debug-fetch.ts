import 'dotenv/config';
import { writeFileSync, mkdirSync } from 'fs';
import { politeFetch } from '../lib/scrapers/httpClient';

/**
 * Narzędzie diagnostyczne: pobiera surowy HTML podanego adresu (OLX/Otomoto)
 * i zapisuje go do pliku w `debug/`, żebyś mógł go otworzyć w edytorze albo
 * w przeglądarce i sprawdzić realną strukturę strony - to ten krok, którego
 * nie mógł wykonać model AI piszący scrapery (środowisko, w którym powstał
 * kod, nie miało dostępu do olx.pl / otomoto.pl).
 *
 * Użycie:
 *   npm run scrape:debug -- https://www.olx.pl/motoryzacja/samochody/volkswagen/golf/
 *   npm run scrape:debug -- https://www.otomoto.pl/osobowe/oferta/przyklad-ID123abc.html
 */

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error('Podaj adres URL jako argument, np.:');
    console.error('  npm run scrape:debug -- https://www.olx.pl/motoryzacja/samochody/volkswagen/golf/');
    process.exit(1);
  }

  console.log(`Pobieram: ${url}`);
  const html = await politeFetch(url);

  mkdirSync('debug', { recursive: true });
  const filename = `debug/${Date.now()}-${url.replace(/[^a-z0-9]+/gi, '-').slice(0, 80)}.html`;
  writeFileSync(filename, html, 'utf-8');

  console.log(`Zapisano ${html.length} znaków do ${filename}`);
  console.log('Otwórz ten plik w przeglądarce (podgląd wizualny) albo w edytorze ');
  console.log('(Ctrl+F po nazwach pól typu "Rok produkcji", "Przebieg"), żeby zobaczyć');
  console.log('realny układ HTML i poprawić selektory w lib/scrapers/olx.ts lub otomoto.ts.');
}

main().catch((err) => {
  console.error('Błąd:', err);
  process.exit(1);
});
