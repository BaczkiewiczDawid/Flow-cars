import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { cars } from '@/db/schema';

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [existing] = await db.select({ isFavorite: cars.isFavorite }).from(cars).where(eq(cars.id, Number(id)));
  if (!existing) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const [row] = await db
    .update(cars)
    .set({ isFavorite: !existing.isFavorite })
    .where(eq(cars.id, Number(id)))
    .returning({ isFavorite: cars.isFavorite });
  return NextResponse.json(row);
}
