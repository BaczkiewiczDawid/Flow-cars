'use client';

import styled from 'styled-components';
import { ScrapeButton } from '@/components/cars/ScrapeButton';

const Row = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;

  @media (max-width: 600px) {
    flex-direction: column;
  }
`;

const Title = styled.h1`
  font-size: 24px;
  margin-bottom: 4px;
`;

const Subtitle = styled.p`
  font-size: 13.5px;
  color: ${({ theme }) => theme.colors.inkSoft};
  max-width: 540px;
`;

export function DashboardHeader() {
  return (
    <Row>
      <div>
        <Title>Przeskanowane oferty</Title>
      </div>
      <ScrapeButton />
    </Row>
  );
}
