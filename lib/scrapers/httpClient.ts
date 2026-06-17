const DELAY_MS = Number(process.env.SCRAPER_DELAY_MS ?? '1500');

let lastRequestAt = 0;

/**
 * "Uprzejmy" fetch do trybu live scrapera:
 * - ustawia nagłówki podobne do zwykłej przeglądarki,
 * - wymusza minimalny odstęp między żądaniami (SCRAPER_DELAY_MS),
 *   żeby nie zarzucać serwisu requestami i zmniejszyć ryzyko zablokowania IP.
 *
 * To NIE jest sposób na obejście blokad czy zabezpieczeń serwisu -
 * to zwykłe, etyczne ograniczenie częstotliwości requestów.
 */
export async function politeFetch(url: string): Promise<string> {
  const now = Date.now();
  const wait = Math.max(0, lastRequestAt + DELAY_MS - now);
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
  lastRequestAt = Date.now();

  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });

  if (!response.ok) {
    const hint =
      response.status === 403 || response.status === 429
        ? ' To często oznacza blokadę ruchu botów (np. Cloudflare/Datadome) - ' +
          'zwłaszcza z adresów IP serwerów/centrów danych. Spróbuj zwiększyć SCRAPER_DELAY_MS ' +
          'albo uruchomić skan z domowego/biurowego połączenia internetowego.'
        : ' Serwis mógł też zmienić strukturę strony.';
    throw new Error(`Scraper: błąd HTTP ${response.status} przy pobieraniu ${url}.${hint}`);
  }

  const text = await response.text();
  if (/captcha|are you a robot|access denied|przepraszamy.{0,20}błąd/i.test(text.slice(0, 3000))) {
    console.warn(
      `[scraper] Strona ${url} mogła zwrócić captchę / blokadę bota mimo statusu 200 - ` +
        'jeśli wyniki są puste, to prawdopodobna przyczyna.'
    );
  }

  return text;
}
