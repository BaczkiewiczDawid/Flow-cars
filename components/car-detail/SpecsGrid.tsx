'use client';

import styled from 'styled-components';
import {
  Calendar,
  Gauge,
  Fuel,
  Cog,
  Car as CarIcon,
  Palette,
  Zap,
} from 'lucide-react';

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 14px;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 18px 20px;
`;

const Item = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Label = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${({ theme }) => theme.colors.inkSoft};

  svg {
    color: ${({ theme }) => theme.colors.accent};
  }
`;

const Value = styled.span`
  font-size: 15px;
  font-weight: 600;
  font-family: ${({ theme }) => theme.font.mono};
`;

export interface SpecsGridData {
  productionYear: number;
  mileage: number;
  engineCapacity: number | null;
  enginePower: number | null;
  fuelType: string | null;
  gearbox: string | null;
  bodyType: string | null;
  color: string | null;
}

export function SpecsGrid({ specs }: { specs: SpecsGridData }) {
  const items = [
    { label: 'Rok produkcji', value: String(specs.productionYear), icon: Calendar },
    { label: 'Przebieg', value: `${specs.mileage.toLocaleString('pl-PL')} km`, icon: Gauge },
    {
      label: 'Silnik',
      value: specs.engineCapacity ? `${(specs.engineCapacity / 1000).toFixed(1)} L` : '—',
      icon: Zap,
    },
    { label: 'Moc', value: specs.enginePower ? `${specs.enginePower} KM` : '—', icon: Zap },
    { label: 'Paliwo', value: specs.fuelType ?? '—', icon: Fuel },
    { label: 'Skrzynia', value: specs.gearbox ?? '—', icon: Cog },
    { label: 'Nadwozie', value: specs.bodyType ?? '—', icon: CarIcon },
    { label: 'Kolor', value: specs.color ?? '—', icon: Palette },
  ];

  return (
    <Grid>
      {items.map((item) => (
        <Item key={item.label}>
          <Label>
            <item.icon size={13} />
            {item.label}
          </Label>
          <Value>{item.value}</Value>
        </Item>
      ))}
    </Grid>
  );
}
