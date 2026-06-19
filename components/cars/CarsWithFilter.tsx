'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { CarGrid } from './CarGrid';
import type { CarCardData } from './CarCard';

const SOURCE_LABELS: Record<string, string> = {
  olx: 'OLX',
  otomoto: 'OtoMoto',
  autoplac: 'Autoplac',
};

type SortKey = 'newest' | 'cheapest' | 'deal';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'newest',   label: 'Najnowsze' },
  { key: 'cheapest', label: 'Najtańsze' },
  { key: 'deal',     label: 'Największa okazja' },
];

function sortCars(cars: CarCardData[], key: SortKey): CarCardData[] {
  const copy = [...cars];
  if (key === 'newest') {
    return copy.sort((a, b) => {
      const da = (a.listedAt ?? new Date(0)).getTime();
      const db = (b.listedAt ?? new Date(0)).getTime();
      return db - da;
    });
  }
  if (key === 'cheapest') return copy.sort((a, b) => a.price - b.price);
  // deal: most negative priceDeviationPercent first; null pushed to end
  return copy.sort((a, b) => {
    if (a.priceDeviationPercent === null) return 1;
    if (b.priceDeviationPercent === null) return -1;
    return a.priceDeviationPercent - b.priceDeviationPercent;
  });
}

// ─── styled ───────────────────────────────────────────────────────────────────

const Bar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
`;

const SortGroup = styled.div`
  display: flex;
  gap: 4px;
  background: ${({ theme }) => theme.colors.bgSoft};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: 3px;
`;

const SortPill = styled.button<{ $active: boolean }>`
  padding: 6px 13px;
  border-radius: ${({ theme }) => theme.radius.sm};
  border: none;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 120ms, color 120ms, box-shadow 120ms;
  background: ${({ $active, theme }) => ($active ? theme.colors.surface : 'transparent')};
  color: ${({ $active, theme }) => ($active ? theme.colors.ink : theme.colors.inkSoft)};
  box-shadow: ${({ $active, theme }) => ($active ? theme.shadow.card : 'none')};

  @media (max-width: 640px) {
    padding: 5px 9px;
    font-size: 12px;
  }
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

const SourcePill = styled.button<{ $active: boolean }>`
  padding: 6px 13px;
  border-radius: ${({ theme }) => theme.radius.sm};
  border: none;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 120ms, color 120ms, box-shadow 120ms;
  background: ${({ $active, theme }) => ($active ? theme.colors.ink : 'transparent')};
  color: ${({ $active, theme }) => ($active ? theme.colors.surface : theme.colors.inkSoft)};
  box-shadow: ${({ $active, theme }) => ($active ? theme.shadow.card : 'none')};

  @media (max-width: 640px) {
    padding: 5px 9px;
    font-size: 12px;
  }
`;

// ─────────────────────────────────────────────────────────────────────────────

export function CarsWithFilter({ cars, hideUnfavorited = false }: { cars: CarCardData[]; hideUnfavorited?: boolean }) {
  const [onlyDeals, setOnlyDeals] = useState(false);
  const [sort, setSort] = useState<SortKey>('newest');
  const [favs, setFavs] = useState<Set<number>>(() => new Set(cars.filter((c) => c.isFavorite).map((c) => c.id)));

  const presentSources = [...new Set(cars.map((c) => c.source))];
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);

  async function toggleFavorite(id: number) {
    const next = !favs.has(id);
    setFavs((s) => { const n = new Set(s); next ? n.add(id) : n.delete(id); return n; });
    await fetch(`/api/cars/${id}/favorite`, { method: 'POST' });
  }

  const carsWithFav = cars.map((c) => ({ ...c, isFavorite: favs.has(c.id) }));
  const base = hideUnfavorited ? carsWithFav.filter((c) => c.isFavorite) : carsWithFav;
  const bySource = sourceFilter ? base.filter((c) => c.source === sourceFilter) : base;
  const dealsCount = bySource.filter((c) => c.isUnderpriced).length;
  const filtered = onlyDeals ? bySource.filter((c) => c.isUnderpriced) : bySource;
  const displayed = sortCars(filtered, sort);

  return (
    <>
      <Bar>
        <SortGroup>
          {SORT_OPTIONS.map((o) => (
            <SortPill key={o.key} $active={sort === o.key} onClick={() => setSort(o.key)}>
              {o.label}
            </SortPill>
          ))}
        </SortGroup>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {presentSources.length > 1 && (
            <SortGroup>
              <SourcePill $active={sourceFilter === null} onClick={() => setSourceFilter(null)}>
                Wszystkie
              </SourcePill>
              {presentSources.map((src) => (
                <SourcePill
                  key={src}
                  $active={sourceFilter === src}
                  onClick={() => setSourceFilter(src)}
                >
                  {SOURCE_LABELS[src] ?? src}
                </SourcePill>
              ))}
            </SortGroup>
          )}

          <Label style={{ paddingLeft: presentSources.length > 1 ? 8 : 0 }}>
            <HiddenInput
              checked={onlyDeals}
              onChange={(e) => setOnlyDeals(e.target.checked)}
            />
            <Track $on={onlyDeals} />
            Tylko okazje
            <Count>({dealsCount} z {bySource.length})</Count>
          </Label>
        </div>
      </Bar>
      <CarGrid cars={displayed} onlyDeals={onlyDeals} onToggleFavorite={toggleFavorite} />
    </>
  );
}
