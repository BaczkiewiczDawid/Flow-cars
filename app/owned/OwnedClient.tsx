'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { Plus, Pencil, Trash2, X, Check, Receipt } from 'lucide-react';
import type { OwnedCar, CarCost } from '@/db/schema';

type OwnedCarRow = OwnedCar & { totalCosts: number };

// ─── styled ──────────────────────────────────────────────────────────────────

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
`;

const PageTitle = styled.h1`
  font-size: 22px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.ink};
  margin: 0;
`;

const AddBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 16px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.accent};
  color: #fff;
  font-size: 13.5px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  &:hover { background: ${({ theme }) => theme.colors.accentStrong}; }
`;

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

const Th = styled.th<{ $sortable?: boolean }>`
  padding: 11px 14px;
  text-align: left;
  font-size: 11.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.inkFaint};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  white-space: nowrap;
  cursor: ${({ $sortable }) => ($sortable ? 'pointer' : 'default')};
  user-select: ${({ $sortable }) => ($sortable ? 'none' : 'auto')};
  &:hover { color: ${({ $sortable, theme }) => $sortable ? theme.colors.ink : theme.colors.inkFaint}; }
`;

const FilterBar = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 14px;
`;

const FilterPill = styled.button<{ $active: boolean; $color?: string; $bg?: string }>`
  padding: 5px 12px;
  border-radius: ${({ theme }) => theme.radius.pill};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: 1.5px solid ${({ $active, $color, theme }) => $active && $color ? $color : $active ? theme.colors.accent : theme.colors.border};
  background: ${({ $active, $bg }) => $active && $bg ? $bg : $active ? 'rgba(23,104,209,0.1)' : 'transparent'};
  color: ${({ $active, $color, theme }) => $active && $color ? $color : $active ? theme.colors.accent : theme.colors.inkSoft};
  transition: all 120ms;
  &:hover { border-color: ${({ $color, theme }) => $color ?? theme.colors.accent}; }
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

const MonoCell = styled(Td)`
  font-family: ${({ theme }) => theme.font.mono};
`;

const MarginCell = styled(MonoCell)<{ $positive: boolean | null }>`
  color: ${({ $positive, theme }) =>
    $positive === null ? theme.colors.inkFaint :
    $positive ? theme.colors.success : '#ef4444'};
  font-weight: 600;
`;

const stickyRight = ({ theme }: { theme: any }) => `
  position: sticky;
  right: 0;
  background: ${theme.colors.surface};
  box-shadow: -4px 0 8px rgba(0,0,0,0.06);
`;

const ActionsCell = styled(Td)`
  text-align: right;
  padding-right: 10px;
  ${stickyRight}
  tr:hover & { background: ${({ theme }) => theme.colors.bgSoft}; }
`;

const ActionsTh = styled(Th)<{ theme?: any }>`
  ${stickyRight}
`;

const IconBtn = styled.button<{ $danger?: boolean; $accent?: boolean }>`
  padding: 5px 7px;
  border-radius: ${({ theme }) => theme.radius.sm};
  border: none;
  background: transparent;
  cursor: pointer;
  color: ${({ $danger, $accent, theme }) => $danger ? '#ef4444' : $accent ? theme.colors.accent : theme.colors.inkSoft};
  &:hover {
    background: ${({ $danger, $accent }) => $danger ? 'rgba(239,68,68,0.1)' : $accent ? 'rgba(23,104,209,0.1)' : 'rgba(0,0,0,0.06)'};
  }
`;

const Empty = styled.div`
  padding: 64px 24px;
  text-align: center;
  color: ${({ theme }) => theme.colors.inkSoft};
  font-size: 14px;
`;

// ─── modal ────────────────────────────────────────────────────────────────────

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

const Modal = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => theme.shadow.raised};
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`;

const ModalHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 0;
`;

const ModalTitle = styled.h2`
  font-size: 17px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.ink};
  margin: 0;
`;

const ModalBody = styled.div`
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const Grid2 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
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

const Input = styled.input`
  padding: 9px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.bgSoft};
  color: ${({ theme }) => theme.colors.ink};
  font-size: 14px;
  outline: none;
  &:focus { border-color: ${({ theme }) => theme.colors.accent}; }
`;

const Select = styled.select`
  padding: 9px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.bgSoft};
  color: ${({ theme }) => theme.colors.ink};
  font-size: 14px;
  outline: none;
  cursor: pointer;
  &:focus { border-color: ${({ theme }) => theme.colors.accent}; }
`;

const StatusGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
`;

const StatusOption = styled.button<{ $active: boolean; $color: string; $bg: string }>`
  padding: 7px 10px;
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 120ms;
  border: 1.5px solid ${({ $active, $color, theme }) => $active ? $color : theme.colors.border};
  background: ${({ $active, $bg }) => $active ? $bg : 'transparent'};
  color: ${({ $active, $color, theme }) => $active ? $color : theme.colors.inkSoft};
  &:hover {
    border-color: ${({ $color }) => $color};
    color: ${({ $color }) => $color};
  }
`;

const Textarea = styled.textarea`
  padding: 9px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.bgSoft};
  color: ${({ theme }) => theme.colors.ink};
  font-size: 14px;
  outline: none;
  resize: vertical;
  min-height: 72px;
  font-family: inherit;
  &:focus { border-color: ${({ theme }) => theme.colors.accent}; }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 10px;
  padding: 0 24px 20px;
  justify-content: flex-end;
`;

const SaveBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.accent};
  color: #fff;
  font-size: 13.5px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  &:hover { background: ${({ theme }) => theme.colors.accentStrong}; }
  &:disabled { opacity: 0.6; cursor: default; }
`;

const CancelBtn = styled.button`
  padding: 9px 16px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: transparent;
  color: ${({ theme }) => theme.colors.inkSoft};
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  &:hover { background: ${({ theme }) => theme.colors.bgSoft}; }
`;

// ─── costs modal styled ───────────────────────────────────────────────────────

const CostList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 260px;
  overflow-y: auto;
`;

const CostItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.bgSoft};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const CostDesc = styled.span`
  flex: 1;
  font-size: 13.5px;
  color: ${({ theme }) => theme.colors.ink};
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CostMeta = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.inkSoft};
  white-space: nowrap;
`;

const CostAmount = styled.span`
  font-family: ${({ theme }) => theme.font.mono};
  font-size: 13.5px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.ink};
  white-space: nowrap;
`;

const CostTotal = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 10px 0;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 13.5px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.ink};
  font-family: ${({ theme }) => theme.font.mono};
`;

const Divider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.border};
  margin: 4px 0;
`;

const EmptyCosts = styled.div`
  padding: 20px;
  text-align: center;
  font-size: 13.5px;
  color: ${({ theme }) => theme.colors.inkSoft};
`;

// ─── status ──────────────────────────────────────────────────────────────────

type CarStatus = 'zakupiony' | 'w_transporcie' | 'na_placu' | 'w_przygotowaniu' | 'wystawiony' | 'sprzedany';

const STATUS_OPTIONS: { value: CarStatus; label: string; color: string; bg: string }[] = [
  { value: 'zakupiony',       label: 'Zakupiony',          color: '#1768D1', bg: 'rgba(23,104,209,0.12)' },
  { value: 'w_transporcie',   label: 'W transporcie',      color: '#B45309', bg: 'rgba(180,83,9,0.12)'   },
  { value: 'na_placu',        label: 'Na placu',           color: '#7C3AED', bg: 'rgba(124,58,237,0.12)' },
  { value: 'w_przygotowaniu', label: 'W przygotowaniu',    color: '#0F766E', bg: 'rgba(15,118,110,0.12)' },
  { value: 'wystawiony',      label: 'Wystawiony',         color: '#15803D', bg: 'rgba(21,128,61,0.12)'  },
  { value: 'sprzedany',       label: 'Sprzedany',          color: '#6B7280', bg: 'rgba(107,114,128,0.12)'},
];

const STATUS_MAP = Object.fromEntries(STATUS_OPTIONS.map((s) => [s.value, s])) as Record<CarStatus, typeof STATUS_OPTIONS[0]>;

const StatusBadge = styled.span<{ $color: string; $bg: string }>`
  display: inline-block;
  padding: 3px 9px;
  border-radius: ${({ theme }) => theme.radius.pill};
  font-size: 11.5px;
  font-weight: 600;
  color: ${({ $color }) => $color};
  background: ${({ $bg }) => $bg};
  white-space: nowrap;
`;

// ─── form state ──────────────────────────────────────────────────────────────

interface FormState {
  brand: string; model: string; year: string; mileage: string;
  driveType: string; engineCapacity: string; enginePower: string;
  fuelType: string; purchasePrice: string; listingPrice: string; salePrice: string;
  purchaseDate: string; soldAt: string;
  status: CarStatus; isImported: boolean; notes: string;
}

const EMPTY_FORM: FormState = {
  brand: '', model: '', year: '', mileage: '',
  driveType: '', engineCapacity: '', enginePower: '',
  fuelType: '', purchasePrice: '', listingPrice: '', salePrice: '',
  purchaseDate: '', soldAt: '',
  status: 'zakupiony', isImported: false, notes: '',
};

function carToForm(car: OwnedCar): FormState {
  return {
    brand: car.brand, model: car.model, year: String(car.year), mileage: String(car.mileage),
    driveType: car.driveType ?? '', engineCapacity: car.engineCapacity ? String(car.engineCapacity) : '',
    enginePower: car.enginePower ? String(car.enginePower) : '', fuelType: car.fuelType ?? '',
    purchasePrice: String(car.purchasePrice), listingPrice: car.listingPrice ? String(car.listingPrice) : '',
    salePrice: car.salePrice ? String(car.salePrice) : '',
    purchaseDate: toDateInput(car.purchaseDate), soldAt: toDateInput(car.soldAt),
    status: (car.status as CarStatus) ?? 'zakupiony', isImported: car.isImported ?? false, notes: car.notes ?? '',
  };
}

function formToPayload(f: FormState) {
  return {
    brand: f.brand.trim(), model: f.model.trim(), year: Number(f.year), mileage: Number(f.mileage),
    driveType: f.driveType || null, engineCapacity: f.engineCapacity ? Number(f.engineCapacity) : null,
    enginePower: f.enginePower ? Number(f.enginePower) : null, fuelType: f.fuelType || null,
    purchasePrice: Number(f.purchasePrice), listingPrice: f.listingPrice ? Number(f.listingPrice) : null,
    salePrice: f.status === 'sprzedany' && f.salePrice ? Number(f.salePrice) : null,
    purchaseDate: f.purchaseDate || null,
    soldAt: f.status === 'sprzedany' && f.soldAt ? f.soldAt : null,
    status: f.status, isImported: f.isImported, notes: f.notes.trim() || null,
  };
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) { return n.toLocaleString('pl-PL') + ' zł'; }
function toDateInput(d: Date | string | null | undefined): string {
  if (!d) return '';
  return new Date(d).toISOString().slice(0, 10);
}
function engineLabel(cap?: number | null, power?: number | null) {
  const parts = [];
  if (cap) parts.push(`${(cap / 1000).toFixed(1)}L`);
  if (power) parts.push(`${power} KM`);
  return parts.join(' / ') || '—';
}

// ─── main ────────────────────────────────────────────────────────────────────

type SortCol = 'brand' | 'year' | 'mileage' | 'purchasePrice' | 'listingPrice' | 'margin';

interface CostForm { description: string; amount: string; date: string; }
const EMPTY_COST_FORM: CostForm = { description: '', amount: '', date: '' };

export function OwnedClient({ initialRows }: { initialRows: OwnedCarRow[] }) {
  const [rows, setRows] = useState<OwnedCarRow[]>(initialRows);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<OwnedCar | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState<CarStatus | null>(null);
  const [sort, setSort] = useState<{ col: SortCol; dir: 'asc' | 'desc' }>({ col: 'brand', dir: 'asc' });

  // costs modal state
  const [costsModal, setCostsModal] = useState<{ car: OwnedCarRow; costs: CarCost[] } | null>(null);
  const [costForm, setCostForm] = useState<CostForm>(EMPTY_COST_FORM);
  const [costSaving, setCostSaving] = useState(false);

  function toggleSort(col: SortCol) {
    setSort((s) => s.col === col ? { col, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'asc' });
  }

  const visible = rows
    .filter((c) => filterStatus === null || c.status === filterStatus)
    .sort((a, b) => {
      const dir = sort.dir === 'asc' ? 1 : -1;
      if (sort.col === 'brand') return dir * (`${a.brand} ${a.model}`).localeCompare(`${b.brand} ${b.model}`);
      if (sort.col === 'year') return dir * (a.year - b.year);
      if (sort.col === 'mileage') return dir * (a.mileage - b.mileage);
      if (sort.col === 'purchasePrice') return dir * (a.purchasePrice - b.purchasePrice);
      if (sort.col === 'listingPrice') return dir * ((a.listingPrice ?? -1) - (b.listingPrice ?? -1));
      if (sort.col === 'margin') {
        const ea = a.salePrice ?? a.listingPrice;
        const eb = b.salePrice ?? b.listingPrice;
        const ma = ea != null ? ea - a.purchasePrice - a.totalCosts : -Infinity;
        const mb = eb != null ? eb - b.purchasePrice - b.totalCosts : -Infinity;
        return dir * (ma - mb);
      }
      return 0;
    });

  function sortInd(col: SortCol) {
    if (sort.col !== col) return ' ↕';
    return sort.dir === 'asc' ? ' ↑' : ' ↓';
  }

  function openAdd() { setEditing(null); setForm(EMPTY_FORM); setModalOpen(true); }
  function openEdit(car: OwnedCar) { setEditing(car); setForm(carToForm(car)); setModalOpen(true); }
  function close() { setModalOpen(false); }
  function set(key: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function save() {
    if (!form.brand || !form.model || !form.purchasePrice) return;
    setSaving(true);
    try {
      const payload = formToPayload(form);
      if (editing) {
        const res = await fetch(`/api/owned/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const updated: OwnedCar = await res.json();
        setRows((r) => r.map((c) => (c.id === updated.id ? { ...updated, totalCosts: c.totalCosts } : c)));
      } else {
        const res = await fetch('/api/owned', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const created: OwnedCar = await res.json();
        setRows((r) => [{ ...created, totalCosts: 0 }, ...r]);
      }
      close();
    } finally { setSaving(false); }
  }

  async function remove(id: number) {
    if (!confirm('Usunąć ten wpis?')) return;
    await fetch(`/api/owned/${id}`, { method: 'DELETE' });
    setRows((r) => r.filter((c) => c.id !== id));
  }

  // ─── costs ───────────────────────────────────────────────────────────────

  async function openCosts(car: OwnedCarRow) {
    const res = await fetch(`/api/owned/${car.id}/costs`);
    const costs: CarCost[] = await res.json();
    setCostsModal({ car, costs });
    setCostForm(EMPTY_COST_FORM);
  }

  function closeCosts() { setCostsModal(null); }

  async function addCost() {
    if (!costForm.description.trim() || !costForm.amount || !costsModal) return;
    setCostSaving(true);
    try {
      const res = await fetch(`/api/owned/${costsModal.car.id}/costs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: costForm.description.trim(), amount: Number(costForm.amount), date: costForm.date || null }),
      });
      const newCost: CarCost = await res.json();
      const updatedCosts = [newCost, ...costsModal.costs];
      const totalCosts = updatedCosts.reduce((s, c) => s + c.amount, 0);
      setCostsModal((m) => m ? { ...m, costs: updatedCosts } : null);
      setRows((r) => r.map((row) => row.id === costsModal.car.id ? { ...row, totalCosts } : row));
      setCostForm(EMPTY_COST_FORM);
    } finally { setCostSaving(false); }
  }

  async function deleteCost(costId: number) {
    if (!costsModal) return;
    await fetch(`/api/owned/${costsModal.car.id}/costs/${costId}`, { method: 'DELETE' });
    const updatedCosts = costsModal.costs.filter((c) => c.id !== costId);
    const totalCosts = updatedCosts.reduce((s, c) => s + c.amount, 0);
    setCostsModal((m) => m ? { ...m, costs: updatedCosts } : null);
    setRows((r) => r.map((row) => row.id === costsModal.car.id ? { ...row, totalCosts } : row));
  }

  // ─── render ──────────────────────────────────────────────────────────────

  return (
    <>
      <Header>
        <PageTitle>Posiadane samochody</PageTitle>
        <AddBtn onClick={openAdd}><Plus size={15} /> Dodaj samochód</AddBtn>
      </Header>

      <FilterBar>
        <FilterPill $active={filterStatus === null} onClick={() => setFilterStatus(null)}>
          Wszystkie ({rows.length})
        </FilterPill>
        {STATUS_OPTIONS.map((opt) => {
          const count = rows.filter((c) => c.status === opt.value).length;
          if (count === 0) return null;
          return (
            <FilterPill key={opt.value} $active={filterStatus === opt.value} $color={opt.color} $bg={opt.bg}
              onClick={() => setFilterStatus(filterStatus === opt.value ? null : opt.value)}>
              {opt.label} ({count})
            </FilterPill>
          );
        })}
      </FilterBar>

      <TableWrap>
        {visible.length === 0 ? (
          <Empty>{rows.length === 0 ? 'Brak wpisów. Dodaj swój pierwszy samochód.' : 'Brak wyników dla wybranego filtra.'}</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th $sortable onClick={() => toggleSort('brand')}>Marka / Model{sortInd('brand')}</Th>
                <Th>Status</Th>
                <Th $sortable onClick={() => toggleSort('year')}>Rocznik{sortInd('year')}</Th>
                <Th $sortable onClick={() => toggleSort('mileage')}>Przebieg{sortInd('mileage')}</Th>
                <Th>Import</Th>
                <Th>Napęd</Th>
                <Th>Silnik</Th>
                <Th $sortable onClick={() => toggleSort('purchasePrice')}>Cena zakupu{sortInd('purchasePrice')}</Th>
                <Th>Koszty</Th>
                <Th $sortable onClick={() => toggleSort('listingPrice')}>Cena wystawienia{sortInd('listingPrice')}</Th>
                <Th>Cena sprzedaży</Th>
                <Th $sortable onClick={() => toggleSort('margin')}>Marża{sortInd('margin')}</Th>
                <ActionsTh />
              </tr>
            </thead>
            <tbody>
              {visible.map((car) => {
                const effectivePrice = car.salePrice ?? car.listingPrice;
                const margin = effectivePrice != null ? effectivePrice - car.purchasePrice - car.totalCosts : null;
                return (
                  <Tr key={car.id}>
                    <Td><strong>{car.brand}</strong> {car.model}</Td>
                    <Td>
                      {(() => {
                        const s = STATUS_MAP[car.status as CarStatus] ?? STATUS_MAP['zakupiony'];
                        return <StatusBadge $color={s.color} $bg={s.bg}>{s.label}</StatusBadge>;
                      })()}
                    </Td>
                    <Td>{car.year}</Td>
                    <MonoCell>{car.mileage.toLocaleString('pl-PL')} km</MonoCell>
                    <Td>
                      {car.isImported
                        ? <StatusBadge $color="#0F766E" $bg="rgba(15,118,110,0.12)">Tak</StatusBadge>
                        : <span style={{ color: 'var(--ink-faint, #aaa)', fontSize: 13 }}>—</span>}
                    </Td>
                    <Td>{car.driveType ?? '—'}</Td>
                    <Td>{engineLabel(car.engineCapacity, car.enginePower)}{car.fuelType ? ` · ${car.fuelType}` : ''}</Td>
                    <MonoCell>{fmt(car.purchasePrice)}</MonoCell>
                    <MonoCell style={{ color: car.totalCosts > 0 ? '#ef4444' : undefined }}>
                      {car.totalCosts > 0 ? `−${fmt(car.totalCosts)}` : '—'}
                    </MonoCell>
                    <MonoCell>{car.listingPrice != null ? fmt(car.listingPrice) : '—'}</MonoCell>
                    <MonoCell>{car.salePrice != null ? fmt(car.salePrice) : '—'}</MonoCell>
                    <MarginCell $positive={margin === null ? null : margin >= 0}>
                      {margin === null ? '—' : (margin >= 0 ? '+' : '') + fmt(margin)}
                    </MarginCell>
                    <ActionsCell>
                      <IconBtn $accent onClick={() => openCosts(car)} title="Koszty">
                        <Receipt size={14} />
                      </IconBtn>
                      <IconBtn onClick={() => openEdit(car)} title="Edytuj">
                        <Pencil size={14} />
                      </IconBtn>
                      <IconBtn $danger onClick={() => remove(car.id)} title="Usuń">
                        <Trash2 size={14} />
                      </IconBtn>
                    </ActionsCell>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </TableWrap>

      {/* ─── edit / add modal ─────────────────────────────────────────────── */}
      {modalOpen && (
        <Backdrop onClick={close}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHead>
              <ModalTitle>{editing ? 'Edytuj samochód' : 'Dodaj samochód'}</ModalTitle>
              <IconBtn onClick={close}><X size={18} /></IconBtn>
            </ModalHead>
            <ModalBody>
              <Grid2>
                <FieldGroup>
                  <Label>Marka *</Label>
                  <Input placeholder="np. Volkswagen" value={form.brand} onChange={set('brand')} />
                </FieldGroup>
                <FieldGroup>
                  <Label>Model *</Label>
                  <Input placeholder="np. Golf" value={form.model} onChange={set('model')} />
                </FieldGroup>
                <FieldGroup>
                  <Label>Rocznik *</Label>
                  <Input type="number" placeholder="np. 2015" value={form.year} onChange={set('year')} />
                </FieldGroup>
                <FieldGroup>
                  <Label>Przebieg (km) *</Label>
                  <Input type="number" placeholder="np. 120000" value={form.mileage} onChange={set('mileage')} />
                </FieldGroup>
                <FieldGroup>
                  <Label>Rodzaj napędu</Label>
                  <Select value={form.driveType} onChange={set('driveType')}>
                    <option value="">— wybierz —</option>
                    <option value="FWD">FWD (przód)</option>
                    <option value="RWD">RWD (tył)</option>
                    <option value="AWD">AWD (4x4 stały)</option>
                    <option value="4x4">4x4 (dołączany)</option>
                  </Select>
                </FieldGroup>
                <FieldGroup>
                  <Label>Rodzaj paliwa</Label>
                  <Select value={form.fuelType} onChange={set('fuelType')}>
                    <option value="">— wybierz —</option>
                    <option value="benzyna">Benzyna</option>
                    <option value="diesel">Diesel</option>
                    <option value="hybryda">Hybryda</option>
                    <option value="LPG">LPG</option>
                    <option value="elektryczny">Elektryczny</option>
                  </Select>
                </FieldGroup>
                <FieldGroup>
                  <Label>Pojemność silnika (cm³)</Label>
                  <Input type="number" placeholder="np. 1968" value={form.engineCapacity} onChange={set('engineCapacity')} />
                </FieldGroup>
                <FieldGroup>
                  <Label>Moc (KM)</Label>
                  <Input type="number" placeholder="np. 150" value={form.enginePower} onChange={set('enginePower')} />
                </FieldGroup>
                <FieldGroup style={{ gridColumn: '1 / -1' }}>
                  <Label>Importowany</Label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[{ val: false, label: 'Nie' }, { val: true, label: 'Tak' }].map(({ val, label }) => (
                      <StatusOption key={label} type="button"
                        $active={form.isImported === val}
                        $color={val ? '#0F766E' : '#6B7280'}
                        $bg={val ? 'rgba(15,118,110,0.12)' : 'rgba(107,114,128,0.12)'}
                        onClick={() => setForm((f) => ({ ...f, isImported: val }))}>
                        {label}
                      </StatusOption>
                    ))}
                  </div>
                </FieldGroup>
                <FieldGroup>
                  <Label>Cena zakupu (zł) *</Label>
                  <Input type="number" placeholder="np. 18000" value={form.purchasePrice} onChange={set('purchasePrice')} />
                </FieldGroup>
                <FieldGroup>
                  <Label>Cena wystawienia (zł)</Label>
                  <Input type="number" placeholder="np. 22000" value={form.listingPrice} onChange={set('listingPrice')} />
                </FieldGroup>
              </Grid2>
              <FieldGroup>
                <Label>Stan pojazdu *</Label>
                <StatusGrid>
                  {STATUS_OPTIONS.map((opt) => (
                    <StatusOption key={opt.value} $active={form.status === opt.value}
                      $color={opt.color} $bg={opt.bg}
                      onClick={() => setForm((f) => ({ ...f, status: opt.value }))} type="button">
                      {opt.label}
                    </StatusOption>
                  ))}
                </StatusGrid>
              </FieldGroup>
              {form.status === 'sprzedany' && (
                <FieldGroup>
                  <Label>Cena sprzedaży (zł)</Label>
                  <Input type="number" placeholder="np. 23000" value={form.salePrice} onChange={set('salePrice')} />
                </FieldGroup>
              )}
              <Grid2>
                <FieldGroup>
                  <Label>Data zakupu</Label>
                  <Input type="date" value={form.purchaseDate} onChange={set('purchaseDate')} />
                </FieldGroup>
                {form.status === 'sprzedany' && (
                  <FieldGroup>
                    <Label>Data sprzedaży</Label>
                    <Input type="date" value={form.soldAt} onChange={set('soldAt')} />
                  </FieldGroup>
                )}
              </Grid2>
              <FieldGroup>
                <Label>Notatki</Label>
                <Textarea placeholder="Opcjonalne uwagi..." value={form.notes} onChange={set('notes')} />
              </FieldGroup>
            </ModalBody>
            <ModalActions>
              <CancelBtn onClick={close}>Anuluj</CancelBtn>
              <SaveBtn onClick={save} disabled={saving || !form.brand || !form.model || !form.purchasePrice}>
                <Check size={14} />
                {saving ? 'Zapisuję…' : 'Zapisz'}
              </SaveBtn>
            </ModalActions>
          </Modal>
        </Backdrop>
      )}

      {/* ─── costs modal ──────────────────────────────────────────────────── */}
      {costsModal && (
        <Backdrop onClick={closeCosts}>
          <Modal onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <ModalHead>
              <ModalTitle>
                <Receipt size={15} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
                Koszty — {costsModal.car.brand} {costsModal.car.model}
              </ModalTitle>
              <IconBtn onClick={closeCosts}><X size={18} /></IconBtn>
            </ModalHead>

            <ModalBody>
              {/* list */}
              {costsModal.costs.length === 0 ? (
                <EmptyCosts>Brak kosztów. Dodaj pierwszy wpis poniżej.</EmptyCosts>
              ) : (
                <>
                  <CostList>
                    {costsModal.costs.map((c) => (
                      <CostItem key={c.id}>
                        <CostDesc title={c.description}>{c.description}</CostDesc>
                        {c.date && (
                          <CostMeta>{new Date(c.date).toLocaleDateString('pl-PL')}</CostMeta>
                        )}
                        <CostAmount>−{fmt(c.amount)}</CostAmount>
                        <IconBtn $danger onClick={() => deleteCost(c.id)} title="Usuń"><Trash2 size={13} /></IconBtn>
                      </CostItem>
                    ))}
                  </CostList>
                  <CostTotal>
                    <span>Łączne koszty</span>
                    <span>−{fmt(costsModal.costs.reduce((s, c) => s + c.amount, 0))}</span>
                  </CostTotal>
                </>
              )}

              <Divider />

              {/* add form */}
              <Label>Dodaj koszt</Label>
              <FieldGroup>
                <Label>Opis *</Label>
                <Input
                  placeholder="np. Transport z Niemiec"
                  value={costForm.description}
                  onChange={(e) => setCostForm((f) => ({ ...f, description: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === 'Enter') addCost(); }}
                />
              </FieldGroup>
              <Grid2>
                <FieldGroup>
                  <Label>Kwota (zł) *</Label>
                  <Input
                    type="number"
                    placeholder="np. 800"
                    value={costForm.amount}
                    onChange={(e) => setCostForm((f) => ({ ...f, amount: e.target.value }))}
                  />
                </FieldGroup>
                <FieldGroup>
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={costForm.date}
                    onChange={(e) => setCostForm((f) => ({ ...f, date: e.target.value }))}
                  />
                </FieldGroup>
              </Grid2>
            </ModalBody>

            <ModalActions>
              <CancelBtn onClick={closeCosts}>Zamknij</CancelBtn>
              <SaveBtn
                onClick={addCost}
                disabled={costSaving || !costForm.description.trim() || !costForm.amount}
              >
                <Plus size={14} />
                {costSaving ? 'Dodaję…' : 'Dodaj koszt'}
              </SaveBtn>
            </ModalActions>
          </Modal>
        </Backdrop>
      )}
    </>
  );
}
