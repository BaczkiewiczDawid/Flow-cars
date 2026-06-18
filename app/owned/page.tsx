import { db } from '@/db';
import { ownedCars } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { PageContainer } from '@/components/layout/PageContainer';
import { OwnedClient } from './OwnedClient';

export const dynamic = 'force-dynamic';

export default async function OwnedPage() {
  const rows = await db.select().from(ownedCars).orderBy(desc(ownedCars.createdAt));
  return (
    <PageContainer>
      <OwnedClient initialRows={rows} />
    </PageContainer>
  );
}
