import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export async function getSessionUserId(): Promise<{ userId: number } | NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return { userId: Number(session.user.id) };
}
