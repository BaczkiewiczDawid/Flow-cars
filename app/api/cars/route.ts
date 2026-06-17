import { NextRequest, NextResponse } from 'next/server';
import { asc, desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { cars } from '@/db/schema';

export async function GET(request: NextRequest) {
  const onlyUnderpriced = request.nextUrl.searchParams.get('underpriced') === 'true';

  const rows = onlyUnderpriced
    ? await db
        .select()
        .from(cars)
        .where(eq(cars.isUnderpriced, true))
        .orderBy(asc(cars.priceDeviationPercent))
    : await db.select().from(cars).orderBy(desc(cars.scrapedAt));

  return NextResponse.json(rows);
}
