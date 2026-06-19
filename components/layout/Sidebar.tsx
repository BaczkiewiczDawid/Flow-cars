'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styled from 'styled-components';
import {
  LayoutDashboard,
  Heart,
  BarChart3,
  Settings,
  Radar,
  GitCompareArrows,
  Car,
  LogOut,
} from 'lucide-react';
import { logout } from '@/app/actions/logout';

const Aside = styled.aside`
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: ${({ theme }) => theme.layout.sidebarWidth};
  background: ${({ theme }) => theme.colors.sidebarBg};
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  z-index: 20;

  @media (max-width: 880px) {
    width: 76px;
    padding: 20px 12px;
    align-items: center;
  }
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 8px 28px;

  @media (max-width: 880px) {
    padding-bottom: 24px;
  }
`;

const BrandMark = styled.div`
  width: 34px;
  height: 34px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.accent};
  display: grid;
  place-items: center;
  flex-shrink: 0;
  color: #fff;
`;

const BrandText = styled.div`
  display: flex;
  flex-direction: column;
  line-height: 1.15;

  @media (max-width: 880px) {
    display: none;
  }
`;

const BrandTitle = styled.span`
  font-family: ${({ theme }) => theme.font.display};
  font-weight: 700;
  font-size: 16px;
  color: ${({ theme }) => theme.colors.sidebarTextActive};
`;

const BrandSubtitle = styled.span`
  font-size: 11.5px;
  color: ${({ theme }) => theme.colors.sidebarTextMuted};
`;

const Eyebrow = styled.div`
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.sidebarTextMuted};
  padding: 0 12px 8px;
  margin-top: 18px;

  @media (max-width: 880px) {
    display: none;
  }
`;

const NavList = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const NavItem = styled.div<{ $active?: boolean; $disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 12px;
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: 13.5px;
  font-weight: 500;
  position: relative;
  color: ${({ theme, $active }) =>
    $active ? theme.colors.sidebarTextActive : theme.colors.sidebarText};
  background: ${({ $active }) => ($active ? 'rgba(255,255,255,0.07)' : 'transparent')};
  opacity: ${({ $disabled }) => ($disabled ? 0.45 : 1)};
  cursor: ${({ $disabled }) => ($disabled ? 'default' : 'pointer')};
  transition: background 120ms ease, color 120ms ease;

  ${({ $active, theme }) =>
    $active &&
    `
    &::before {
      content: '';
      position: absolute;
      left: -16px;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 18px;
      border-radius: 0 4px 4px 0;
      background: ${theme.colors.accent};
    }
  `}

  &:hover {
    background: ${({ $disabled }) => ($disabled ? 'transparent' : 'rgba(255,255,255,0.06)')};
  }

  svg {
    flex-shrink: 0;
    color: ${({ theme, $active }) => ($active ? theme.colors.accent : 'currentColor')};
  }

  @media (max-width: 880px) {
    justify-content: center;
    padding: 10px;
  }
`;

const NavLabel = styled.span`
  flex: 1;
  white-space: nowrap;

  @media (max-width: 880px) {
    display: none;
  }
`;


const Spacer = styled.div`
  flex: 1;
`;

const SourceCard = styled.div`
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.sidebarBgRaised};
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  @media (max-width: 880px) {
    display: none;
  }
`;

const SourceRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.sidebarText};
`;

const Dot = styled.span<{ $color: string }>`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const ModeLabel = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.sidebarTextMuted};
  padding-top: 4px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  margin-top: 2px;
`;

const UserCard = styled.div`
  margin-top: 12px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.sidebarBgRaised};
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 8px;

  @media (max-width: 880px) {
    display: none;
  }
`;

const UserEmail = styled.div`
  flex: 1;
  min-width: 0;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.sidebarText};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const LogoutBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.sidebarTextMuted};
  display: flex;
  align-items: center;
  padding: 2px;
  flex-shrink: 0;
  &:hover { color: ${({ theme }) => theme.colors.sidebarText}; }
`;

interface NavConfigItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number }>;
  disabled?: boolean;
}

const mainNav: NavConfigItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Porównaj ofertę', href: '/compare', icon: GitCompareArrows },
  { label: 'Posiadane', href: '/owned', icon: Car },
  { label: 'Ulubione', href: '/ulubione', icon: Heart },
  { label: 'Statystyki', href: '/statystyki', icon: BarChart3 },
  { label: 'Ustawienia', href: '/settings', icon: Settings },
];


export function Sidebar({ scraperMode, user }: { scraperMode: 'mock' | 'live'; user: { email: string; name?: string | null } }) {
  const pathname = usePathname();

  const isItemActive = (href: string) =>
    href === '/' ? pathname === '/' || pathname.startsWith('/cars') : pathname === href;

  return (
    <Aside>
      <Brand>
        <BrandMark>
          <Radar size={18} />
        </BrandMark>
        <BrandText>
          <BrandTitle>Flow Cars</BrandTitle>
          <BrandSubtitle>panel autohandlu</BrandSubtitle>
        </BrandText>
      </Brand>

      <Eyebrow>Ogłoszenia</Eyebrow>
      <NavList>
        {mainNav.map((item) => (
          <Link key={item.href} href={item.href} title={item.label}>
            <NavItem $active={isItemActive(item.href)}>
              <item.icon size={18} />
              <NavLabel>{item.label}</NavLabel>
            </NavItem>
          </Link>
        ))}
      </NavList>

      <Spacer />

      <SourceCard>
        <SourceRow>
          <Dot $color="#FFFFFF" />
          OLX
        </SourceRow>
        <SourceRow>
          <Dot $color="#2F8AFF" />
          Otomoto
        </SourceRow>
        <SourceRow>
          <Dot $color="#E84118" />
          Autoplac
        </SourceRow>
        <ModeLabel>
          tryb danych: {scraperMode === 'live' ? 'live (skanowanie)' : 'przykładowe'}
        </ModeLabel>
      </SourceCard>

      <UserCard>
        <UserEmail title={user.email}>{user.name || user.email}</UserEmail>
        <form action={logout}>
          <LogoutBtn type="submit" title="Wyloguj się">
            <LogOut size={14} />
          </LogoutBtn>
        </form>
      </UserCard>
    </Aside>
  );
}
