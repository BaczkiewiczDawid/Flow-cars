'use client';

import styled from 'styled-components';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

const Layout = styled.div`
  display: flex;
  min-height: 100vh;
`;

const Main = styled.main`
  flex: 1;
  min-width: 0;
  margin-left: ${({ theme }) => theme.layout.sidebarWidth};

  @media (max-width: 880px) {
    margin-left: 76px;
  }

  @media (max-width: 640px) {
    margin-left: 0;
    padding-bottom: 68px;
  }
`;

export function ShellClient({
  children,
  scraperMode,
  user,
}: {
  children: React.ReactNode;
  scraperMode: 'mock' | 'live';
  user: { email: string; name?: string | null };
}) {
  return (
    <Layout>
      <Sidebar scraperMode={scraperMode} user={user} />
      <Main>{children}</Main>
      <BottomNav />
    </Layout>
  );
}
