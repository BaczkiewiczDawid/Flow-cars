import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { hash } from 'bcryptjs';

export async function POST(req: Request) {
  const existing = await db.select({ id: users.id }).from(users).limit(1);
  if (existing.length > 0) {
    return NextResponse.json({ error: 'Konto już istnieje.' }, { status: 403 });
  }

  const { email, password, name } = await req.json().catch(() => ({}));
  if (!email || !password) {
    return NextResponse.json({ error: 'Email i hasło są wymagane.' }, { status: 400 });
  }

  const passwordHash = await hash(String(password), 12);
  const [user] = await db
    .insert(users)
    .values({ email: String(email), passwordHash, name: name ? String(name) : null, createdAt: new Date() })
    .returning({ id: users.id });

  return NextResponse.json({ id: user.id }, { status: 201 });
}
