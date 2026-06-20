import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { ownedCars } from '@/db/schema';
import { auth } from '@/auth';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;
  const { id } = await params;
  const body = await req.json();

  const toDate = (v: unknown) => (v ? new Date(v as string) : null);

  const [row] = await db
    .update(ownedCars)
    .set({
      insuranceExpiresAt: toDate(body.insuranceExpiresAt),
      inspectionExpiresAt: toDate(body.inspectionExpiresAt),
      reregisteredAt: toDate(body.reregisteredAt),
      updatedAt: new Date(),
    })
    .where(and(eq(ownedCars.id, Number(id)), eq(ownedCars.userId, userId)))
    .returning();

  if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(row);
}
