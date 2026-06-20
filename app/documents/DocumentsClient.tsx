'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { Pencil, X, Check, ShieldCheck, Wrench, FileCheck, AlertTriangle, Clock } from 'lucide-react';
import type { OwnedCar } from '@/db/schema';

// ─── helpers ─────────────────────────────────────────────────────────────────

function toDateInput(d: Date | string | null | undefined): string {
  if (!d) return '';
  return new Date(d).toISOString().slice(0, 10);
}

type DocState = 'not_set' | 'ok' | 'soon' | 'expired';
type ReregState = 'done' | 'overdue' | 'pending' | 'no_date';

function docState(expiresAt: Date | string | null | undefined, today: Date): DocState {
  if (!expiresAt) return 'not_set';
  const days = Math.ceil((new Date(expiresAt).getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return 'expired';
  if (days <= 30) return 'soon';
  return 'ok';
}

function daysLeft(date: Date | string | null | undefined, today: Date): number | null {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - today.getTime()) / 86_400_000);
}

function reregDeadline(car: OwnedCar, days: number): Date | null {
  if (!car.purchaseDate) return null;
  const d = new Date(car.purchaseDate);
  d.setDate(d.getDate() + days);
  return d;
}

function reregState(car: OwnedCar, reregistrationDays: number, today: Date): ReregState {
  if (car.reregisteredAt) return 'done';
  const deadline = reregDeadline(car, reregistrationDays);
  if (!deadline) return 'no_date';
  return deadline < today ? 'overdue' : 'pending';
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pl-PL');
}

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

const Td = styled.td`
  padding: 12px 14px;
  color: ${({ theme }) => theme.colors.ink};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  white-space: nowrap;
  vertical-align: middle;
`;

const Tr = styled.tr`
  &:last-child td { border-bottom: none; }
  &:hover td { background: ${({ theme }) => theme.colors.bgSoft}; }
`;

const Empty = styled.div`
  padding: 64px 24px;
  text-align: center;
  color: ${({ theme }) => theme.colors.inkSoft};
  font-size: 14px;
`;

type BadgeVariant = 'ok' | 'soon' | 'expired' | 'not_set' | 'done' | 'overdue' | 'pending' | 'no_date';

const BADGE_STYLES: Record<BadgeVariant, { color: string; bg: string; label: string }> = {
  ok:      { color: '#15803D', bg: 'rgba(21,128,61,0.12)',   label: 'OK' },
  soon:    { color: '#B45309', bg: 'rgba(180,83,9,0.12)',    label: 'Wkrótce' },
  expired: { color: '#dc2626', bg: 'rgba(220,38,38,0.12)',   label: 'Przeterminowane' },
  not_set: { color: '#6B7280', bg: 'rgba(107,114,128,0.10)', label: 'Nie ustawiono' },
  done:    { color: '#15803D', bg: 'rgba(21,128,61,0.12)',   label: 'Przerejestrowany' },
  overdue: { color: '#dc2626', bg: 'rgba(220,38,38,0.12)',   label: 'Po terminie' },
  pending: { color: '#B45309', bg: 'rgba(180,83,9,0.12)',    label: 'Oczekuje' },
  no_date: { color: '#6B7280', bg: 'rgba(107,114,128,0.10)', label: 'Brak daty zakupu' },
};

const Badge = styled.span<{ $color: string; $bg: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: ${({ theme }) => theme.radius.pill};
  font-size: 11.5px;
  font-weight: 600;
  color: ${({ $color }) => $color};
  background: ${({ $bg }) => $bg};
  white-space: nowrap;
`;

const DocCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const DocDate = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.inkSoft};
`;

const DaysLeft = styled.span<{ $urgent?: boolean }>`
  font-size: 11.5px;
  color: ${({ $urgent }) => $urgent ? '#dc2626' : '#6B7280'};
`;

const IconBtn = styled.button<{ $accent?: boolean }>`
  padding: 5px 7px;
  border-radius: ${({ theme }) => theme.radius.sm};
  border: none;
  background: transparent;
  cursor: pointer;
  color: ${({ $accent, theme }) => $accent ? theme.colors.accent : theme.colors.inkSoft};
  &:hover { background: rgba(0,0,0,0.06); }
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
  max-width: 420px;
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
  gap: 16px;
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
  display: flex;
  align-items: center;
  gap: 6px;
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

const ReregRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ToggleBtn = styled.button<{ $active: boolean; $color: string; $bg: string }>`
  flex: 1;
  padding: 9px;
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 120ms;
  border: 1.5px solid ${({ $active, $color, theme }) => $active ? $color : theme.colors.border};
  background: ${({ $active, $bg }) => $active ? $bg : 'transparent'};
  color: ${({ $active, $color, theme }) => $active ? $color : theme.colors.inkSoft};
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

type SortCol = 'insurance' | 'inspection' | 'reregistration';

// nulls sort last regardless of direction
function dateMs(d: Date | string | null | undefined): number {
  return d ? new Date(d).getTime() : Infinity;
}

// ─── types ────────────────────────────────────────────────────────────────────

interface DocForm {
  insuranceExpiresAt: string;
  inspectionExpiresAt: string;
  reregisteredAt: string;
  reregistered: boolean;
}

// ─── main ────────────────────────────────────────────────────────────────────

export function DocumentsClient({
  initialCars,
  reregistrationDays,
}: {
  initialCars: OwnedCar[];
  reregistrationDays: number;
}) {
  const [cars, setCars] = useState<OwnedCar[]>(initialCars);
  const [editing, setEditing] = useState<OwnedCar | null>(null);
  const [form, setForm] = useState<DocForm>({ insuranceExpiresAt: '', inspectionExpiresAt: '', reregisteredAt: '', reregistered: false });
  const [saving, setSaving] = useState(false);
  const [sort, setSort] = useState<{ col: SortCol; dir: 'asc' | 'desc' }>({ col: 'reregistration', dir: 'asc' });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function toggleSort(col: SortCol) {
    setSort((s) => s.col === col ? { col, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'asc' });
  }
  function ind(col: SortCol) { return sort.col !== col ? ' ↕' : sort.dir === 'asc' ? ' ↑' : ' ↓'; }

  const active = cars
    .filter((c) => c.status !== 'sprzedany')
    .sort((a, b) => {
      const dir = sort.dir === 'asc' ? 1 : -1;
      if (sort.col === 'insurance') return dir * (dateMs(a.insuranceExpiresAt) - dateMs(b.insuranceExpiresAt));
      if (sort.col === 'inspection') return dir * (dateMs(a.inspectionExpiresAt) - dateMs(b.inspectionExpiresAt));
      // reregistration: sort by deadline (done cars always last)
      const da = a.reregisteredAt ? Infinity : dateMs(reregDeadline(a, reregistrationDays));
      const db2 = b.reregisteredAt ? Infinity : dateMs(reregDeadline(b, reregistrationDays));
      return dir * (da - db2);
    });

  function openEdit(car: OwnedCar) {
    setEditing(car);
    setForm({
      insuranceExpiresAt: toDateInput(car.insuranceExpiresAt),
      inspectionExpiresAt: toDateInput(car.inspectionExpiresAt),
      reregisteredAt: toDateInput(car.reregisteredAt),
      reregistered: !!car.reregisteredAt,
    });
  }

  function close() { setEditing(null); }

  async function save() {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/owned/${editing.id}/documents`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          insuranceExpiresAt: form.insuranceExpiresAt || null,
          inspectionExpiresAt: form.inspectionExpiresAt || null,
          reregisteredAt: form.reregistered ? (form.reregisteredAt || new Date().toISOString().slice(0, 10)) : null,
        }),
      });
      const updated: OwnedCar = await res.json();
      setCars((cs) => cs.map((c) => c.id === updated.id ? updated : c));
      close();
    } finally { setSaving(false); }
  }

  function StatusCell({ state }: { state: BadgeVariant }) {
    const s = BADGE_STYLES[state];
    const icon = state === 'expired' || state === 'overdue'
      ? <AlertTriangle size={11} />
      : state === 'soon' || state === 'pending'
      ? <Clock size={11} />
      : state === 'done' || state === 'ok'
      ? <Check size={11} />
      : null;
    return <Badge $color={s.color} $bg={s.bg}>{icon}{s.label}</Badge>;
  }

  return (
    <>
      <Header>
        <PageTitle>Dokumenty pojazdów</PageTitle>
      </Header>

      <TableWrap>
        {active.length === 0 ? (
          <Empty>Brak aktywnych pojazdów. Dodaj samochody w zakładce Posiadane.</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Pojazd</Th>
                <Th $sortable onClick={() => toggleSort('insurance')}><ShieldCheck size={13} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />Ubezpieczenie{ind('insurance')}</Th>
                <Th $sortable onClick={() => toggleSort('inspection')}><Wrench size={13} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />Przegląd techniczny{ind('inspection')}</Th>
                <Th $sortable onClick={() => toggleSort('reregistration')}><FileCheck size={13} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />Rejestracja ({reregistrationDays} dni){ind('reregistration')}</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {active.map((car) => {
                const insState = docState(car.insuranceExpiresAt, today);
                const inspState = docState(car.inspectionExpiresAt, today);
                const rregState = reregState(car, reregistrationDays, today);
                const deadline = reregDeadline(car, reregistrationDays);
                const insDays = daysLeft(car.insuranceExpiresAt, today);
                const inspDays = daysLeft(car.inspectionExpiresAt, today);
                const rregDays = deadline ? daysLeft(deadline, today) : null;

                return (
                  <Tr key={car.id}>
                    <Td><strong>{car.brand}</strong> {car.model} <span style={{ color: '#6B7280', fontSize: 12 }}>{car.year}</span></Td>

                    <Td>
                      <DocCell>
                        <StatusCell state={insState} />
                        {car.insuranceExpiresAt && (
                          <>
                            <DocDate>{formatDate(car.insuranceExpiresAt)}</DocDate>
                            {insDays !== null && (
                              <DaysLeft $urgent={insDays < 0}>
                                {insDays < 0 ? `${Math.abs(insDays)} dni po terminie` : `${insDays} dni do końca`}
                              </DaysLeft>
                            )}
                          </>
                        )}
                      </DocCell>
                    </Td>

                    <Td>
                      <DocCell>
                        <StatusCell state={inspState} />
                        {car.inspectionExpiresAt && (
                          <>
                            <DocDate>{formatDate(car.inspectionExpiresAt)}</DocDate>
                            {inspDays !== null && (
                              <DaysLeft $urgent={inspDays < 0}>
                                {inspDays < 0 ? `${Math.abs(inspDays)} dni po terminie` : `${inspDays} dni do końca`}
                              </DaysLeft>
                            )}
                          </>
                        )}
                      </DocCell>
                    </Td>

                    <Td>
                      <DocCell>
                        <StatusCell state={rregState} />
                        {rregState === 'done' && car.reregisteredAt && (
                          <DocDate>Przerejestrowano {formatDate(car.reregisteredAt)}</DocDate>
                        )}
                        {rregState !== 'done' && deadline && (
                          <>
                            <DocDate>Termin: {formatDate(deadline)}</DocDate>
                            {rregDays !== null && (
                              <DaysLeft $urgent={rregDays < 0}>
                                {rregDays < 0 ? `${Math.abs(rregDays)} dni po terminie` : `${rregDays} dni do terminu`}
                              </DaysLeft>
                            )}
                          </>
                        )}
                      </DocCell>
                    </Td>

                    <Td style={{ textAlign: 'right' }}>
                      <IconBtn onClick={() => openEdit(car)} title="Edytuj dokumenty">
                        <Pencil size={14} />
                      </IconBtn>
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </TableWrap>

      {editing && (
        <Backdrop onClick={close}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHead>
              <ModalTitle>{editing.brand} {editing.model}</ModalTitle>
              <IconBtn onClick={close}><X size={18} /></IconBtn>
            </ModalHead>
            <ModalBody>
              <FieldGroup>
                <Label><ShieldCheck size={13} />Ubezpieczenie — data ważności</Label>
                <Input
                  type="date"
                  value={form.insuranceExpiresAt}
                  onChange={(e) => setForm((f) => ({ ...f, insuranceExpiresAt: e.target.value }))}
                />
              </FieldGroup>

              <FieldGroup>
                <Label><Wrench size={13} />Przegląd techniczny — data ważności</Label>
                <Input
                  type="date"
                  value={form.inspectionExpiresAt}
                  onChange={(e) => setForm((f) => ({ ...f, inspectionExpiresAt: e.target.value }))}
                />
              </FieldGroup>

              <FieldGroup>
                <Label><FileCheck size={13} />Status przerejestrowania</Label>
                <ReregRow>
                  <ToggleBtn
                    type="button"
                    $active={!form.reregistered}
                    $color="#B45309"
                    $bg="rgba(180,83,9,0.12)"
                    onClick={() => setForm((f) => ({ ...f, reregistered: false, reregisteredAt: '' }))}
                  >
                    Oczekuje
                  </ToggleBtn>
                  <ToggleBtn
                    type="button"
                    $active={form.reregistered}
                    $color="#15803D"
                    $bg="rgba(21,128,61,0.12)"
                    onClick={() => setForm((f) => ({
                      ...f,
                      reregistered: true,
                      reregisteredAt: f.reregisteredAt || new Date().toISOString().slice(0, 10),
                    }))}
                  >
                    Przerejestrowany
                  </ToggleBtn>
                </ReregRow>
                {form.reregistered && (
                  <Input
                    type="date"
                    value={form.reregisteredAt}
                    onChange={(e) => setForm((f) => ({ ...f, reregisteredAt: e.target.value }))}
                    style={{ marginTop: 6 }}
                  />
                )}
              </FieldGroup>
            </ModalBody>
            <ModalActions>
              <CancelBtn onClick={close}>Anuluj</CancelBtn>
              <SaveBtn onClick={save} disabled={saving}>
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
