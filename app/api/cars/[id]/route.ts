import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { cars } from '@/db/schema';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numericId = Number(id);

  if (!Number.isInteger(numericId)) {
    return NextResponse.json({ error: 'Nieprawidłowe id.' }, { status: 400 });
  }

  const [car] = await db.select().from(cars).where(eq(cars.id, numericId)).limit(1);

  if (!car) {
    return NextResponse.json({ error: 'Nie znaleziono ogłoszenia.' }, { status: 404 });
  }

  return NextResponse.json(car);
}
