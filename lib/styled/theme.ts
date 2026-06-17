export const theme = {
  colors: {
    bg: '#FFFFFF',
    bgSoft: '#F4F6F8',
    surface: '#FFFFFF',
    border: '#E4E7EB',
    borderStrong: '#D2D7DD',

    ink: '#0B0C0E',
    inkSoft: '#5B6470',
    inkFaint: '#9AA2AC',

    sidebarBg: '#0B0C0E',
    sidebarBgRaised: '#15171B',
    sidebarText: '#C9CDD3',
    sidebarTextMuted: '#6B7280',
    sidebarTextActive: '#FFFFFF',

    accent: '#2F8AFF',
    accentSoft: '#EAF3FF',
    accentSofter: '#F4F9FF',
    accentStrong: '#1768D1',
    accentInk: '#0E3D7A',

    danger: '#C4432E',
    dangerSoft: '#FBEAE6',
    success: '#1E8E63',

    olx: '#0B0C0E',
    otomoto: '#2F8AFF',
  },
  font: {
    display: 'var(--font-display), "Space Grotesk", sans-serif',
    body: 'var(--font-body), "Inter", sans-serif',
    mono: 'var(--font-mono), "IBM Plex Mono", monospace',
  },
  radius: {
    sm: '6px',
    md: '10px',
    lg: '16px',
    pill: '999px',
  },
  shadow: {
    card: '0 1px 2px rgba(11, 12, 14, 0.04), 0 8px 24px rgba(11, 12, 14, 0.05)',
    raised: '0 4px 12px rgba(11, 12, 14, 0.08), 0 16px 40px rgba(11, 12, 14, 0.08)',
  },
  layout: {
    sidebarWidth: '252px',
    maxContentWidth: '1320px',
  },
} as const;

export type AppTheme = typeof theme;
