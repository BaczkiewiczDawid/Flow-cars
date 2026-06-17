'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styled, { keyframes } from 'styled-components';
import { RefreshCw } from 'lucide-react';

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const Btn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: none;
  background: ${({ theme }) => theme.colors.accent};
  color: #fff;
  font-weight: 600;
  font-size: 13.5px;
  white-space: nowrap;
  transition: background 120ms ease;

  &:hover {
    background: ${({ theme }) => theme.colors.accentStrong};
  }

  &:disabled {
    opacity: 0.7;
    cursor: default;
  }
`;

const SpinningIcon = styled(RefreshCw)<{ $spinning: boolean }>`
  animation: ${({ $spinning }) => ($spinning ? spin : 'none')} 900ms linear infinite;
`;

const Progress = styled.p`
  color: #5B6470;
  font-size: 12px;
  margin-top: 6px;
  font-variant-numeric: tabular-nums;
`;

const Select = styled.select`
  padding: 8px 10px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.ink};
  font-size: 13.5px;
  font-weight: 500;
  cursor: pointer;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export function ScrapeButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [priceMax, setPriceMax] = useState(10000);

  async function handleClick() {
    setLoading(true);
    setProgress(null);
    setError(null);

    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceMax }),
      });
      if (!res.body) throw new Error('Brak streamu odpowiedzi.');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';

        for (const part of parts) {
          if (!part.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(part.slice(6));
            if (data.error) { setError(data.error); return; }
            if (data.finished) { router.refresh(); return; }
            if (data.done !== undefined) setProgress({ done: data.done, total: data.total });
          } catch {}
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nieznany błąd.');
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }

  return (
    <div>
      <Row>
        <Select
          value={priceMax}
          onChange={(e) => setPriceMax(Number(e.target.value))}
          disabled={loading}
        >
          <option value={5000}>do 5 000 zł</option>
          <option value={10000}>do 10 000 zł</option>
          <option value={15000}>do 15 000 zł</option>
          <option value={20000}>do 20 000 zł</option>
        </Select>
        <Btn onClick={handleClick} disabled={loading}>
          <SpinningIcon size={15} $spinning={loading} />
          Szukaj nowych ofert
        </Btn>
      </Row>
      {loading && progress && (
        <Progress>
          Wyszukane oferty: {progress.done} / {progress.total}
        </Progress>
      )}
      {error && (
        <Progress style={{ color: '#C4432E' }}>{error}</Progress>
      )}
    </div>
  );

}
