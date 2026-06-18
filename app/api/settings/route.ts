import { NextResponse } from 'next/server';
import { getSettings, saveSettings, DEFAULT_SETTINGS } from '@/lib/settings';

export function GET() {
  return NextResponse.json(getSettings());
}

export async function PUT(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }
  saveSettings(body);
  return NextResponse.json(getSettings());
}

export async function DELETE() {
  saveSettings(DEFAULT_SETTINGS);
  return NextResponse.json(getSettings());
}
