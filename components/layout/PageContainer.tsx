'use client';

import styled from 'styled-components';

export const PageContainer = styled.div`
  max-width: ${({ theme }) => theme.layout.maxContentWidth};
  margin: 0 auto;
  padding: 28px 28px 56px;

  @media (max-width: 880px) {
    padding: 20px 16px 48px;
  }
`;
