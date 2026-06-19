import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { ownedCars } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { PageContainer } from '@/components/layout/PageContainer';
import { OwnedClient } from './OwnedClient';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export default async function OwnedPage() {
  const session = await auth();
  const userId = session!.user.id;

  const rows = await db
    .select()
    .from(ownedCars)
    .where(eq(ownedCars.userId, userId))
    .orderBy(desc(ownedCars.createdAt));
  return (
    <PageContainer>
      <OwnedClient initialRows={rows} />
    </PageContainer>
  );
}
