'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { Phone, ExternalLink, MapPin, User, Building2 } from 'lucide-react';
import { PriceGapBar } from '@/components/cars/PriceGapBar';
import { SourceBadge } from '@/components/cars/Badges';
import { formatPrice } from '@/lib/format';

const Panel = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: sticky;
  top: 28px;
`;

const TopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const PriceBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const PriceLabel = styled.span`
  font-size: 11.5px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${({ theme }) => theme.colors.inkSoft};
`;

const Price = styled.p`
  font-family: ${({ theme }) => theme.font.display};
  font-size: 30px;
  font-weight: 700;
`;

const Divider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.border};
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 13.5px;
  color: ${({ theme }) => theme.colors.ink};

  svg {
    color: ${({ theme }) => theme.colors.inkFaint};
    flex-shrink: 0;
  }
`;

const PhoneButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  width: 100%;
  padding: 12px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: none;
  background: ${({ theme }) => theme.colors.accent};
  color: #fff;
  font-weight: 600;
  font-size: 14px;

  &:hover {
    background: ${({ theme }) => theme.colors.accentStrong};
  }
`;

const PhoneRevealed = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  width: 100%;
  padding: 12px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.accentStrong};
  font-weight: 700;
  font-family: ${({ theme }) => theme.font.mono};
  font-size: 15px;
`;

const ExternalLinkBtn = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 11px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.ink};
  font-weight: 600;
  font-size: 13.5px;

  &:hover {
    border-color: ${({ theme }) => theme.colors.borderStrong};
    background: ${({ theme }) => theme.colors.bgSoft};
  }
`;

const MockNote = styled.p`
  font-size: 11.5px;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.inkFaint};
  margin-top: -6px;

  code {
    font-family: ${({ theme }) => theme.font.mono};
    background: ${({ theme }) => theme.colors.bgSoft};
    padding: 1px 4px;
    border-radius: 4px;
  }
`;

export function ContactPanel({
  source,
  url,
  price,
  estimatedMarketPrice,
  sellerName,
  sellerPhone,
  sellerType,
  city,
  voivodeship,
  isMock,
}: {
  source: 'olx' | 'otomoto' | 'autoplac';
  url: string;
  price: number;
  estimatedMarketPrice: number | null;
  sellerName: string | null;
  sellerPhone: string | null;
  sellerType: string | null;
  city: string | null;
  voivodeship: string | null;
  isMock?: boolean;
}) {
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const profit = estimatedMarketPrice != null ? estimatedMarketPrice - price : null;

  return (
    <Panel>
      <TopRow>
        <SourceBadge $source={source}>{source}</SourceBadge>
        {profit != null && profit > 0 && (
          <span style={{ fontSize: 12.5, fontWeight: 700, color: '#1768D1' }}>
            +{formatPrice(profit)} potencjału
          </span>
        )}
      </TopRow>

      <PriceBlock>
        <PriceLabel>Cena ogłoszenia</PriceLabel>
        <Price>{formatPrice(price)}</Price>
      </PriceBlock>

      <PriceGapBar price={price} marketPrice={estimatedMarketPrice} size="lg" />

      <Divider />

      {(sellerName || sellerType) && (
        <InfoRow>
          {sellerType === 'firma' ? <Building2 size={16} /> : <User size={16} />}
          {sellerName ?? (sellerType === 'firma' ? 'Sprzedawca firmowy' : 'Sprzedawca prywatny')}
        </InfoRow>
      )}
      {city && (
        <InfoRow>
          <MapPin size={16} />
          {city}
          {voivodeship ? `, woj. ${voivodeship}` : ''}
        </InfoRow>
      )}

      {sellerPhone ? (
        phoneRevealed ? (
          <PhoneRevealed href={`tel:${sellerPhone.replace(/\s+/g, '')}`}>
            <Phone size={16} />
            {sellerPhone}
          </PhoneRevealed>
        ) : (
          <PhoneButton onClick={() => setPhoneRevealed(true)}>
            <Phone size={16} />
            Pokaż numer telefonu
          </PhoneButton>
        )
      ) : (
        <InfoRow style={{ color: '#9AA2AC', alignItems: 'flex-start' }}>
          <Phone size={16} style={{ marginTop: 2 }} />
          <span>
            Numer jest zasłonięty na {source === 'olx' ? 'OLX' : 'Otomoto'} (trzeba kliknąć
            &quot;Pokaż&quot; na żywo) - zobacz go w linku do ogłoszenia poniżej.
          </span>
        </InfoRow>
      )}

      <ExternalLinkBtn href={url} target="_blank" rel="noopener noreferrer">
        <ExternalLink size={15} />
        {isMock ? 'Zobacz podobne oferty na ' + source.toUpperCase() : 'Zobacz oryginalne ogłoszenie'}
      </ExternalLinkBtn>
      {isMock && (
        <MockNote>
          To dane przykładowe (tryb demo) - link prowadzi do wyszukiwania tego modelu na{' '}
          {source === 'olx' ? 'OLX' : 'Otomoto'}, nie do konkretnego ogłoszenia. W trybie{' '}
          <code>live</code> link prowadzi do realnej oferty.
        </MockNote>
      )}
    </Panel>
  );
}
