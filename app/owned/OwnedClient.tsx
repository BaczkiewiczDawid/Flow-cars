'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import type { OwnedCar } from '@/db/schema';

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

const MonoCell = styled(Td)`
  font-family: ${({ theme }) => theme.font.mono};
`;

const MarginCell = styled(MonoCell)<{ $positive: boolean | null }>`
  color: ${({ $positive, theme }) =>
    $positive === null ? theme.colors.inkFaint :
    $positive ? theme.colors.success : '#ef4444'};
  font-weight: 600;
`;

const ActionsCell = styled(Td)`
  text-align: right;
  padding-right: 10px;
`;

const IconBtn = styled.button<{ $danger?: boolean }>`
  padding: 5px 7px;
  border-radius: ${({ theme }) => theme.radius.sm};
  border: none;
  background: transparent;
  cursor: pointer;
  color: ${({ $danger, theme }) => $danger ? '#ef4444' : theme.colors.inkSoft};
  &:hover {
    background: ${({ $danger }) => $danger ? 'rgba(239,68,68,0.1)' : 'rgba(0,0,0,0.06)'};
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
  brand: string;
  model: string;
  year: string;
  mileage: string;
  driveType: string;
  engineCapacity: string;
  enginePower: string;
  fuelType: string;
  purchasePrice: string;
  listingPrice: string;
  status: CarStatus;
  notes: string;
}

const EMPTY_FORM: FormState = {
  brand: '', model: '', year: '', mileage: '',
  driveType: '', engineCapacity: '', enginePower: '',
  fuelType: '', purchasePrice: '', listingPrice: '',
  status: 'zakupiony', notes: '',
};

function carToForm(car: OwnedCar): FormState {
  return {
    brand: car.brand,
    model: car.model,
    year: String(car.year),
    mileage: String(car.mileage),
    driveType: car.driveType ?? '',
    engineCapacity: car.engineCapacity ? String(car.engineCapacity) : '',
    enginePower: car.enginePower ? String(car.enginePower) : '',
    fuelType: car.fuelType ?? '',
    purchasePrice: String(car.purchasePrice),
    listingPrice: car.listingPrice ? String(car.listingPrice) : '',
    status: (car.status as CarStatus) ?? 'zakupiony',
    notes: car.notes ?? '',
  };
}

function formToPayload(f: FormState) {
  return {
    brand: f.brand.trim(),
    model: f.model.trim(),
    year: Number(f.year),
    mileage: Number(f.mileage),
    driveType: f.driveType || null,
    engineCapacity: f.engineCapacity ? Number(f.engineCapacity) : null,
    enginePower: f.enginePower ? Number(f.enginePower) : null,
    fuelType: f.fuelType || null,
    purchasePrice: Number(f.purchasePrice),
    listingPrice: f.listingPrice ? Number(f.listingPrice) : null,
    status: f.status,
    notes: f.notes.trim() || null,
  };
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) { return n.toLocaleString('pl-PL') + ' zł'; }

function engineLabel(cap?: number | null, power?: number | null) {
  const parts = [];
  if (cap) parts.push(`${(cap / 1000).toFixed(1)}L`);
  if (power) parts.push(`${power} KM`);
  return parts.join(' / ') || '—';
}

// ─── main ────────────────────────────────────────────────────────────────────

export function OwnedClient({ initialRows }: { initialRows: OwnedCar[] }) {
  const [rows, setRows] = useState<OwnedCar[]>(initialRows);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<OwnedCar | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(car: OwnedCar) {
    setEditing(car);
    setForm(carToForm(car));
    setModalOpen(true);
  }

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
        const res = await fetch(`/api/owned/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const updated: OwnedCar = await res.json();
        setRows((r) => r.map((c) => (c.id === updated.id ? updated : c)));
      } else {
        const res = await fetch('/api/owned', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const created: OwnedCar = await res.json();
        setRows((r) => [created, ...r]);
      }
      close();
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm('Usunąć ten wpis?')) return;
    await fetch(`/api/owned/${id}`, { method: 'DELETE' });
    setRows((r) => r.filter((c) => c.id !== id));
  }

  return (
    <>
      <Header>
        <PageTitle>Posiadane samochody</PageTitle>
        <AddBtn onClick={openAdd}>
          <Plus size={15} />
          Dodaj samochód
        </AddBtn>
      </Header>

      <TableWrap>
        {rows.length === 0 ? (
          <Empty>Brak wpisów. Dodaj swój pierwszy samochód.</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Marka / Model</Th>
                <Th>Status</Th>
                <Th>Rocznik</Th>
                <Th>Przebieg</Th>
                <Th>Napęd</Th>
                <Th>Silnik</Th>
                <Th>Cena zakupu</Th>
                <Th>Cena wystawienia</Th>
                <Th>Marża</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {rows.map((car) => {
                const margin =
                  car.listingPrice != null ? car.listingPrice - car.purchasePrice : null;
                return (
                  <Tr key={car.id}>
                    <Td>
                      <strong>{car.brand}</strong> {car.model}
                    </Td>
                    <Td>
                      {(() => {
                        const s = STATUS_MAP[car.status as CarStatus] ?? STATUS_MAP['zakupiony'];
                        return <StatusBadge $color={s.color} $bg={s.bg}>{s.label}</StatusBadge>;
                      })()}
                    </Td>
                    <Td>{car.year}</Td>
                    <MonoCell>{car.mileage.toLocaleString('pl-PL')} km</MonoCell>
                    <Td>{car.driveType ?? '—'}</Td>
                    <Td>{engineLabel(car.engineCapacity, car.enginePower)}{car.fuelType ? ` · ${car.fuelType}` : ''}</Td>
                    <MonoCell>{fmt(car.purchasePrice)}</MonoCell>
                    <MonoCell>{car.listingPrice != null ? fmt(car.listingPrice) : '—'}</MonoCell>
                    <MarginCell $positive={margin === null ? null : margin >= 0}>
                      {margin === null ? '—' : (margin >= 0 ? '+' : '') + fmt(margin)}
                    </MarginCell>
                    <ActionsCell>
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
                <Label>Stan pojazdu</Label>
                <StatusGrid>
                  {STATUS_OPTIONS.map((opt) => (
                    <StatusOption
                      key={opt.value}
                      $active={form.status === opt.value}
                      $color={opt.color}
                      $bg={opt.bg}
                      onClick={() => setForm((f) => ({ ...f, status: opt.value }))}
                      type="button"
                    >
                      {opt.label}
                    </StatusOption>
                  ))}
                </StatusGrid>
              </FieldGroup>

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
    </>
  );
}
