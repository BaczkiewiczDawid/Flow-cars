import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { cars } from '@/db/schema';
import { auth } from '@/auth';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = Number(session.user.id);

  const { id } = await params;
  const numericId = Number(id);

  if (!Number.isInteger(numericId)) {
    return NextResponse.json({ error: 'Nieprawidłowe id.' }, { status: 400 });
  }

  const [car] = await db
    .select()
    .from(cars)
    .where(and(eq(cars.id, numericId), eq(cars.userId, userId)))
    .limit(1);

  if (!car) {
    return NextResponse.json({ error: 'Nie znaleziono ogłoszenia.' }, { status: 404 });
  }

  return NextResponse.json(car);
}
