'use client';

import styled from 'styled-components';

const Wrap = styled.div<{ $size: 'sm' | 'lg' }>`
  display: flex;
  flex-direction: column;
  gap: ${({ $size }) => ($size === 'lg' ? '10px' : '6px')};
`;

const Track = styled.div<{ $size: 'sm' | 'lg' }>`
  position: relative;
  height: ${({ $size }) => ($size === 'lg' ? '8px' : '5px')};
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ theme }) => theme.colors.border};
  overflow: visible;
`;

const Gap = styled.div<{ $left: number; $width: number }>`
  position: absolute;
  top: 0;
  bottom: 0;
  left: ${({ $left }) => $left}%;
  width: ${({ $width }) => $width}%;
  background: ${({ theme }) => theme.colors.accent};
  border-radius: ${({ theme }) => theme.radius.pill};
`;

const Marker = styled.div<{ $left: number; $size: 'sm' | 'lg'; $variant: 'price' | 'market' }>`
  position: absolute;
  top: 50%;
  left: ${({ $left }) => $left}%;
  transform: translate(-50%, -50%);
  width: ${({ $size }) => ($size === 'lg' ? '14px' : '10px')};
  height: ${({ $size }) => ($size === 'lg' ? '14px' : '10px')};
  border-radius: 50%;
  border: 2px solid ${({ theme, $variant }) =>
    $variant === 'price' ? theme.colors.ink : theme.colors.accent};
  background: #fff;
`;

const Labels = styled.div<{ $size: 'sm' | 'lg' }>`
  display: flex;
  justify-content: space-between;
  font-size: ${({ $size }) => ($size === 'lg' ? '13px' : '11.5px')};
  font-family: ${({ theme }) => theme.font.mono};
`;

const LabelGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
`;

const LabelCaption = styled.span`
  font-family: ${({ theme }) => theme.font.body};
  font-size: 10.5px;
  color: ${({ theme }) => theme.colors.inkSoft};
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const PriceValue = styled.span<{ $tone?: 'ink' | 'accent' }>`
  font-weight: 600;
  color: ${({ theme, $tone }) =>
    $tone === 'accent' ? theme.colors.accentStrong : theme.colors.ink};
`;

const NoData = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.inkFaint};
  margin: 0;
`;

export function PriceGapBar({
  price,
  marketPrice,
  size = 'sm',
}: {
  price: number;
  marketPrice: number | null;
  size?: 'sm' | 'lg';
}) {
  if (marketPrice == null) {
    return <NoData>Za mało porównywalnych ogłoszeń do wyceny rynkowej.</NoData>;
  }

  const min = Math.min(price, marketPrice) * 0.95;
  const max = Math.max(price, marketPrice) * 1.05;
  const range = max - min || 1;
  const pricePct = ((price - min) / range) * 100;
  const marketPct = ((marketPrice - min) / range) * 100;
  const gapLeft = Math.min(pricePct, marketPct);
  const gapWidth = Math.abs(marketPct - pricePct);

  return (
    <Wrap $size={size}>
      <Track $size={size}>
        <Gap $left={gapLeft} $width={gapWidth} />
        <Marker $left={pricePct} $size={size} $variant="price" />
        <Marker $left={marketPct} $size={size} $variant="market" />
      </Track>
      <Labels $size={size}>
        <LabelGroup>
          <LabelCaption>Cena zakupu</LabelCaption>
          <PriceValue>{price.toLocaleString('pl-PL')} zł</PriceValue>
        </LabelGroup>
        <LabelGroup style={{ alignItems: 'flex-end' }}>
          <LabelCaption>Cena rynkowa</LabelCaption>
          <PriceValue $tone="accent">{marketPrice.toLocaleString('pl-PL')} zł</PriceValue>
        </LabelGroup>
      </Labels>
    </Wrap>
  );
}
