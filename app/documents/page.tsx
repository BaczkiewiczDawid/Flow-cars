import { eq, ne } from 'drizzle-orm';
import { db } from '@/db';
import { ownedCars } from '@/db/schema';
import { PageContainer } from '@/components/layout/PageContainer';
import { DocumentsClient } from './DocumentsClient';
import { auth } from '@/auth';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export default async function DocumentsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const cars = await db
    .select()
    .from(ownedCars)
    .where(eq(ownedCars.userId, userId));

  const { reregistrationDays } = getSettings(userId);

  return (
    <PageContainer>
      <DocumentsClient initialCars={cars} reregistrationDays={reregistrationDays} />
    </PageContainer>
  );
}
