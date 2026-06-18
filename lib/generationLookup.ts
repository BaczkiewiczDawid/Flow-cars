// Fetches car generation year ranges from Wikipedia article section headings.
// Example: "First generation (1996)" → { yearFrom: 1996, yearTo: 2002 }

const ORDINAL_RE = /^(First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|Tenth)\s+generation/i;
// Matches the last 4-digit year (19xx or 20xx) before a closing paren
const YEAR_RE = /[;(,]\s*((?:19|20)\d{2})\s*\)/;

async function wikiGet(params: Record<string, string>): Promise<any> {
  const qs = new URLSearchParams({ ...params, format: 'json' }).toString();
  const res = await fetch(`https://en.wikipedia.org/w/api.php?${qs}`, {
    headers: { 'User-Agent': 'FlowCars/1.0' },
  });
  if (!res.ok) throw new Error(`Wikipedia API ${res.status}`);
  return res.json();
}

async function findArticleTitle(brand: string, model: string): Promise<string | null> {
  const data = await wikiGet({
    action: 'query',
    list: 'search',
    srsearch: `${brand} ${model}`,
    srlimit: '5',
  });
  const results: Array<{ title: string }> = data.query?.search ?? [];
  const lBrand = brand.toLowerCase();
  // Prefer result whose title contains the brand name (handles accent variants like Scénic)
  return (
    results.find((r) => r.title.toLowerCase().includes(lBrand))?.title ??
    results[0]?.title ??
    null
  );
}

async function fetchSections(title: string): Promise<Array<{ line: string }>> {
  const data = await wikiGet({ action: 'parse', page: title, prop: 'sections' });
  return data.parse?.sections ?? [];
}

function parseGenerationYears(sections: Array<{ line: string }>): number[] {
  return sections
    .map((s) => s.line.replace(/<[^>]+>/g, '')) // strip HTML tags
    .filter((text) => ORDINAL_RE.test(text))
    .map((text) => {
      const m = text.match(YEAR_RE);
      // Fallback: plain "(YYYY)" with no separator
      const fallback = text.match(/\((\d{4})\)/);
      const raw = m?.[1] ?? fallback?.[1];
      return raw ? Number(raw) : null;
    })
    .filter((y): y is number => y !== null);
}

export interface GenerationRange {
  yearFrom: number;
  yearTo: number; // 9999 = still in production
}

export async function getGenerationRange(
  brand: string,
  model: string,
  year: number
): Promise<GenerationRange | null> {
  try {
    const title = await findArticleTitle(brand, model);
    if (!title) return null;

    const sections = await fetchSections(title);
    const genYears = parseGenerationYears(sections);
    if (genYears.length < 2) return null;

    for (let i = 0; i < genYears.length; i++) {
      const yearFrom = genYears[i];
      const yearTo = i + 1 < genYears.length ? genYears[i + 1] - 1 : 9999;
      if (year >= yearFrom && year <= yearTo) {
        return { yearFrom, yearTo };
      }
    }
    return null;
  } catch {
    return null;
  }
}
