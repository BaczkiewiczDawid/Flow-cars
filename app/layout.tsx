import type { Metadata } from 'next';
import Providers from '@/lib/styled/Providers';
import { Shell } from '@/components/layout/Shell';

export const metadata: Metadata = {
  title: 'Flow Cars - skaner ofert OLX i Otomoto',
  description:
    'Panel dla autohandlu do wyszukiwania samochodów wystawionych poniżej ceny rynkowej na OLX i Otomoto.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={
          {
            '--font-display': '"Space Grotesk"',
            '--font-body': '"Inter"',
            '--font-mono': '"IBM Plex Mono"',
          } as React.CSSProperties
        }
      >
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
