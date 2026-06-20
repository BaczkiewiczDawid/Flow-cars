export function slugifyCity(city: string): string {
  return city.trim().toLowerCase()
    .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e').replace(/ł/g, 'l')
    .replace(/ń/g, 'n').replace(/ó/g, 'o').replace(/ś/g, 's').replace(/ź/g, 'z')
    .replace(/ż/g, 'z').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export function extractPriceFromText(text: string): number | null {
  const match = text.match(/(\d[\d\s]{2,})\s*(?:zł|PLN)/i);
  if (!match) return null;
  const digits = match[1].replace(/\s+/g, '');
  const value = Number(digits);
  return Number.isFinite(value) ? value : null;
}

const FUEL_MAP: Record<string, string> = {
  benzyna: 'benzyna',
  gasoline: 'benzyna',
  petrol: 'benzyna',
  diesel: 'diesel',
  hybryda: 'hybryda',
  hybrid: 'hybryda',
  lpg: 'LPG',
  gas: 'LPG',
  elektryczny: 'elektryczny',
  electric: 'elektryczny',
  'benzyna+lpg': 'LPG',
  'gasoline+lpg': 'LPG',
};

export function normalizeFuelType(raw: string | null): string | undefined {
  if (!raw) return undefined;
  const key = raw.trim().toLowerCase();
  return FUEL_MAP[key] ?? raw.trim();
}

export function normalizeGearbox(raw: string | null): string | undefined {
  if (!raw) return undefined;
  const key = raw.trim().toLowerCase();
  if (key.includes('manual')) return 'manualna';
  if (key.includes('autom')) return 'automatyczna';
  return raw.trim();
}

