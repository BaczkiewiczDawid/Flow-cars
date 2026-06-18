/** Wspólne budowanie adresów URL dla OLX i Otomoto, używane przez scraper "live" i generator danych przykładowych. */

function slug(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '-');
}

/** Domyślnie wymuszamy sensowny, większy rozmiar zdjęcia z CDN olxcdn.com. */
export function normalizePhotoUrl(src: string): string {
  return src.replace(/;s=\d+x\d+(;q=\d+)?/, ';s=1200x900');
}

/** Wyciąga unikalne adresy zdjęć z CDN olxcdn.com (wspólny dla OLX i Otomoto). */
export function extractPhotosFromHtml($: any): string[] {
  const seen = new Set<string>();
  $('img').each((_: number, el: any) => {
    const src = $(el).attr('src') || $(el).attr('data-src');
    if (!src || !src.includes('olxcdn.com')) return;
    seen.add(normalizePhotoUrl(src));
  });
  return Array.from(seen).slice(0, 24);
}

/** Usuwa parametry trackingowe (np. ?search_reason=...) z adresu ogłoszenia. */
export function cleanListingUrl(url: string): string {
  try {
    const u = new URL(url);
    u.search = '';
    return u.toString();
  } catch {
    return url.split('?')[0];
  }
}
export function categorySearchUrl(
  source: 'olx' | 'otomoto' | 'autoplac',
  brand: string,
  model: string,
  urlSlug?: string
): string {
  const segment = `${slug(brand)}/${urlSlug ?? slug(model)}`;
  if (source === 'olx') return `https://www.olx.pl/motoryzacja/samochody/${segment}/`;
  if (source === 'autoplac') return `https://www.autoplac.pl/oferty/samochody-osobowe/${segment}`;
  return `https://www.otomoto.pl/osobowe/${segment}/`;
}
