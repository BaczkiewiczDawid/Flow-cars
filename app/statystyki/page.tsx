import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { ownedCars } from '@/db/schema';
import { PageContainer } from '@/components/layout/PageContainer';
import { StatsClient } from './StatsClient';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export default async function StatystykiPage() {
  const session = await auth();
  const userId = Number(session!.user.id);

  const rows = await db.select().from(ownedCars).where(eq(ownedCars.userId, userId));
  return (
    <PageContainer>
      <StatsClient rows={rows} />
    </PageContainer>
  );
}
