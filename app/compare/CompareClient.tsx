'use client';

import { useState } from 'react';
import Image from 'next/image';
import styled from 'styled-components';
import { Search, Link2, SlidersHorizontal, TrendingDown, Gauge, Fuel, MapPin, Calendar, ExternalLink, AlertCircle } from 'lucide-react';
import { BRAND_NAMES, getModels } from '@/lib/carBrands';

interface CompareListing {
  url: string;
  title: string;
  price: number;
  year: number;
  mileage: number;
  engineCapacity?: number;
  enginePower?: number;
  fuelType?: string;
  city?: string;
  mainPhoto?: string;
  source: 'otomoto' | 'olx';
}

interface CompareResult {
  brand: string;
  model: string;
  year?: number;
  mileage?: number;
  fuelType?: string;
  generationRange?: { yearFrom: number; yearTo: number };
  estimatedMarketPrice: number | null;
  sampleSize: number;
  listings: CompareListing[];
}

// ─── layout ───────────────────────────────────────
const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const PageTitle = styled.h1`
  font-size: 22px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.ink};
  margin: 0;
`;

// ─── tabs ─────────────────────────────────────────
const Tabs = styled.div`
  display: flex;
  gap: 4px;
  background: ${({ theme }) => theme.colors.bgSoft};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: 4px;
  width: fit-content;
`;

const Tab = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 16px;
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: 13.5px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  background: ${({ $active, theme }) => ($active ? theme.colors.surface : 'transparent')};
  color: ${({ $active, theme }) => ($active ? theme.colors.ink : theme.colors.inkSoft)};
  box-shadow: ${({ $active, theme }) => ($active ? theme.shadow.card : 'none')};
  transition: background 120ms ease, color 120ms ease;

  &:hover {
    color: ${({ theme }) => theme.colors.ink};
  }
`;

// ─── form card ────────────────────────────────────
const FormCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: ${({ theme }) => theme.shadow.card};
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 14px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bgSoft};
  color: ${({ theme }) => theme.colors.ink};
  font-size: 14px;
  outline: none;
  box-sizing: border-box;

  &::placeholder {
    color: ${({ theme }) => theme.colors.inkFaint};
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.accent};
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 14px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bgSoft};
  color: ${({ theme }) => theme.colors.ink};
  font-size: 14px;
  outline: none;
  cursor: pointer;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.accent};
  }
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const Label = styled.label`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.inkSoft};
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const ParamsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
`;

const SearchBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 24px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.accent};
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  align-self: flex-start;
  transition: opacity 140ms ease;

  &:disabled {
    opacity: 0.55;
    cursor: default;
  }

  &:not(:disabled):hover {
    opacity: 0.88;
  }
`;

const ErrorMsg = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: #ef4444;
  font-size: 14px;
`;

// ─── market price card ────────────────────────────
const MarketCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.accent};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
  box-shadow: ${({ theme }) => theme.shadow.raised};
`;

const MarketLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const MarketLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${({ theme }) => theme.colors.inkSoft};
`;

const MarketPrice = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.accentStrong};
  font-family: ${({ theme }) => theme.font.mono};
`;

const MarketMeta = styled.div`
  font-size: 12.5px;
  color: ${({ theme }) => theme.colors.inkFaint};
`;

const NoMarketCard = styled(MarketCard)`
  border-color: ${({ theme }) => theme.colors.border};
`;

const SectionTitle = styled.h2`
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.ink};
  margin: 0;
`;

// ─── listings grid ────────────────────────────────
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
`;

const ListingCard = styled.a`
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadow.card};
  text-decoration: none;
  transition: transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: ${({ theme }) => theme.shadow.raised};
    border-color: ${({ theme }) => theme.colors.borderStrong};
  }
`;

const CardImgWrap = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  background: ${({ theme }) => theme.colors.bgSoft};
  flex-shrink: 0;
`;

const SourceBadge = styled.span<{ $source: string }>`
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 2;
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 2px 7px;
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ $source }) => ($source === 'otomoto' ? '#2F8AFF' : '#333')};
  color: #fff;
`;

const PriceBadge = styled.span<{ $deviation: number | null }>`
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ $deviation }) =>
    $deviation == null ? 'transparent'
    : $deviation <= -10 ? 'rgba(34,197,94,0.9)'
    : $deviation >= 10 ? 'rgba(239,68,68,0.85)'
    : 'rgba(251,191,36,0.9)'};
  color: ${({ $deviation }) => ($deviation == null ? 'transparent' : '#fff')};
`;

const CardBody = styled.div`
  padding: 12px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
`;

const CardTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.ink};
  line-height: 1.35;
`;

const CardPrice = styled.div`
  font-size: 17px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.ink};
  font-family: ${({ theme }) => theme.font.mono};
`;

const CardSpecs = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.inkSoft};
`;

const Spec = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;

  svg {
    color: ${({ theme }) => theme.colors.inkFaint};
    flex-shrink: 0;
  }
`;

const ExtLink = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11.5px;
  color: ${({ theme }) => theme.colors.accent};
  margin-top: auto;
`;

// ─── helpers ──────────────────────────────────────
function engineLabel(cap?: number, power?: number, fuel?: string) {
  const parts: string[] = [];
  if (cap) parts.push(`${(cap / 1000).toFixed(1)}L`);
  if (power) parts.push(`${power} KM`);
  if (fuel) parts.push(fuel);
  return parts.join(' · ') || null;
}

function deviationLabel(price: number, market: number | null): string | null {
  if (!market) return null;
  const pct = Math.round(((price - market) / market) * 100);
  return pct >= 0 ? `+${pct}%` : `${pct}%`;
}

function deviationValue(price: number, market: number | null): number | null {
  if (!market) return null;
  return Math.round(((price - market) / market) * 100);
}

// ─── field helper ─────────────────────────────────
function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <FieldGroup>
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </FieldGroup>
  );
}

// ─── main component ───────────────────────────────
export function CompareClient() {
  const [tab, setTab] = useState<'url' | 'manual'>('url');
  const [url, setUrl] = useState('');
  const [fields, setFields] = useState({
    brand: '', model: '', year: '', mileage: '', engineCapacity: '', enginePower: '', fuelType: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompareResult | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const body =
        tab === 'url'
          ? { url }
          : {
              brand: fields.brand || undefined,
              model: fields.model || undefined,
              year: fields.year ? Number(fields.year) : undefined,
              mileage: fields.mileage ? Number(fields.mileage) : undefined,
              engineCapacity: fields.engineCapacity ? Number(fields.engineCapacity) : undefined,
              enginePower: fields.enginePower ? Number(fields.enginePower) : undefined,
              fuelType: fields.fuelType || undefined,
            };
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Błąd serwera');
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Wystąpił nieoczekiwany błąd');
    } finally {
      setLoading(false);
    }
  };

  const setField = (key: keyof typeof fields) => (v: string) =>
    setFields((f) => ({
      ...f,
      [key]: v,
      // Reset model when brand changes
      ...(key === 'brand' ? { model: '' } : {}),
    }));

  const availableModels = getModels(fields.brand);

  return (
    <Wrap>
      <PageTitle>Porównaj ofertę z rynkiem</PageTitle>

      <Tabs>
        <Tab $active={tab === 'url'} onClick={() => setTab('url')}>
          <Link2 size={15} />
          Wklej link
        </Tab>
        <Tab $active={tab === 'manual'} onClick={() => setTab('manual')}>
          <SlidersHorizontal size={15} />
          Parametry ręcznie
        </Tab>
      </Tabs>

      <FormCard>
        {tab === 'url' ? (
          <FieldGroup>
            <Label>Link do ogłoszenia (OLX lub Otomoto)</Label>
            <Input
              placeholder="https://www.otomoto.pl/... lub https://www.olx.pl/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </FieldGroup>
        ) : (
          <ParamsGrid>
            <FieldGroup>
              <Label>Marka</Label>
              <Select value={fields.brand} onChange={(e) => setField('brand')(e.target.value)}>
                <option value="">— wybierz markę —</option>
                {BRAND_NAMES.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </Select>
            </FieldGroup>
            <FieldGroup>
              <Label>Model</Label>
              <Select
                value={fields.model}
                onChange={(e) => setField('model')(e.target.value)}
                disabled={!fields.brand}
              >
                <option value="">{fields.brand ? '— wybierz model —' : '— najpierw wybierz markę —'}</option>
                {availableModels.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </Select>
            </FieldGroup>
            <Field label="Rocznik" value={fields.year} onChange={setField('year')} placeholder="np. 2018" type="number" />
            <Field label="Przebieg (km)" value={fields.mileage} onChange={setField('mileage')} placeholder="np. 120000" type="number" />
            <Field label="Pojemność silnika (cm³)" value={fields.engineCapacity} onChange={setField('engineCapacity')} placeholder="np. 1968" type="number" />
            <Field label="Moc (KM)" value={fields.enginePower} onChange={setField('enginePower')} placeholder="np. 150" type="number" />
            <FieldGroup>
              <Label>Rodzaj paliwa</Label>
              <Select value={fields.fuelType} onChange={(e) => setField('fuelType')(e.target.value)}>
                <option value="">— dowolne —</option>
                <option value="benzyna">Benzyna</option>
                <option value="diesel">Diesel</option>
                <option value="hybryda">Hybryda</option>
                <option value="LPG">LPG</option>
                <option value="elektryczny">Elektryczny</option>
              </Select>
            </FieldGroup>
          </ParamsGrid>
        )}

        <SearchBtn onClick={handleSearch} disabled={loading}>
          <Search size={16} />
          {loading ? 'Szukam…' : 'Szukaj'}
        </SearchBtn>
      </FormCard>

      {error && (
        <ErrorMsg>
          <AlertCircle size={16} />
          {error}
        </ErrorMsg>
      )}

      {result && (
        <>
          {result.estimatedMarketPrice != null ? (
            <MarketCard>
              <MarketLeft>
                <MarketLabel>Szacowana cena rynkowa</MarketLabel>
                <MarketPrice>{result.estimatedMarketPrice.toLocaleString('pl-PL')} zł</MarketPrice>
                <MarketMeta>
                  {result.brand} {result.model}
                  {result.generationRange
                    ? ` · generacja ${result.generationRange.yearFrom}–${result.generationRange.yearTo === 9999 ? 'obecnie' : result.generationRange.yearTo}`
                    : result.year ? ` · ${result.year}` : ''}
                  {result.fuelType ? ` · ${result.fuelType}` : ''}
                  {' · '}próbka: {result.sampleSize} ogłoszeń
                </MarketMeta>
              </MarketLeft>
              <TrendingDown size={36} style={{ opacity: 0.2 }} />
            </MarketCard>
          ) : (
            <NoMarketCard>
              <MarketLeft>
                <MarketLabel>Cena rynkowa</MarketLabel>
                <MarketMeta>Za mało porównywalnych ogłoszeń, aby obliczyć cenę rynkową.</MarketMeta>
              </MarketLeft>
            </NoMarketCard>
          )}

          {result.listings.length > 0 && (
            <>
              <SectionTitle>
                Porównywalne ogłoszenia ({result.listings.length})
              </SectionTitle>
              <Grid>
                {result.listings.map((l) => {
                  const dev = deviationValue(l.price, result.estimatedMarketPrice);
                  const devLabel = deviationLabel(l.price, result.estimatedMarketPrice);
                  return (
                    <ListingCard key={l.url} href={l.url} target="_blank" rel="noopener noreferrer">
                      <CardImgWrap>
                        <SourceBadge $source={l.source}>{l.source}</SourceBadge>
                        {devLabel && <PriceBadge $deviation={dev}>{devLabel}</PriceBadge>}
                        {l.mainPhoto && (
                          <Image
                            src={l.mainPhoto}
                            alt={l.title}
                            fill
                            sizes="(max-width: 880px) 100vw, 33vw"
                            style={{ objectFit: 'cover' }}
                          />
                        )}
                      </CardImgWrap>
                      <CardBody>
                        <CardTitle>{l.title}</CardTitle>
                        <CardPrice>{l.price.toLocaleString('pl-PL')} zł</CardPrice>
                        <CardSpecs>
                          {l.year > 0 && <Spec><Calendar size={12} />{l.year}</Spec>}
                          {engineLabel(l.engineCapacity, l.enginePower, l.fuelType) && (
                            <Spec><Fuel size={12} />{engineLabel(l.engineCapacity, l.enginePower, l.fuelType)}</Spec>
                          )}
                          {l.mileage > 0 && <Spec><Gauge size={12} />{l.mileage.toLocaleString('pl-PL')} km</Spec>}
                          {l.city && <Spec><MapPin size={12} />{l.city}</Spec>}
                        </CardSpecs>
                        <ExtLink>
                          <ExternalLink size={12} />
                          Otwórz ogłoszenie
                        </ExtLink>
                      </CardBody>
                    </ListingCard>
                  );
                })}
              </Grid>
            </>
          )}

          {result.listings.length === 0 && (
            <MarketMeta style={{ textAlign: 'center', padding: '32px 0' }}>
              Brak porównywalnych ogłoszeń na Otomoto dla podanych parametrów.
            </MarketMeta>
          )}
        </>
      )}
    </Wrap>
  );
}
