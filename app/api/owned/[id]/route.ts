import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { ownedCars } from '@/db/schema';
import { auth } from '@/auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = Number(session.user.id);

  const { id } = await params;
  const body = await req.json();
  const [existing] = await db
    .select()
    .from(ownedCars)
    .where(and(eq(ownedCars.id, Number(id)), eq(ownedCars.userId, userId)));
  if (!existing) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const soldAt = body.status === 'sprzedany'
    ? (body.soldAt ? new Date(body.soldAt) : existing.soldAt ?? new Date())
    : null;
  const purchaseDate = body.purchaseDate ? new Date(body.purchaseDate) : existing.purchaseDate ?? null;
  const [row] = await db
    .update(ownedCars)
    .set({ ...body, soldAt, purchaseDate, updatedAt: new Date() })
    .where(and(eq(ownedCars.id, Number(id)), eq(ownedCars.userId, userId)))
    .returning();
  return NextResponse.json(row);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = Number(session.user.id);

  const { id } = await params;
  await db.delete(ownedCars).where(and(eq(ownedCars.id, Number(id)), eq(ownedCars.userId, userId)));
  return NextResponse.json({ ok: true });
}
