import { eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { cars } from '@/db/schema';
import { PageContainer } from '@/components/layout/PageContainer';
import { CarsWithFilter } from '@/components/cars/CarsWithFilter';
import { buildMarketListingUrl } from '@/lib/marketAnalysis';
import { getSettings } from '@/lib/settings';
import type { CarCardData } from '@/components/cars/CarCard';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export default async function UlubionePage() {
  const session = await auth();
  const userId = Number(session!.user.id);

  const rows = await db
    .select()
    .from(cars)
    .where(and(eq(cars.userId, userId), eq(cars.isFavorite, true)));
  const settings = getSettings(userId);

  const cardsData: CarCardData[] = rows.map((car) => ({
    id: car.id,
    source: car.source,
    title: car.title,
    brand: car.brand,
    model: car.model,
    generation: car.generation,
    productionYear: car.productionYear,
    engineCapacity: car.engineCapacity,
    enginePower: car.enginePower,
    fuelType: car.fuelType,
    gearbox: car.gearbox,
    mileage: car.mileage,
    price: car.price,
    estimatedMarketPrice: car.estimatedMarketPrice,
    priceDeviationPercent: car.priceDeviationPercent,
    isUnderpriced: car.isUnderpriced,
    mainPhoto: car.mainPhoto,
    city: car.city,
    listedAt: car.listedAt,
    marketListingUrl: buildMarketListingUrl(car.brand, car.model, car, settings),
    isFavorite: true,
  }));

  return (
    <PageContainer>
      <h1 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 24px' }}>Ulubione</h1>
      <CarsWithFilter cars={cardsData} hideUnfavorited />
    </PageContainer>
  );
}
