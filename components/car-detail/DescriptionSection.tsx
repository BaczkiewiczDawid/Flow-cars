'use client';

import styled from 'styled-components';

const SectionTitle = styled.h2`
  font-size: 16px;
  margin-bottom: 10px;
`;

const Text = styled.p`
  font-size: 14px;
  line-height: 1.65;
  color: ${({ theme }) => theme.colors.ink};
  white-space: pre-line;
`;

export function DescriptionSection({ text }: { text: string }) {
  return (
    <section>
      <SectionTitle>Opis ogłoszenia</SectionTitle>
      <Text>{text}</Text>
    </section>
  );
}
