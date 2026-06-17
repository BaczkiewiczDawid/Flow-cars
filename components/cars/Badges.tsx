'use client';

import styled from 'styled-components';
import { TrendingDown } from 'lucide-react';

export const SourceBadge = styled.span<{ $source: 'olx' | 'otomoto' }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  padding: 3px 8px;
  border-radius: ${({ theme }) => theme.radius.pill};
  text-transform: uppercase;
  color: #fff;
  background: ${({ theme, $source }) =>
    $source === 'olx' ? theme.colors.olx : theme.colors.otomoto};
`;

const DiscountWrap = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 700;
  font-family: ${({ theme }) => theme.font.mono};
  padding: 3px 9px;
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ theme }) => theme.colors.accentSoft};
  color: ${({ theme }) => theme.colors.accentStrong};
`;

export function DiscountBadge({ percent }: { percent: number }) {
  return (
    <DiscountWrap>
      <TrendingDown size={13} />
      {Math.round(Math.abs(percent))}% poniżej rynku
    </DiscountWrap>
  );
}
