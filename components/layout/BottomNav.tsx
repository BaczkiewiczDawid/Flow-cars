'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styled from 'styled-components';
import {
  LayoutDashboard,
  Heart,
  BarChart3,
  Settings,
  GitCompareArrows,
  Car,
} from 'lucide-react';

const Bar = styled.nav`
  display: none;

  @media (max-width: 640px) {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: ${({ theme }) => theme.colors.sidebarBg};
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    z-index: 30;
    align-items: stretch;
  }
`;

const Item = styled.div<{ $active?: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  font-size: 10px;
  font-weight: 500;
  color: ${({ theme, $active }) =>
    $active ? theme.colors.accent : theme.colors.sidebarTextMuted};
  cursor: pointer;
  transition: color 120ms ease;

  svg {
    flex-shrink: 0;
  }
`;

const nav = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Porównaj', href: '/compare', icon: GitCompareArrows },
  { label: 'Posiadane', href: '/owned', icon: Car },
  { label: 'Ulubione', href: '/ulubione', icon: Heart },
  { label: 'Statystyki', href: '/statystyki', icon: BarChart3 },
  { label: 'Ustawienia', href: '/settings', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' || pathname.startsWith('/cars') : pathname === href;

  return (
    <Bar>
      {nav.map(({ label, href, icon: Icon }) => (
        <Link key={href} href={href} style={{ flex: 1 }}>
          <Item $active={isActive(href)}>
            <Icon size={20} />
            {label}
          </Item>
        </Link>
      ))}
    </Bar>
  );
}
