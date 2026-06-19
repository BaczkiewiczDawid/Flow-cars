import { NextResponse } from 'next/server';
import { getSettings, saveSettings, DEFAULT_SETTINGS } from '@/lib/settings';
import { auth } from '@/auth';

async function getUserId() {
  const session = await auth();
  return session ? Number(session.user.id) : undefined;
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(getSettings(Number(session.user.id)));
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = Number(session.user.id);

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }
  saveSettings(body, userId);
  return NextResponse.json(getSettings(userId));
}

export async function DELETE() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = Number(session.user.id);

  saveSettings(DEFAULT_SETTINGS, userId);
  return NextResponse.json(getSettings(userId));
}
