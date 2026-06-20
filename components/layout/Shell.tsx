import { ShellClient } from './ShellClient';
import { getScraperMode } from '@/lib/scrapers/mode';
import { auth } from '@/auth';
import { db } from '@/db';
import { ownedCars } from '@/db/schema';
import { and, eq, ne } from 'drizzle-orm';
import { getSettings } from '@/lib/settings';

async function getDocAlertCount(userId: string): Promise<number> {
  try {
    const rows = await db
      .select({
        insuranceExpiresAt: ownedCars.insuranceExpiresAt,
        inspectionExpiresAt: ownedCars.inspectionExpiresAt,
        reregisteredAt: ownedCars.reregisteredAt,
        purchaseDate: ownedCars.purchaseDate,
      })
      .from(ownedCars)
      .where(and(eq(ownedCars.userId, userId), ne(ownedCars.status, 'sprzedany')));

    const { reregistrationDays } = getSettings(userId);
    const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return rows.filter((c) => {
      if (c.insuranceExpiresAt && c.insuranceExpiresAt <= deadline) return true;
      if (c.inspectionExpiresAt && c.inspectionExpiresAt <= deadline) return true;
      if (!c.reregisteredAt && c.purchaseDate) {
        const reregBy = new Date(c.purchaseDate.getTime() + reregistrationDays * 24 * 60 * 60 * 1000);
        if (reregBy <= deadline) return true;
      }
      return false;
    }).length;
  } catch {
    return 0;
  }
}

export async function Shell({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session) return <>{children}</>;

  const scraperMode = getScraperMode();
  const docAlertCount = await getDocAlertCount(session.user.id!);
  return (
    <ShellClient
      scraperMode={scraperMode}
      user={{ email: session.user.email!, name: session.user.name }}
      docAlertCount={docAlertCount}
    >
      {children}
    </ShellClient>
  );
}
