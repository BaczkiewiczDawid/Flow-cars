import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { ownedCars } from '@/db/schema';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;

  const rows = await db
    .select()
    .from(ownedCars)
    .where(eq(ownedCars.userId, userId))
    .orderBy(desc(ownedCars.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;

  const body = await req.json();
  const now = new Date();
  const soldAt = body.status === 'sprzedany'
    ? (body.soldAt ? new Date(body.soldAt) : now)
    : null;
  const purchaseDate = body.purchaseDate ? new Date(body.purchaseDate) : null;
  const [row] = await db
    .insert(ownedCars)
    .values({ ...body, soldAt, purchaseDate, createdAt: now, updatedAt: now, userId })
    .returning();
  return NextResponse.json(row, { status: 201 });
}
