'use client';

import { useMemo, useState } from 'react';
import styled from 'styled-components';
import type { OwnedCar } from '@/db/schema';

// ─── types ───────────────────────────────────────────────────────────────────

type Period = 'month' | 'quarter' | 'year' | 'custom';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'month',   label: 'Miesiąc'  },
  { value: 'quarter', label: 'Kwartał'  },
  { value: 'year',    label: 'Rok'      },
  { value: 'custom',  label: 'Własny'   },
];

// ─── helpers ─────────────────────────────────────────────────────────────────

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function startOfQuarter(d: Date) { return new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1); }
function startOfYear(d: Date) { return new Date(d.getFullYear(), 0, 1); }
function daysBetween(a: Date, b: Date) { return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86_400_000)); }
function fmt(n: number) { return n.toLocaleString('pl-PL') + ' zł'; }
function fmtDate(d: Date) { return d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' }); }

// ─── styled ──────────────────────────────────────────────────────────────────

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 24px;
`;

const PageTitle = styled.h1`
  font-size: 22px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.ink};
  margin: 0;
`;

const PeriodBar = styled.div`
  display: flex;
  gap: 4px;
  background: ${({ theme }) => theme.colors.bgSoft};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: 3px;
`;

const PeriodBtn = styled.button<{ $active: boolean }>`
  padding: 6px 14px;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 120ms;
  background: ${({ $active, theme }) => $active ? theme.colors.surface : 'transparent'};
  color: ${({ $active, theme }) => $active ? theme.colors.ink : theme.colors.inkSoft};
  box-shadow: ${({ $active }) => $active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'};
`;

const CustomDateRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
  font-size: 13.5px;
  color: ${({ theme }) => theme.colors.inkSoft};
`;

const DateInput = styled.input`
  padding: 7px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.ink};
  font-size: 13.5px;
  outline: none;
  &:focus { border-color: ${({ theme }) => theme.colors.accent}; }
`;

const SectionLabel = styled.div`
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.inkFaint};
  margin-bottom: 12px;
  margin-top: 28px;
  &:first-of-type { margin-top: 0; }
`;

const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
`;

const Card = styled.div<{ $accent?: string }>`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 20px 22px;
  box-shadow: ${({ theme }) => theme.shadow.card};
  border-left: 3px solid ${({ $accent }) => $accent ?? 'transparent'};
`;

const CardLabel = styled.div`
  font-size: 11.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.inkFaint};
  margin-bottom: 10px;
`;

const CardValue = styled.div`
  font-size: 26px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.ink};
  line-height: 1;
  font-family: ${({ theme }) => theme.font.display};
`;

const CardSub = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.inkSoft};
  margin-top: 6px;
`;

// table

const TableWrap = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  overflow: auto;
  box-shadow: ${({ theme }) => theme.shadow.card};
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
`;

const Th = styled.th`
  padding: 11px 14px;
  text-align: left;
  font-size: 11.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.inkFaint};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  white-space: nowrap;
`;

const Td = styled.td`
  padding: 12px 14px;
  color: ${({ theme }) => theme.colors.ink};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  white-space: nowrap;
`;

const Tr = styled.tr`
  &:last-child td { border-bottom: none; }
  &:hover td { background: ${({ theme }) => theme.colors.bgSoft}; }
`;

const MonoTd = styled(Td)`
  font-family: ${({ theme }) => theme.font.mono};
`;

const MarginTd = styled(MonoTd)<{ $pos: boolean }>`
  color: ${({ $pos, theme }) => $pos ? theme.colors.success : '#ef4444'};
  font-weight: 600;
`;

const Empty = styled.div`
  padding: 48px 24px;
  text-align: center;
  color: ${({ theme }) => theme.colors.inkSoft};
  font-size: 14px;
`;

// ─── main ────────────────────────────────────────────────────────────────────

export function StatsClient({ rows }: { rows: OwnedCar[] }) {
  const [period, setPeriod] = useState<Period>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const now = new Date();

  const [rangeFrom, rangeTo] = useMemo((): [Date, Date] => {
    if (period === 'month')   return [startOfMonth(now), now];
    if (period === 'quarter') return [startOfQuarter(now), now];
    if (period === 'year')    return [startOfYear(now), now];
    if (customFrom && customTo) return [new Date(customFrom), new Date(customTo + 'T23:59:59')];
    return [startOfMonth(now), now];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, customFrom, customTo]);

  const soldInPeriod = useMemo(() =>
    rows.filter((c) => {
      if (c.status !== 'sprzedany' || !c.soldAt) return false;
      const d = new Date(c.soldAt);
      return d >= rangeFrom && d <= rangeTo;
    }),
  [rows, rangeFrom, rangeTo]);

  const { count, obrot, marza, avgDays } = useMemo(() => {
    const count = soldInPeriod.length;
    const obrot = soldInPeriod.reduce((s, c) => s + (c.salePrice ?? c.listingPrice ?? c.purchasePrice), 0);
    const marza = soldInPeriod.reduce((s, c) => s + ((c.salePrice ?? c.listingPrice ?? c.purchasePrice) - c.purchasePrice), 0);
    const withTime = soldInPeriod.filter((c) => c.soldAt && (c.purchaseDate || c.createdAt));
    const avgDays = withTime.length
      ? Math.round(withTime.reduce((s, c) => s + daysBetween(new Date(c.purchaseDate ?? c.createdAt), new Date(c.soldAt!)), 0) / withTime.length)
      : null;
    return { count, obrot, marza, avgDays };
  }, [soldInPeriod]);

  const { naPlaycu, wPrzygotowaniu, wystawione, lacznie } = useMemo(() => ({
    naPlaycu:       rows.filter((c) => c.status === 'na_placu').length,
    wPrzygotowaniu: rows.filter((c) => c.status === 'w_przygotowaniu').length,
    wystawione:     rows.filter((c) => c.status === 'wystawiony').length,
    lacznie:        rows.filter((c) => c.status !== 'sprzedany').length,
  }), [rows]);

  const periodLabel = period === 'month' ? 'bieżący miesiąc'
    : period === 'quarter' ? 'bieżący kwartał'
    : period === 'year' ? 'bieżący rok'
    : customFrom && customTo ? `${customFrom} – ${customTo}` : 'własny okres';

  return (
    <>
      <Header>
        <PageTitle>Statystyki sprzedaży</PageTitle>
        <PeriodBar>
          {PERIODS.map((p) => (
            <PeriodBtn key={p.value} $active={period === p.value} onClick={() => setPeriod(p.value)}>
              {p.label}
            </PeriodBtn>
          ))}
        </PeriodBar>
      </Header>

      {period === 'custom' && (
        <CustomDateRow>
          Od
          <DateInput type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
          do
          <DateInput type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
        </CustomDateRow>
      )}

      <SectionLabel>Sprzedaż — {periodLabel}</SectionLabel>
      <CardsGrid>
        <Card $accent="#1768D1">
          <CardLabel>Sprzedane auta</CardLabel>
          <CardValue>{count}</CardValue>
          <CardSub>{count === 1 ? 'pojazd' : count < 5 ? 'pojazdy' : 'pojazdów'}</CardSub>
        </Card>
        <Card $accent="#15803D">
          <CardLabel>Obrót</CardLabel>
          <CardValue>{count > 0 ? fmt(obrot) : '—'}</CardValue>
          <CardSub>suma cen sprzedaży</CardSub>
        </Card>
        <Card $accent={marza >= 0 ? '#15803D' : '#ef4444'}>
          <CardLabel>Marża</CardLabel>
          <CardValue style={{ color: count > 0 ? (marza >= 0 ? '#15803D' : '#ef4444') : undefined }}>
            {count > 0 ? (marza >= 0 ? '+' : '') + fmt(marza) : '—'}
          </CardValue>
          <CardSub>zysk ze sprzedaży</CardSub>
        </Card>
        <Card $accent="#7C3AED">
          <CardLabel>Śr. czas sprzedaży</CardLabel>
          <CardValue>{avgDays !== null ? avgDays : '—'}</CardValue>
          <CardSub>{avgDays !== null ? 'dni od zakupu' : 'brak danych'}</CardSub>
        </Card>
      </CardsGrid>

      <SectionLabel>Aktualny stan magazynu</SectionLabel>
      <CardsGrid>
        <Card $accent="#7C3AED">
          <CardLabel>Na placu</CardLabel>
          <CardValue>{naPlaycu}</CardValue>
          <CardSub>oczekują na przygotowanie</CardSub>
        </Card>
        <Card $accent="#0F766E">
          <CardLabel>W przygotowaniu</CardLabel>
          <CardValue>{wPrzygotowaniu}</CardValue>
          <CardSub>w trakcie prac</CardSub>
        </Card>
        <Card $accent="#15803D">
          <CardLabel>Wystawione</CardLabel>
          <CardValue>{wystawione}</CardValue>
          <CardSub>aktywne ogłoszenia</CardSub>
        </Card>
        <Card>
          <CardLabel>Łącznie w obrocie</CardLabel>
          <CardValue>{lacznie}</CardValue>
          <CardSub>wszystkie niesprzedane</CardSub>
        </Card>
      </CardsGrid>

      <SectionLabel>Sprzedane w okresie</SectionLabel>
      <TableWrap>
        {soldInPeriod.length === 0 ? (
          <Empty>Brak sprzedanych aut w wybranym okresie.</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Marka / Model</Th>
                <Th>Rocznik</Th>
                <Th>Cena zakupu</Th>
                <Th>Cena sprzedaży</Th>
                <Th>Marża</Th>
                <Th>Czas sprzedaży</Th>
                <Th>Data sprzedaży</Th>
              </tr>
            </thead>
            <tbody>
              {soldInPeriod.map((car) => {
                const margin = (car.salePrice ?? car.listingPrice ?? car.purchasePrice) - car.purchasePrice;
                const days = car.soldAt ? daysBetween(new Date(car.purchaseDate ?? car.createdAt), new Date(car.soldAt)) : null;
                return (
                  <Tr key={car.id}>
                    <Td><strong>{car.brand}</strong> {car.model}</Td>
                    <Td>{car.year}</Td>
                    <MonoTd>{fmt(car.purchasePrice)}</MonoTd>
                    <MonoTd>{car.salePrice ? fmt(car.salePrice) : car.listingPrice ? fmt(car.listingPrice) : '—'}</MonoTd>
                    <MarginTd $pos={margin >= 0}>{(margin >= 0 ? '+' : '') + fmt(margin)}</MarginTd>
                    <Td>{days !== null ? `${days} dni` : '—'}</Td>
                    <Td>{car.soldAt ? fmtDate(new Date(car.soldAt)) : '—'}</Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </TableWrap>
    </>
  );
}
