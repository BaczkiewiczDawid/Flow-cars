'use client';

import styled from 'styled-components';
import { Check } from 'lucide-react';

const SectionTitle = styled.h2`
  font-size: 16px;
  margin-bottom: 12px;
`;

const TagGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 8px;
`;

const Tag = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  padding: 8px 10px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.bgSoft};

  svg {
    color: ${({ theme }) => theme.colors.accent};
    flex-shrink: 0;
  }
`;

const Empty = styled.p`
  font-size: 13.5px;
  color: ${({ theme }) => theme.colors.inkFaint};
`;

export function EquipmentList({ items }: { items: string[] }) {
  return (
    <section>
      <SectionTitle>Wyposażenie</SectionTitle>
      {items.length === 0 ? (
        <Empty>Sprzedający nie podał listy wyposażenia w ogłoszeniu.</Empty>
      ) : (
        <TagGrid>
          {items.map((item) => (
            <Tag key={item}>
              <Check size={15} />
              {item}
            </Tag>
          ))}
        </TagGrid>
      )}
    </section>
  );
}
