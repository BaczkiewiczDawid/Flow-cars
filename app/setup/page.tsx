import { redirect } from 'next/navigation';
import { db } from '@/db';
import { users } from '@/db/schema';
import { SetupClient } from './SetupClient';

export const dynamic = 'force-dynamic';

export default async function SetupPage() {
  const existing = await db.select({ id: users.id }).from(users).limit(1);
  if (existing.length > 0) redirect('/login');
  return <SetupClient />;
}
