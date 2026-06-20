import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { carCosts } from '@/db/schema';
import { auth } from '@/auth';

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string; costId: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;
  const { costId } = await params;

  await db.delete(carCosts).where(and(eq(carCosts.id, Number(costId)), eq(carCosts.userId, userId)));
  return NextResponse.json({ ok: true });
}
