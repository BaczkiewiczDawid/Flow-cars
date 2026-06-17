import { desc } from 'drizzle-orm';
import { db } from '@/db';
import { cars, scrapeRuns } from '@/db/schema';
import { PageContainer } from '@/components/layout/PageContainer';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StatsBar } from '@/components/dashboard/StatsBar';
import { CarsWithFilter } from '@/components/cars/CarsWithFilter';
import type { CarCardData } from '@/components/cars/CarCard';

export const dynamic = 'force-dynamic';

async function getDashboardData() {
  const rawCars = await db.select().from(cars);

  // Sortowanie po dacie wystawienia — najnowsze pierwsze
  const allCars = rawCars.sort((a, b) => {
    const dateA = (a.listedAt ?? a.scrapedAt).getTime();
    const dateB = (b.listedAt ?? b.scrapedAt).getTime();
    return dateB - dateA;
  });

  const [lastRun] = await db
    .select({ finishedAt: scrapeRuns.finishedAt })
    .from(scrapeRuns)
    .orderBy(desc(scrapeRuns.id))
    .limit(1);

  const underpricedCars = allCars.filter((c) => c.isUnderpriced);
  const avgDiscountPercent =
    underpricedCars.length > 0
      ? underpricedCars.reduce((sum, c) => sum + (c.priceDeviationPercent ?? 0), 0) /
        underpricedCars.length
      : null;

  return { allCars, underpricedCount: underpricedCars.length, lastRun, avgDiscountPercent };
}

export default async function DashboardPage() {
  const { allCars, underpricedCount, lastRun, avgDiscountPercent } =
    await getDashboardData();

  const cardsData: CarCardData[] = allCars.map((car) => ({
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
  }));

  return (
    <PageContainer>
      <DashboardHeader />
      <StatsBar
        totalCars={allCars.length}
        underpricedCount={underpricedCount}
        avgDiscountPercent={avgDiscountPercent}
        lastScanAt={lastRun?.finishedAt ?? null}
      />
      <CarsWithFilter cars={cardsData} />
    </PageContainer>
  );
}
