'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styled from 'styled-components';
import {
  LayoutDashboard, Heart, BarChart3, Settings,
  GitCompareArrows, Car, Menu, X, Radar, LogOut, FileCheck,
} from 'lucide-react';
import { logout } from '@/app/actions/logout';

const TopBar = styled.header`
  display: none;

  @media (max-width: 640px) {
    display: flex;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 52px;
    background: ${({ theme }) => theme.colors.sidebarBg};
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    z-index: 40;
  }
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${({ theme }) => theme.colors.sidebarTextActive};
  font-family: ${({ theme }) => theme.font.display};
  font-weight: 700;
  font-size: 16px;
`;

const BrandMark = styled.div`
  width: 28px;
  height: 28px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.accent};
  display: grid;
  place-items: center;
  color: #fff;
`;

const HamburgerBtn = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.sidebarTextActive};
  display: flex;
  align-items: center;
  padding: 4px;
  cursor: pointer;
`;

const Overlay = styled.div<{ $open: boolean }>`
  display: none;

  @media (max-width: 640px) {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 41;
    opacity: ${({ $open }) => ($open ? 1 : 0)};
    pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
    transition: opacity 200ms ease;
  }
`;

const Drawer = styled.nav<{ $open: boolean }>`
  display: none;

  @media (max-width: 640px) {
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 260px;
    background: ${({ theme }) => theme.colors.sidebarBg};
    z-index: 42;
    padding: 16px;
    transform: ${({ $open }) => ($open ? 'translateX(0)' : 'translateX(-100%)')};
    transition: transform 220ms ease;
  }
`;

const DrawerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 12px;
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.sidebarTextMuted};
  display: flex;
  align-items: center;
  padding: 4px;
  cursor: pointer;
`;

const NavItem = styled.div<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 12px;
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme, $active }) =>
    $active ? theme.colors.sidebarTextActive : theme.colors.sidebarText};
  background: ${({ $active }) => ($active ? 'rgba(255,255,255,0.07)' : 'transparent')};
  cursor: pointer;
  transition: background 120ms ease;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  svg {
    flex-shrink: 0;
    color: ${({ theme, $active }) => ($active ? theme.colors.accent : 'currentColor')};
  }
`;

const Spacer = styled.div`flex: 1;`;

const AlertBadge = styled.span`
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: ${({ theme }) => theme.colors.danger};
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  display: grid;
  place-items: center;
  line-height: 1;
  margin-left: auto;
`;

const LogoutItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 12px;
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.sidebarTextMuted};
  cursor: pointer;
  transition: background 120ms ease;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    color: ${({ theme }) => theme.colors.sidebarText};
  }

  svg { flex-shrink: 0; }
`;

const nav = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Porównaj ofertę', href: '/compare', icon: GitCompareArrows },
  { label: 'Posiadane', href: '/owned', icon: Car },
  { label: 'Dokumenty', href: '/documents', icon: FileCheck },
  { label: 'Ulubione', href: '/ulubione', icon: Heart },
  { label: 'Statystyki', href: '/statystyki', icon: BarChart3 },
  { label: 'Ustawienia', href: '/settings', icon: Settings },
];

export function BottomNav({ docAlertCount }: { docAlertCount: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' || pathname.startsWith('/cars') : pathname === href;

  return (
    <>
      <TopBar>
        <Brand>
          <BrandMark><Radar size={14} /></BrandMark>
          Flow Cars
        </Brand>
        <HamburgerBtn onClick={() => setOpen(true)} aria-label="Menu">
          <Menu size={22} />
        </HamburgerBtn>
      </TopBar>

      <Overlay $open={open} onClick={() => setOpen(false)} />

      <Drawer $open={open}>
        <DrawerHeader>
          <Brand>
            <BrandMark><Radar size={14} /></BrandMark>
            Flow Cars
          </Brand>
          <CloseBtn onClick={() => setOpen(false)} aria-label="Zamknij menu">
            <X size={20} />
          </CloseBtn>
        </DrawerHeader>

        {nav.map(({ label, href, icon: Icon }) => (
          <Link key={href} href={href}>
            <NavItem $active={isActive(href)}>
              <Icon size={18} />
              {label}
              {href === '/documents' && docAlertCount > 0 && (
                <AlertBadge>{docAlertCount}</AlertBadge>
              )}
            </NavItem>
          </Link>
        ))}

        <Spacer />

        <form action={logout}>
          <button type="submit" style={{ width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
            <LogoutItem>
              <LogOut size={18} />
              Wyloguj się
            </LogoutItem>
          </button>
        </form>
      </Drawer>
    </>
  );
}
