import { NextResponse } from 'next/server';
import { and, eq, desc } from 'drizzle-orm';
import { db } from '@/db';
import { carCosts, ownedCars } from '@/db/schema';
import { auth } from '@/auth';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;
  const { id } = await params;

  const rows = await db
    .select()
    .from(carCosts)
    .where(and(eq(carCosts.ownedCarId, Number(id)), eq(carCosts.userId, userId)))
    .orderBy(desc(carCosts.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: Request, { params }: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;
  const { id } = await params;

  const [car] = await db
    .select({ id: ownedCars.id })
    .from(ownedCars)
    .where(and(eq(ownedCars.id, Number(id)), eq(ownedCars.userId, userId)));
  if (!car) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const { description, amount, date } = await req.json();
  const [row] = await db
    .insert(carCosts)
    .values({
      ownedCarId: Number(id),
      description,
      amount: Number(amount),
      date: date ? new Date(date) : null,
      createdAt: new Date(),
      userId,
    })
    .returning();
  return NextResponse.json(row, { status: 201 });
}
