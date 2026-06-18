'use client';

import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Save, RotateCcw, Check } from 'lucide-react';
import type { AppSettings } from '@/lib/settings';

const DEFAULT: AppSettings = {
  yearTolerance: 1,
  mileageTolerance: 50000,
  engineTolerance: 0,
  underpricedThresholdPercent: 15,
  requireFuelMatch: true,
  dealerListingThreshold: 3,
  listingsPerPortal: 50,
  locationCity: 'gliwice',
  locationRadiusKm: 30,
  priceMin: 0,
  priceMax: 0,
};

// ─── layout ───────────────────────────────────────────────────────────────────

const Wrap = styled.div`
  max-width: 680px;
  padding: 40px 32px;
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const PageTitle = styled.h1`
  font-size: 22px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.ink};
  margin: 0 0 4px;
`;

const PageSubtitle = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.inkSoft};
  margin: 0;
`;

// ─── section card ─────────────────────────────────────────────────────────────

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const SectionTitle = styled.h2`
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.inkFaint};
  margin: 0 0 4px;
`;

// ─── field row ────────────────────────────────────────────────────────────────

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
`;

const Label = styled.div`
  flex: 1;
`;

const LabelText = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.ink};
`;

const LabelHint = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.inkFaint};
  margin-top: 2px;
`;

const TextInput = styled.input`
  width: 160px;
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.ink};
  background: ${({ theme }) => theme.colors.bgSoft};
  outline: none;

  &:focus {
    border-color: ${({ theme }) => theme.colors.accent};
    background: ${({ theme }) => theme.colors.accentSofter};
  }
`;

const NumberInput = styled.input`
  width: 100px;
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: 14px;
  font-family: ${({ theme }) => theme.font.mono};
  color: ${({ theme }) => theme.colors.ink};
  background: ${({ theme }) => theme.colors.bgSoft};
  text-align: right;
  outline: none;

  &:focus {
    border-color: ${({ theme }) => theme.colors.accent};
    background: ${({ theme }) => theme.colors.accentSofter};
  }
`;

const Unit = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.inkFaint};
  min-width: 28px;
`;

const InputWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
`;

// ─── toggle ───────────────────────────────────────────────────────────────────

const ToggleButton = styled.button<{ $on: boolean }>`
  width: 44px;
  height: 24px;
  border-radius: ${({ theme }) => theme.radius.pill};
  border: none;
  cursor: pointer;
  background: ${({ $on, theme }) => ($on ? theme.colors.accent : theme.colors.border)};
  position: relative;
  transition: background 150ms ease;
  flex-shrink: 0;

  &::after {
    content: '';
    position: absolute;
    top: 3px;
    left: ${({ $on }) => ($on ? '23px' : '3px')};
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #fff;
    transition: left 150ms ease;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }
`;

// ─── actions ──────────────────────────────────────────────────────────────────

const Actions = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const Btn = styled.button<{ $variant?: 'primary' | 'ghost' }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 120ms, opacity 120ms;

  ${({ $variant, theme }) =>
    $variant === 'ghost'
      ? `
        background: transparent;
        color: ${theme.colors.inkSoft};
        border-color: ${theme.colors.border};
        &:hover { background: ${theme.colors.bgSoft}; }
      `
      : `
        background: ${theme.colors.accent};
        color: #fff;
        &:hover { background: ${theme.colors.accentStrong}; }
      `}
`;

const SavedBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.success};
  font-weight: 500;
`;

// ─── divider ──────────────────────────────────────────────────────────────────

const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  margin: 0;
`;

// ─────────────────────────────────────────────────────────────────────────────

export function SettingsClient() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => { setSettings({ ...DEFAULT, ...data }); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function num(key: keyof AppSettings) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = Number(e.target.value);
      if (!isNaN(v) && v >= 0) setSettings((s) => ({ ...s, [key]: v }));
    };
  }

  function str(key: keyof AppSettings) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setSettings((s) => ({ ...s, [key]: e.target.value }));
  }

  function toggle(key: keyof AppSettings) {
    setSettings((s) => ({ ...s, [key]: !s[key] }));
  }

  async function save() {
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function reset() {
    const res = await fetch('/api/settings', { method: 'DELETE' });
    const data = await res.json();
    setSettings({ ...DEFAULT, ...data });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (loading) return null;

  return (
    <Wrap>
      <div>
        <PageTitle>Ustawienia</PageTitle>
        <PageSubtitle>Globalne parametry analizy rynkowej i filtrowania ogłoszeń.</PageSubtitle>
      </div>

      <Card>
        <SectionTitle>Porównanie cen rynkowych</SectionTitle>

        <Row>
          <Label>
            <LabelText>Rozbieżność rocznika</LabelText>
            <LabelHint>±N lat względem szukanego rocznika przy wyborze porównywalnych ofert</LabelHint>
          </Label>
          <InputWrap>
            <NumberInput
              type="number"
              min={0}
              max={10}
              value={settings.yearTolerance}
              onChange={num('yearTolerance')}
            />
            <Unit>lat</Unit>
          </InputWrap>
        </Row>

        <Divider />

        <Row>
          <Label>
            <LabelText>Rozbieżność przebiegu</LabelText>
            <LabelHint>±N km względem przebiegu szukanego auta</LabelHint>
          </Label>
          <InputWrap>
            <NumberInput
              type="number"
              min={0}
              step={5000}
              value={settings.mileageTolerance}
              onChange={num('mileageTolerance')}
            />
            <Unit>km</Unit>
          </InputWrap>
        </Row>

        <Divider />

        <Row>
          <Label>
            <LabelText>Rozbieżność pojemności silnika</LabelText>
            <LabelHint>±N cm³ — wpisz 0, aby wyłączyć filtrowanie po silniku</LabelHint>
          </Label>
          <InputWrap>
            <NumberInput
              type="number"
              min={0}
              step={50}
              value={settings.engineTolerance}
              onChange={num('engineTolerance')}
            />
            <Unit>cm³</Unit>
          </InputWrap>
        </Row>

        <Divider />

        <Row>
          <Label>
            <LabelText>Wymagaj zgodności rodzaju paliwa</LabelText>
            <LabelHint>Jeśli brak wystarczającej próbki, porównanie jest wykonywane bez tego filtru</LabelHint>
          </Label>
          <ToggleButton $on={settings.requireFuelMatch} onClick={() => toggle('requireFuelMatch')} />
        </Row>
      </Card>

      <Card>
        <SectionTitle>Identyfikacja okazji</SectionTitle>

        <Row>
          <Label>
            <LabelText>Próg niedowycenia</LabelText>
            <LabelHint>Oferta tańsza o co najmniej N% od mediany rynkowej jest oznaczana jako okazja</LabelHint>
          </Label>
          <InputWrap>
            <NumberInput
              type="number"
              min={1}
              max={99}
              value={settings.underpricedThresholdPercent}
              onChange={num('underpricedThresholdPercent')}
            />
            <Unit>%</Unit>
          </InputWrap>
        </Row>
      </Card>

      <Card>
        <SectionTitle>Lokalizacja</SectionTitle>

        <Row>
          <Label>
            <LabelText>Miasto</LabelText>
            <LabelHint>Slug miasta w URL OLX / OtoMoto (np. gliwice, warszawa, krakow)</LabelHint>
          </Label>
          <InputWrap>
            <TextInput
              type="text"
              value={settings.locationCity}
              onChange={str('locationCity')}
              placeholder="gliwice"
            />
          </InputWrap>
        </Row>

        <Divider />

        <Row>
          <Label>
            <LabelText>Promień wyszukiwania</LabelText>
            <LabelHint>Zasięg wokół wybranego miasta</LabelHint>
          </Label>
          <InputWrap>
            <NumberInput
              type="number"
              min={0}
              max={300}
              step={5}
              value={settings.locationRadiusKm}
              onChange={num('locationRadiusKm')}
            />
            <Unit>km</Unit>
          </InputWrap>
        </Row>
      </Card>

      <Card>
        <SectionTitle>Cena</SectionTitle>

        <Row>
          <Label>
            <LabelText>Cena minimalna</LabelText>
            <LabelHint>Wpisz 0, aby nie ograniczać od dołu</LabelHint>
          </Label>
          <InputWrap>
            <NumberInput
              type="number"
              min={0}
              step={500}
              value={settings.priceMin}
              onChange={num('priceMin')}
            />
            <Unit>zł</Unit>
          </InputWrap>
        </Row>

        <Divider />

        <Row>
          <Label>
            <LabelText>Cena maksymalna</LabelText>
            <LabelHint>Górny limit ceny przy skanowaniu. Wpisz 0, aby nie ograniczać od góry</LabelHint>
          </Label>
          <InputWrap>
            <NumberInput
              type="number"
              min={0}
              step={500}
              value={settings.priceMax}
              onChange={num('priceMax')}
            />
            <Unit>zł</Unit>
          </InputWrap>
        </Row>
      </Card>

      <Card>
        <SectionTitle>Skanowanie</SectionTitle>

        <Row>
          <Label>
            <LabelText>Liczba wyszukiwanych ofert</LabelText>
            <LabelHint>Maksymalna liczba ogłoszeń pobieranych z OLX i OtoMoto przy każdym skanowaniu</LabelHint>
          </Label>
          <InputWrap>
            <NumberInput
              type="number"
              min={10}
              max={500}
              step={10}
              value={settings.listingsPerPortal}
              onChange={num('listingsPerPortal')}
            />
            <Unit>szt.</Unit>
          </InputWrap>
        </Row>

        <Divider />

        <Row>
          <Label>
            <LabelText>Próg handlarza</LabelText>
            <LabelHint>Sprzedawca z co najmniej N ogłoszeniami jest traktowany jako handlarz i pomijany w wynikach wyszukiwania</LabelHint>
          </Label>
          <InputWrap>
            <NumberInput
              type="number"
              min={1}
              max={20}
              value={settings.dealerListingThreshold}
              onChange={num('dealerListingThreshold')}
            />
            <Unit>ofert</Unit>
          </InputWrap>
        </Row>
      </Card>

      <Actions>
        <Btn onClick={save}>
          <Save size={15} />
          Zapisz
        </Btn>
        <Btn $variant="ghost" onClick={reset}>
          <RotateCcw size={15} />
          Resetuj do domyślnych
        </Btn>
        {saved && (
          <SavedBadge>
            <Check size={14} />
            Zapisano
          </SavedBadge>
        )}
      </Actions>
    </Wrap>
  );
}
