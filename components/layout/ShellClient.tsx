'use client';

import styled from 'styled-components';
import { Sidebar } from './Sidebar';

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
`;

export function ShellClient({
  children,
  scraperMode,
}: {
  children: React.ReactNode;
  scraperMode: 'mock' | 'live';
}) {
  return (
    <Layout>
      <Sidebar scraperMode={scraperMode} />
      <Main>{children}</Main>
    </Layout>
  );
}
