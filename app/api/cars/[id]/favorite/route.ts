import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { cars } from '@/db/schema';
import { auth } from '@/auth';

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = Number(session.user.id);

  const { id } = await params;
  const [existing] = await db
    .select({ isFavorite: cars.isFavorite })
    .from(cars)
    .where(and(eq(cars.id, Number(id)), eq(cars.userId, userId)));
  if (!existing) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const [row] = await db
    .update(cars)
    .set({ isFavorite: !existing.isFavorite })
    .where(and(eq(cars.id, Number(id)), eq(cars.userId, userId)))
    .returning({ isFavorite: cars.isFavorite });
  return NextResponse.json(row);
}
