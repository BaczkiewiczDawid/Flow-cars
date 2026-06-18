/**
 * Surowe dane ogłoszenia, zwracane przez scraper przed zapisem do bazy
 * (bez id, timestampów i wyliczeń rynkowych - te dodaje warstwa zapisu).
 */
export interface ScrapedListingDraft {
  source: 'olx' | 'otomoto' | 'autoplac';
  externalId: string;
  url: string;
  title: string;
  brand: string;
  model: string;
  generation?: string;
  productionYear: number;
  engineCapacity?: number;
  enginePower?: number;
  fuelType?: string;
  gearbox?: string;
  bodyType?: string;
  color?: string;
  mileage: number;
  price: number;
  currency: string;
  voivodeship?: string;
  city?: string;
  description: string;
  equipment: string[];
  photos: string[];
  mainPhoto?: string;
  sellerId?: string;
  sellerName?: string;
  sellerPhone?: string;
  sellerType?: 'prywatny' | 'firma';
  listedAt?: Date;
}

export interface SearchCriteria {
  /** Marka, np. "Volkswagen". Pozostaw pusty, aby przeszukać wszystkie. */
  brand?: string;
  /** Model, np. "Golf". */
  model?: string;
  /** Slug kategorii w URL, jeśli różni się od slugifikowanego `model` (np. BMW "320" -> "seria-3"). */
  urlSlug?: string;
  priceMin?: number;
  priceMax?: number;
  yearMin?: number;
  /** Miasto jako slug w URL (np. "gliwice"). Puste = cała Polska. */
  locationCity?: string;
  /** Promień wyszukiwania wokół miasta w km (np. 30). */
  locationRadiusKm?: number;
  yearMax?: number;
  /** Maksymalna liczba stron wyników do przejrzenia (tryb "live"). */
  maxPages?: number;
  /** Maksymalna liczba ogłoszeń po przefiltrowaniu (usunięcie handlarzy/firm). */
  maxListings?: number;
  /** Próg traktowania sprzedawcy jako handlarza (liczba ogłoszeń tego samego sprzedawcy). */
  dealerListingThreshold?: number;
  /** Gdy true, nie filtruje ogłoszeń firm/dealerów (używane w trybie porównania cen). */
  includeDealers?: boolean;
}

export interface CarScraper {
  source: 'olx' | 'otomoto' | 'autoplac';
  search(criteria: SearchCriteria, onListingFetched?: () => void): Promise<ScrapedListingDraft[]>;
}
