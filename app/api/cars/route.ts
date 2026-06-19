import { NextRequest, NextResponse } from 'next/server';
import { asc, desc, eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { cars } from '@/db/schema';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;

  const onlyUnderpriced = request.nextUrl.searchParams.get('underpriced') === 'true';

  const rows = onlyUnderpriced
    ? await db
        .select()
        .from(cars)
        .where(and(eq(cars.userId, userId), eq(cars.isUnderpriced, true)))
        .orderBy(asc(cars.priceDeviationPercent))
    : await db.select().from(cars).where(eq(cars.userId, userId)).orderBy(desc(cars.scrapedAt));

  return NextResponse.json(rows);
}
