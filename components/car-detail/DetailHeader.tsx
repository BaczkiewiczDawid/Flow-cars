'use client';

import Link from 'next/link';
import styled from 'styled-components';
import { ChevronLeft } from 'lucide-react';
import { formatRelativeDate } from '@/lib/format';

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.inkSoft};
  margin-bottom: 16px;

  &:hover {
    color: ${({ theme }) => theme.colors.ink};
  }
`;

const Title = styled.h1`
  font-size: 26px;
  margin-bottom: 4px;
`;

const Meta = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.inkSoft};
`;

export function DetailHeader({
  brand,
  model,
  generation,
  scrapedAt,
}: {
  brand: string;
  model: string;
  generation: string | null;
  scrapedAt: Date;
}) {
  return (
    <div>
      <BackLink href="/">
        <ChevronLeft size={16} />
        Wróć do panelu
      </BackLink>
      <Title>
        {brand} {model} {generation ?? ''}
      </Title>
      <Meta>Zeskanowano {formatRelativeDate(scrapedAt)}</Meta>
    </div>
  );
}
