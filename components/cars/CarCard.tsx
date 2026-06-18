'use client';

import Link from 'next/link';
import Image from 'next/image';
import styled from 'styled-components';
import { Gauge, Fuel, MapPin, Calendar, Clock, Heart } from 'lucide-react';
import { SourceBadge, DiscountBadge } from './Badges';

export interface CarCardData {
  id: number;
  source: 'olx' | 'otomoto' | 'autoplac';
  title: string;
  brand: string;
  model: string;
  generation: string | null;
  productionYear: number;
  engineCapacity: number | null;
  enginePower: number | null;
  fuelType: string | null;
  gearbox: string | null;
  mileage: number;
  price: number;
  estimatedMarketPrice: number | null;
  priceDeviationPercent: number | null;
  isUnderpriced: boolean;
  mainPhoto: string | null;
  city: string | null;
  listedAt: Date | null;
  marketListingUrl: string;
  isFavorite: boolean;
}

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadow.card};
  transition: transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease;
  height: 100%;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-3px);
    box-shadow: ${({ theme }) => theme.shadow.raised};
    border-color: ${({ theme }) => theme.colors.borderStrong};
  }
`;

const ImageWrap = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  background: ${({ theme }) => theme.colors.bgSoft};
`;

const BadgeRow = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  z-index: 2;
`;

const RightBadges = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const HeartBtn = styled.button<{ $active: boolean }>`
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  color: ${({ $active }) => ($active ? '#ef4444' : '#fff')};
  transition: background 120ms, color 120ms, transform 120ms;
  &:hover { background: rgba(0, 0, 0, 0.65); transform: scale(1.1); }
`;

const Body = styled.div`
  padding: 14px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
`;

const Title = styled.h3`
  font-size: 15.5px;
  line-height: 1.3;
  flex: 1;
  min-width: 0;
`;

const Price = styled.span`
  font-size: 15.5px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.ink};
  white-space: nowrap;
`;

const Generation = styled.span`
  color: ${({ theme }) => theme.colors.inkSoft};
  font-weight: 500;
`;

const SpecsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12.5px;
  color: ${({ theme }) => theme.colors.inkSoft};
`;

const SpecItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;

  svg {
    color: ${({ theme }) => theme.colors.inkFaint};
    flex-shrink: 0;
  }
`;

const Divider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.border};
  margin: 2px 0 4px;
`;

const MarketRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12.5px;
`;

const MarketLabel = styled.span`
  color: ${({ theme }) => theme.colors.inkSoft};
`;

const MarketValue = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.accentStrong};
  font-family: ${({ theme }) => theme.font.mono};
`;

const ProfitHint = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.accentStrong};
  font-weight: 600;
`;

const NoMarket = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.inkFaint};
  margin: 0;
`;

const MarketSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px;
  margin: -4px -6px;
  border-radius: ${({ theme }) => theme.radius.md};
  cursor: pointer;
  transition: background 120ms ease;

  &:hover {
    background: ${({ theme }) => theme.colors.bgSoft};
  }
`;


function daysAgoLabel(date: Date | null): string | null {
  if (!date) return null;
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days === 0) return 'Dzisiaj';
  if (days === 1) return 'Wczoraj';
  return `${days} dni temu`;
}

function engineLabel(capacity: number | null, power: number | null, fuel: string | null) {
  const parts: string[] = [];
  if (capacity) parts.push(`${(capacity / 1000).toFixed(1)}L`);
  if (power) parts.push(`${power} KM`);
  if (fuel) parts.push(fuel);
  return parts.join(' · ') || '—';
}

export function CarCard({ car, onToggleFavorite }: { car: CarCardData; onToggleFavorite?: () => void }) {
  const profit =
    car.estimatedMarketPrice != null ? car.estimatedMarketPrice - car.price : null;

  return (
    <Link href={`/cars/${car.id}`}>
      <Card>
        <ImageWrap>
          <BadgeRow>
            <SourceBadge $source={car.source}>{car.source}</SourceBadge>
            <RightBadges>
              {car.isUnderpriced && car.priceDeviationPercent != null && (
                <DiscountBadge percent={car.priceDeviationPercent} />
              )}
              {onToggleFavorite && (
                <HeartBtn
                  $active={car.isFavorite}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(); }}
                  title={car.isFavorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
                >
                  <Heart size={15} fill={car.isFavorite ? 'currentColor' : 'none'} />
                </HeartBtn>
              )}
            </RightBadges>
          </BadgeRow>
          {car.mainPhoto && (
            <Image
              src={car.mainPhoto}
              alt={car.title}
              fill
              sizes="(max-width: 880px) 100vw, (max-width: 1280px) 50vw, 33vw"
              style={{ objectFit: 'cover' }}
            />
          )}
        </ImageWrap>

        <Body>
          <TitleRow>
            <Title>
              {car.brand} {car.model}{' '}
              {car.generation && <Generation>{car.generation}</Generation>}
            </Title>
            <Price>{car.price.toLocaleString('pl-PL')} zł</Price>
          </TitleRow>

          <SpecsRow>
            <SpecItem>
              <Calendar size={14} />
              {car.productionYear}
            </SpecItem>
            <SpecItem>
              <Fuel size={14} />
              {engineLabel(car.engineCapacity, car.enginePower, car.fuelType)}
            </SpecItem>
            <SpecItem>
              <Gauge size={14} />
              {car.mileage.toLocaleString('pl-PL')} km
            </SpecItem>
            {car.city && (
              <SpecItem>
                <MapPin size={14} />
                {car.city}
              </SpecItem>
            )}
            {daysAgoLabel(car.listedAt) && (
              <SpecItem>
                <Clock size={14} />
                {daysAgoLabel(car.listedAt)}
              </SpecItem>
            )}
          </SpecsRow>

          <Divider />

          {car.estimatedMarketPrice != null ? (
            <MarketSection
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(car.marketListingUrl, '_blank', 'noopener,noreferrer');
              }}
            >
              <MarketRow>
                <MarketLabel>Cena rynkowa</MarketLabel>
                <MarketValue>{car.estimatedMarketPrice.toLocaleString('pl-PL')} zł</MarketValue>
              </MarketRow>
              {profit != null && profit > 0 && (
                <ProfitHint>+{profit.toLocaleString('pl-PL')} zł potencjalnego zarobku</ProfitHint>
              )}
            </MarketSection>
          ) : (
            <NoMarket>Za mało porównywalnych ogłoszeń do wyceny.</NoMarket>
          )}
        </Body>
      </Card>
    </Link>
  );
}
