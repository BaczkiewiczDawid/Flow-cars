'use client';

import styled from 'styled-components';
import { Compass } from 'lucide-react';
import { CarCard, type CarCardData } from './CarCard';

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 18px;
`;

const Empty = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
  padding: 72px 24px;
  color: ${({ theme }) => theme.colors.inkSoft};

  svg {
    color: ${({ theme }) => theme.colors.inkFaint};
  }
`;

const EmptyTitle = styled.h3`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.ink};
`;

const EmptyText = styled.p`
  font-size: 13.5px;
  max-width: 380px;
`;

export function CarGrid({ cars, onlyDeals = false, onToggleFavorite }: { cars: CarCardData[]; onlyDeals?: boolean; onToggleFavorite?: (id: number) => void }) {
  if (cars.length === 0) {
    return (
      <Empty>
        <Compass size={32} />
        <EmptyTitle>
          {onlyDeals ? 'Brak okazji do pokazania' : 'Brak ofert do pokazania'}
        </EmptyTitle>
        <EmptyText>
          {onlyDeals
            ? 'Żadne ogłoszenie nie spełnia jeszcze progu okazji cenowej. Uruchom skanowanie, żeby sprawdzić najnowsze oferty z OLX i Otomoto.'
            : 'Brak przeskanowanych ofert. Uruchom skanowanie, żeby pobrać najnowsze ogłoszenia z OLX i Otomoto.'}
        </EmptyText>
      </Empty>
    );
  }

  return (
    <Grid>
      {cars.map((car) => (
        <CarCard key={car.id} car={car} onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(car.id) : undefined} />
      ))}
    </Grid>
  );
}
