import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { ownedCars } from '@/db/schema';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const [row] = await db
    .update(ownedCars)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(ownedCars.id, Number(id)))
    .returning();
  return NextResponse.json(row);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(ownedCars).where(eq(ownedCars.id, Number(id)));
  return NextResponse.json({ ok: true });
}
