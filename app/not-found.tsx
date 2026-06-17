'use client';

import Link from 'next/link';
import styled from 'styled-components';
import { SearchX } from 'lucide-react';

const Wrap = styled.div`
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 12px;
  padding: 40px 20px;

  svg {
    color: ${({ theme }) => theme.colors.inkFaint};
  }
`;

const Title = styled.h1`
  font-size: 19px;
`;

const Text = styled.p`
  font-size: 13.5px;
  color: ${({ theme }) => theme.colors.inkSoft};
  max-width: 360px;
`;

const BackLink = styled(Link)`
  margin-top: 8px;
  font-size: 13.5px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.accentStrong};
`;

export default function NotFound() {
  return (
    <Wrap>
      <SearchX size={34} />
      <Title>Nie znaleziono ogłoszenia</Title>
      <Text>
        To ogłoszenie mogło zostać usunięte z bazy albo link jest nieprawidłowy.
      </Text>
      <BackLink href="/">Wróć do panelu</BackLink>
    </Wrap>
  );
}
