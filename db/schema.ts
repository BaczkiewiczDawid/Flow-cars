import {
  pgTable,
  text,
  integer,
  real,
  serial,
  boolean,
  uuid,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull(),
});

export type User = typeof users.$inferSelect;

export const cars = pgTable(
  'cars',
  {
    id: serial('id').primaryKey(),

    source: text('source').notNull().$type<'olx' | 'otomoto' | 'autoplac'>(),
    externalId: text('external_id').notNull(),
    url: text('url').notNull(),

    title: text('title').notNull(),
    brand: text('brand').notNull(),
    model: text('model').notNull(),
    generation: text('generation'),
    productionYear: integer('production_year').notNull(),

    engineCapacity: integer('engine_capacity'),
    enginePower: integer('engine_power'),
    fuelType: text('fuel_type'),
    gearbox: text('gearbox'),
    bodyType: text('body_type'),
    color: text('color'),
    mileage: integer('mileage').notNull(),

    price: integer('price').notNull(),
    currency: text('currency').notNull().default('PLN'),
    estimatedMarketPrice: integer('estimated_market_price'),
    priceDeviationPercent: real('price_deviation_percent'),
    comparableSampleSize: integer('comparable_sample_size').default(0),
    isUnderpriced: boolean('is_underpriced').notNull().default(false),

    voivodeship: text('voivodeship'),
    city: text('city'),

    description: text('description').notNull().default(''),
    equipmentJson: text('equipment_json').notNull().default('[]'),
    photosJson: text('photos_json').notNull().default('[]'),
    mainPhoto: text('main_photo'),

    sellerName: text('seller_name'),
    sellerPhone: text('seller_phone'),
    sellerType: text('seller_type').$type<'prywatny' | 'firma'>(),

    isFavorite: boolean('is_favorite').notNull().default(false),

    userId: uuid('user_id').references(() => users.id),

    status: text('status').notNull().default('nowa')
      .$type<'nowa' | 'do_sprawdzenia' | 'kontakt_wyslany' | 'odrzucona' | 'kupiona'>(),

    listedAt: timestamp('listed_at', { mode: 'date' }),
    scrapedAt: timestamp('scraped_at', { mode: 'date' }).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).notNull(),
  },
  (table) => ({
    sourceExternalIdUnique: uniqueIndex('cars_source_external_id_unique').on(
      table.userId,
      table.source,
      table.externalId
    ),
    brandModelIdx: index('cars_brand_model_idx').on(table.brand, table.model),
    underpricedIdx: index('cars_is_underpriced_idx').on(table.isUnderpriced),
  })
);

export const scrapeRuns = pgTable('scrape_runs', {
  id: serial('id').primaryKey(),
  source: text('source').notNull().$type<'olx' | 'otomoto' | 'all'>(),
  startedAt: timestamp('started_at', { mode: 'date' }).notNull(),
  finishedAt: timestamp('finished_at', { mode: 'date' }),
  status: text('status').notNull().default('running')
    .$type<'running' | 'success' | 'error'>(),
  foundCount: integer('found_count').notNull().default(0),
  newCount: integer('new_count').notNull().default(0),
  underpricedCount: integer('underpriced_count').notNull().default(0),
  errorMessage: text('error_message'),
  userId: uuid('user_id').references(() => users.id),
});

export type Car = typeof cars.$inferSelect;
export type NewCar = typeof cars.$inferInsert;
export type ScrapeRun = typeof scrapeRuns.$inferSelect;

export const ownedCars = pgTable('owned_cars', {
  id: serial('id').primaryKey(),
  brand: text('brand').notNull(),
  model: text('model').notNull(),
  year: integer('year').notNull(),
  mileage: integer('mileage').notNull(),
  driveType: text('drive_type'),
  engineCapacity: integer('engine_capacity'),
  enginePower: integer('engine_power'),
  fuelType: text('fuel_type'),
  purchasePrice: integer('purchase_price').notNull(),
  listingPrice: integer('listing_price'),
  salePrice: integer('sale_price'),
  status: text('status').notNull().default('zakupiony')
    .$type<'zakupiony' | 'w_transporcie' | 'na_placu' | 'w_przygotowaniu' | 'wystawiony' | 'sprzedany'>(),
  isImported: boolean('is_imported').notNull().default(false),
  notes: text('notes'),
  purchaseDate: timestamp('purchase_date', { mode: 'date' }),
  soldAt: timestamp('sold_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull(),
  userId: uuid('user_id').references(() => users.id),
});

export type OwnedCar = typeof ownedCars.$inferSelect;
export type NewOwnedCar = typeof ownedCars.$inferInsert;

export const carCosts = pgTable('car_costs', {
  id: serial('id').primaryKey(),
  ownedCarId: integer('owned_car_id').notNull().references(() => ownedCars.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  amount: integer('amount').notNull(),
  date: timestamp('date', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull(),
  userId: uuid('user_id').references(() => users.id),
});

export type CarCost = typeof carCosts.$inferSelect;
