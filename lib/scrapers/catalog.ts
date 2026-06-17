import type { ScrapedListingDraft } from './types';
import { categorySearchUrl } from './urls';

export interface CatalogEntry {
  brand: string;
  model: string;
  /** Slug kategorii w adresie URL, jeśli różni się od slugifikowanego `model` (np. BMW 3 -> "seria-3"). */
  urlSlug?: string;
  generation: string;
  productionYear: number;
  engineCapacity: number;
  enginePower: number;
  fuelType: 'benzyna' | 'diesel' | 'hybryda' | 'LPG';
  gearbox: 'manualna' | 'automatyczna';
  bodyType: string;
  baseMileage: number;
  /** Mediana ceny rynkowej dla tej konfiguracji - punkt odniesienia do generowania ofert. */
  marketPrice: number;
}

export const CAR_CATALOG: CatalogEntry[] = [
  {
    brand: 'Volkswagen',
    model: 'Golf',
    generation: 'VII',
    productionYear: 2017,
    engineCapacity: 1598,
    enginePower: 115,
    fuelType: 'diesel',
    gearbox: 'manualna',
    bodyType: 'hatchback',
    baseMileage: 120000,
    marketPrice: 38000,
  },
  {
    brand: 'Skoda',
    model: 'Octavia',
    generation: 'III',
    productionYear: 2016,
    engineCapacity: 1968,
    enginePower: 150,
    fuelType: 'diesel',
    gearbox: 'manualna',
    bodyType: 'kombi',
    baseMileage: 155000,
    marketPrice: 34000,
  },
  {
    brand: 'Toyota',
    model: 'Corolla',
    generation: 'XII',
    productionYear: 2020,
    engineCapacity: 1798,
    enginePower: 122,
    fuelType: 'hybryda',
    gearbox: 'automatyczna',
    bodyType: 'sedan',
    baseMileage: 58000,
    marketPrice: 64000,
  },
  {
    brand: 'Audi',
    model: 'A4',
    generation: 'B9',
    productionYear: 2018,
    engineCapacity: 1968,
    enginePower: 190,
    fuelType: 'diesel',
    gearbox: 'automatyczna',
    bodyType: 'sedan',
    baseMileage: 112000,
    marketPrice: 78000,
  },
  {
    brand: 'BMW',
    model: '320',
    urlSlug: 'seria-3',
    generation: 'F30',
    productionYear: 2015,
    engineCapacity: 1995,
    enginePower: 184,
    fuelType: 'diesel',
    gearbox: 'automatyczna',
    bodyType: 'sedan',
    baseMileage: 162000,
    marketPrice: 52000,
  },
  {
    brand: 'Ford',
    model: 'Focus',
    generation: 'III',
    productionYear: 2014,
    engineCapacity: 1499,
    enginePower: 105,
    fuelType: 'benzyna',
    gearbox: 'manualna',
    bodyType: 'hatchback',
    baseMileage: 138000,
    marketPrice: 24000,
  },
  {
    brand: 'Opel',
    model: 'Astra',
    generation: 'K',
    productionYear: 2019,
    engineCapacity: 1499,
    enginePower: 122,
    fuelType: 'diesel',
    gearbox: 'manualna',
    bodyType: 'hatchback',
    baseMileage: 88000,
    marketPrice: 44000,
  },
  {
    brand: 'Fiat',
    model: 'Punto',
    generation: 'III',
    productionYear: 2010,
    engineCapacity: 1242,
    enginePower: 65,
    fuelType: 'benzyna',
    gearbox: 'manualna',
    bodyType: 'hatchback',
    baseMileage: 168000,
    marketPrice: 7000,
  },
  {
    brand: 'Opel',
    model: 'Corsa',
    generation: 'D',
    productionYear: 2011,
    engineCapacity: 1229,
    enginePower: 80,
    fuelType: 'benzyna',
    gearbox: 'manualna',
    bodyType: 'hatchback',
    baseMileage: 152000,
    marketPrice: 9500,
  },
  {
    brand: 'Renault',
    model: 'Clio',
    generation: 'III',
    productionYear: 2009,
    engineCapacity: 1149,
    enginePower: 75,
    fuelType: 'benzyna',
    gearbox: 'manualna',
    bodyType: 'hatchback',
    baseMileage: 175000,
    marketPrice: 6500,
  },
  {
    brand: 'Skoda',
    model: 'Fabia',
    generation: 'II',
    productionYear: 2012,
    engineCapacity: 1198,
    enginePower: 70,
    fuelType: 'benzyna',
    gearbox: 'manualna',
    bodyType: 'hatchback',
    baseMileage: 148000,
    marketPrice: 11500,
  },
  {
    brand: 'Peugeot',
    model: '206',
    generation: 'facelift',
    productionYear: 2008,
    engineCapacity: 1124,
    enginePower: 60,
    fuelType: 'benzyna',
    gearbox: 'manualna',
    bodyType: 'hatchback',
    baseMileage: 198000,
    marketPrice: 5500,
  },
];

export const EQUIPMENT_POOL = [
  'Klimatyzacja automatyczna dwuzonowa',
  'Podgrzewane fotele przednie',
  'Czujniki parkowania przód i tył',
  'Kamera cofania',
  'Tempomat',
  'Tempomat aktywny',
  'Nawigacja GPS',
  'Apple CarPlay / Android Auto',
  'Felgi aluminiowe 17"',
  'Światła LED',
  'Asystent pasa ruchu',
  'System Start-Stop',
  'Elektrycznie sterowane szyby',
  'Elektrycznie sterowane i podgrzewane lusterka',
  'Tapicerka skórzana',
  'Hak',
  'Czujnik zmierzchu',
  'Czujnik deszczu',
  'Isofix',
  'Wielofunkcyjna kierownica',
  'Radio Bluetooth USB',
  '6 poduszek powietrznych',
];

const CITIES: { city: string; voivodeship: string }[] = [
  { city: 'Katowice', voivodeship: 'śląskie' },
  { city: 'Gliwice', voivodeship: 'śląskie' },
  { city: 'Kraków', voivodeship: 'małopolskie' },
  { city: 'Warszawa', voivodeship: 'mazowieckie' },
  { city: 'Wrocław', voivodeship: 'dolnośląskie' },
  { city: 'Poznań', voivodeship: 'wielkopolskie' },
  { city: 'Łódź', voivodeship: 'łódzkie' },
  { city: 'Gdańsk', voivodeship: 'pomorskie' },
  { city: 'Rzeszów', voivodeship: 'podkarpackie' },
  { city: 'Knurów', voivodeship: 'śląskie' },
];

// Mały deterministyczny generator pseudolosowy (żeby dane przykładowe
// były powtarzalne między uruchomieniami seeda).
export function makeRng(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function pickMany<T>(rng: () => number, arr: T[], count: number): T[] {
  const copy = [...arr];
  const result: T[] = [];
  for (let i = 0; i < count && copy.length > 0; i++) {
    const idx = Math.floor(rng() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

function placeholderPhoto(brand: string, model: string, index: number): string {
  const text = encodeURIComponent(`${brand} ${model} - foto ${index}`);
  const palette = ['0B0C0E/FFFFFF', '13151A/8FC1FF', '1A1D23/E5EEFB'];
  const colors = palette[index % palette.length];
  return `https://placehold.co/960x640/${colors}?text=${text}`;
}

function buildDescription(entry: CatalogEntry, mileage: number, city: string): string {
  const templates = [
    `Sprzedam ${entry.brand} ${entry.model} ${entry.generation} z ${entry.productionYear} roku. Przebieg ${mileage.toLocaleString('pl-PL')} km, silnik ${entry.engineCapacity} cm3 / ${entry.enginePower} KM (${entry.fuelType}), skrzynia ${entry.gearbox}. Auto bezwypadkowe, serwisowane zgodnie z harmonogramem, aktualne opłaty i przegląd. Stan techniczny i wizualny bardzo dobry, gotowe do jazdy bez dodatkowych wkładów finansowych. Możliwość sprawdzenia na stacji diagnostycznej oraz jazda próbna. Zapraszam do kontaktu i obejrzenia auta na miejscu w ${city}.`,
    `Do sprzedania ${entry.brand} ${entry.model} (${entry.generation}), rok produkcji ${entry.productionYear}. Przebieg ${mileage.toLocaleString('pl-PL')} km - potwierdzony fakturami z serwisu. Jednostka ${entry.engineCapacity} cm3 o mocy ${entry.enginePower} KM, napęd na przednią oś, skrzynia ${entry.gearbox}. Auto użytkowane bez problemów technicznych, klimatyzacja działa prawidłowo, ogumienie w dobrym stanie. Lokalizacja: ${city}, możliwy transport / pomoc w formalnościach przy zakupie.`,
    `${entry.brand} ${entry.model} ${entry.generation} w dobrej cenie - do negocjacji przy szybkiej decyzji. ${entry.productionYear} rok, ${mileage.toLocaleString('pl-PL')} km na liczniku, ${entry.fuelType}, skrzynia ${entry.gearbox}. Auto po przeglądzie, wymienione płyny eksploatacyjne, bez korozji. Powód sprzedaży: zmiana floty. Kontakt i prezentacja pojazdu w ${city}.`,
  ];
  return pick(makeRng(mileage + entry.productionYear), templates);
}

export interface GenerateOptions {
  source: 'olx' | 'otomoto';
  seedOffset: number;
  count: number;
  /** Lista odchyleń cenowych w % względem marketPrice, np. [-28, -5, 3, 8]. */
  priceDeviationsPercent: number[];
}

export function generateListingsForEntry(
  entry: CatalogEntry,
  options: GenerateOptions
): ScrapedListingDraft[] {
  const rng = makeRng(
    entry.brand.length * 7 + entry.model.length * 13 + options.seedOffset
  );

  return options.priceDeviationsPercent.map((deviationPercent, i) => {
    const mileageJitter = Math.round((rng() - 0.5) * 30000);
    const mileage = Math.max(5000, entry.baseMileage + mileageJitter);
    const price = Math.round(
      (entry.marketPrice * (1 + deviationPercent / 100)) / 100
    ) * 100;
    const location = pick(rng, CITIES);
    const equipment = pickMany(rng, EQUIPMENT_POOL, 6 + Math.floor(rng() * 6));
    const photos = [1, 2, 3, 4, 5].map((n) =>
      placeholderPhoto(entry.brand, entry.model, n)
    );
    const colorOptions = ['czarny', 'srebrny', 'biały', 'szary', 'granatowy', 'czerwony'];

    return {
      source: options.source,
      externalId: `${options.source}-${entry.brand}-${entry.model}-${options.seedOffset}-${i}`
        .toLowerCase()
        .replace(/\s+/g, '-'),
      url: categorySearchUrl(options.source, entry.brand, entry.model),
      title: `${entry.brand} ${entry.model} ${entry.generation} ${entry.productionYear} - ${entry.fuelType}, ${entry.gearbox}`,
      brand: entry.brand,
      model: entry.model,
      generation: entry.generation,
      productionYear: entry.productionYear,
      engineCapacity: entry.engineCapacity,
      enginePower: entry.enginePower,
      fuelType: entry.fuelType,
      gearbox: entry.gearbox,
      bodyType: entry.bodyType,
      color: pick(rng, colorOptions),
      mileage,
      price,
      currency: 'PLN',
      voivodeship: location.voivodeship,
      city: location.city,
      description: buildDescription(entry, mileage, location.city),
      equipment,
      photos,
      mainPhoto: photos[0],
      sellerName: pick(rng, [
        'Auto Komis Premium',
        'Jan K.',
        'Tomasz W.',
        'Marek Sprzedaż Aut',
        'Anna N.',
        'Komis Express Motors',
      ]),
      sellerPhone: `+48 6${Math.floor(10000000 + rng() * 89999999)}`,
      sellerType: rng() > 0.55 ? 'firma' : 'prywatny',
    };
  });
}

