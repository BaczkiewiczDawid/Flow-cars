import { ShellClient } from './ShellClient';
import { getScraperMode } from '@/lib/scrapers/mode';

export function Shell({ children }: { children: React.ReactNode }) {
  const scraperMode = getScraperMode();

  return <ShellClient scraperMode={scraperMode}>{children}</ShellClient>;
}
