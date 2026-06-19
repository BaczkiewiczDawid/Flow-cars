import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { LoginClient } from './LoginClient';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  if (session) redirect('/');

  const { callbackUrl } = await searchParams;
  return <LoginClient callbackUrl={callbackUrl || '/'} />;
}
