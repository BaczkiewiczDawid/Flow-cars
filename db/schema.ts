import {
  sqliteTable,
  text,
  integer,
  real,
  uniqueIndex,
  index,
} from 'drizzle-orm/sqlite-core';

/**
 * Główna tabela z ogłoszeniami samochodów znalezionymi przez scrapery
 * OLX i Otomoto. Każdy wiersz to jedno ogłoszenie wraz z wyliczoną
 * wyceną rynkową i informacją, czy oferta jest okazją (poniżej rynku).
 */
export const cars = sqliteTable(
  'cars',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),

    // Pochodzenie ogłoszenia
    source: text('source', { enum: ['olx', 'otomoto'] }).notNull(),
    externalId: text('external_id').notNull(),
    url: text('url').notNull(),

    // Podstawowe dane samochodu
    title: text('title').notNull(),
    brand: text('brand').notNull(),
    model: text('model').notNull(),
    generation: text('generation'),
    productionYear: integer('production_year').notNull(),

    // Silnik / dane techniczne
    engineCapacity: integer('engine_capacity'), // cm3
    enginePower: integer('engine_power'), // KM
    fuelType: text('fuel_type'),
    gearbox: text('gearbox'),
    bodyType: text('body_type'),
    color: text('color'),
    mileage: integer('mileage').notNull(), // km

    // Cena i wycena
    price: integer('price').notNull(), // cena z ogłoszenia (zakupu), w groszach... -> tu w PLN (integer)
    currency: text('currency').notNull().default('PLN'),
    estimatedMarketPrice: integer('estimated_market_price'), // potencjalna cena sprzedaży
    priceDeviationPercent: real('price_deviation_percent'), // (price - market) / market * 100
    comparableSampleSize: integer('comparable_sample_size').default(0),
    isUnderpriced: integer('is_underpriced', { mode: 'boolean' })
      .notNull()
      .default(false),

    // Lokalizacja
    voivodeship: text('voivodeship'),
    city: text('city'),

    // Treść ogłoszenia
    description: text('description').notNull().default(''),
    equipmentJson: text('equipment_json').notNull().default('[]'), // JSON string[]
    photosJson: text('photos_json').notNull().default('[]'), // JSON string[]
    mainPhoto: text('main_photo'),

    // Sprzedający
    sellerName: text('seller_name'),
    sellerPhone: text('seller_phone'),
    sellerType: text('seller_type', { enum: ['prywatny', 'firma'] }),

    // Status w obrębie aplikacji (przyszły moduł CRM)
    status: text('status', {
      enum: ['nowa', 'do_sprawdzenia', 'kontakt_wyslany', 'odrzucona', 'kupiona'],
    })
      .notNull()
      .default('nowa'),

    // Znaczniki czasu
    listedAt: integer('listed_at', { mode: 'timestamp' }), // data wystawienia na serwisie
    scrapedAt: integer('scraped_at', { mode: 'timestamp' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  },
  (table) => ({
    sourceExternalIdUnique: uniqueIndex('cars_source_external_id_unique').on(
      table.source,
      table.externalId
    ),
    brandModelIdx: index('cars_brand_model_idx').on(table.brand, table.model),
    underpricedIdx: index('cars_is_underpriced_idx').on(table.isUnderpriced),
  })
);

/**
 * Log uruchomień scrapera - przyda się do przyszłej zakładki
 * "Wyszukiwania" w panelu nawigacji (historia, statystyki skanów).
 */
export const scrapeRuns = sqliteTable('scrape_runs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  source: text('source', { enum: ['olx', 'otomoto', 'all'] }).notNull(),
  startedAt: integer('started_at', { mode: 'timestamp' }).notNull(),
  finishedAt: integer('finished_at', { mode: 'timestamp' }),
  status: text('status', { enum: ['running', 'success', 'error'] })
    .notNull()
    .default('running'),
  foundCount: integer('found_count').notNull().default(0),
  newCount: integer('new_count').notNull().default(0),
  underpricedCount: integer('underpriced_count').notNull().default(0),
  errorMessage: text('error_message'),
});

export type Car = typeof cars.$inferSelect;
export type NewCar = typeof cars.$inferInsert;
export type ScrapeRun = typeof scrapeRuns.$inferSelect;

export const ownedCars = sqliteTable('owned_cars', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  brand: text('brand').notNull(),
  model: text('model').notNull(),
  year: integer('year').notNull(),
  mileage: integer('mileage').notNull(),
  driveType: text('drive_type'),       // FWD / RWD / AWD / 4x4
  engineCapacity: integer('engine_capacity'), // cm³
  enginePower: integer('engine_power'),       // KM
  fuelType: text('fuel_type'),
  purchasePrice: integer('purchase_price').notNull(),
  listingPrice: integer('listing_price'),     // null = nie wystawiony
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export type OwnedCar = typeof ownedCars.$inferSelect;
export type NewOwnedCar = typeof ownedCars.$inferInsert;
