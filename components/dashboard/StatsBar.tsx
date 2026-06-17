'use client';

import styled from 'styled-components';
import { Radar, TrendingDown, PiggyBank, History } from 'lucide-react';
import { formatRelativeDate } from '@/lib/format';

const Bar = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 22px;

  @media (max-width: 880px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const Tile = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const TileTop = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${({ theme }) => theme.colors.inkSoft};

  svg {
    color: ${({ theme }) => theme.colors.accent};
  }
`;

const TileValue = styled.p`
  font-family: ${({ theme }) => theme.font.display};
  font-size: 25px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.ink};
`;

export function StatsBar({
  totalCars,
  underpricedCount,
  avgDiscountPercent,
  lastScanAt,
}: {
  totalCars: number;
  underpricedCount: number;
  avgDiscountPercent: number | null;
  lastScanAt: Date | null;
}) {
  return (
    <Bar>
      <Tile>
        <TileTop>
          <Radar size={14} /> Przeskanowane oferty
        </TileTop>
        <TileValue>{totalCars}</TileValue>
      </Tile>
      <Tile>
        <TileTop>
          <TrendingDown size={14} /> Okazje poniżej rynku
        </TileTop>
        <TileValue>{underpricedCount}</TileValue>
      </Tile>
      <Tile>
        <TileTop>
          <History size={14} /> Ostatni skan
        </TileTop>
        <TileValue style={{ fontSize: 16 }}>
          {lastScanAt ? formatRelativeDate(lastScanAt) : 'nigdy'}
        </TileValue>
      </Tile>
    </Bar>
  );
}
