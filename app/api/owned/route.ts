import { NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';
import { db } from '@/db';
import { ownedCars } from '@/db/schema';

export async function GET() {
  const rows = await db.select().from(ownedCars).orderBy(desc(ownedCars.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  const now = new Date();
  const soldAt = body.status === 'sprzedany'
    ? (body.soldAt ? new Date(body.soldAt) : now)
    : null;
  const purchaseDate = body.purchaseDate ? new Date(body.purchaseDate) : null;
  const [row] = await db
    .insert(ownedCars)
    .values({ ...body, soldAt, purchaseDate, createdAt: now, updatedAt: now })
    .returning();
  return NextResponse.json(row, { status: 201 });
}
