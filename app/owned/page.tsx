import { and, desc, eq, sum } from 'drizzle-orm';
import { db } from '@/db';
import { carCosts, ownedCars } from '@/db/schema';
import { PageContainer } from '@/components/layout/PageContainer';
import { OwnedClient } from './OwnedClient';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export default async function OwnedPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [cars, costsRows] = await Promise.all([
    db.select().from(ownedCars).where(eq(ownedCars.userId, userId)).orderBy(desc(ownedCars.createdAt)),
    db
      .select({ ownedCarId: carCosts.ownedCarId, total: sum(carCosts.amount) })
      .from(carCosts)
      .where(eq(carCosts.userId, userId))
      .groupBy(carCosts.ownedCarId),
  ]);
  const costsMap = new Map(costsRows.map((r) => [r.ownedCarId, Number(r.total ?? 0)]));
  const rows = cars.map((car) => ({ ...car, totalCosts: costsMap.get(car.id) ?? 0 }));

  return (
    <PageContainer>
      <OwnedClient initialRows={rows} />
    </PageContainer>
  );
}
