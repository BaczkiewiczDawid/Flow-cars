'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { CarGrid } from './CarGrid';
import type { CarCardData } from './CarCard';

const FilterBar = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.ink};
`;

const HiddenInput = styled.input.attrs({ type: 'checkbox' })`
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
`;

const Track = styled.span<{ $on: boolean }>`
  display: inline-block;
  width: 40px;
  height: 23px;
  border-radius: 999px;
  background: ${({ $on, theme }) => ($on ? theme.colors.accent : theme.colors.borderStrong)};
  position: relative;
  transition: background 150ms;
  flex-shrink: 0;

  &::after {
    content: '';
    position: absolute;
    top: 3px;
    left: ${({ $on }) => ($on ? '20px' : '3px')};
    width: 17px;
    height: 17px;
    border-radius: 50%;
    background: #fff;
    transition: left 150ms;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
  }
`;

const Count = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.inkSoft};
`;

export function CarsWithFilter({ cars }: { cars: CarCardData[] }) {
  const [onlyDeals, setOnlyDeals] = useState(false);

  const dealsCount = cars.filter((c) => c.isUnderpriced).length;
  const displayed = onlyDeals ? cars.filter((c) => c.isUnderpriced) : cars;

  return (
    <>
      <FilterBar>
        <Label>
          <HiddenInput
            checked={onlyDeals}
            onChange={(e) => setOnlyDeals(e.target.checked)}
          />
          <Track $on={onlyDeals} />
          Tylko okazje
          <Count>({dealsCount} z {cars.length})</Count>
        </Label>
      </FilterBar>
      <CarGrid cars={displayed} onlyDeals={onlyDeals} />
    </>
  );
}
