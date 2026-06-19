import { ShellClient } from './ShellClient';
import { getScraperMode } from '@/lib/scrapers/mode';
import { auth } from '@/auth';

export async function Shell({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session) return <>{children}</>;

  const scraperMode = getScraperMode();
  return (
    <ShellClient
      scraperMode={scraperMode}
      user={{ email: session.user.email!, name: session.user.name }}
    >
      {children}
    </ShellClient>
  );
}
