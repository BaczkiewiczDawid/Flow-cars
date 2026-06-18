import { db } from '@/db';
import { ownedCars } from '@/db/schema';
import { PageContainer } from '@/components/layout/PageContainer';
import { StatsClient } from './StatsClient';

export const dynamic = 'force-dynamic';

export default async function StatystykiPage() {
  const rows = await db.select().from(ownedCars);
  return (
    <PageContainer>
      <StatsClient rows={rows} />
    </PageContainer>
  );
}
