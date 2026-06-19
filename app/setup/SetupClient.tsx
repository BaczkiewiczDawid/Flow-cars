'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { Radar } from 'lucide-react';

const Page = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.bg};
  padding: 24px;
`;

const Card = styled.div`
  width: 100%;
  max-width: 400px;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 40px;
  box-shadow: ${({ theme }) => theme.shadow.card};
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 28px;
`;

const LogoMark = styled.div`
  width: 38px;
  height: 38px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.accent};
  display: grid;
  place-items: center;
  color: #fff;
`;

const LogoText = styled.div`
  font-family: ${({ theme }) => theme.font.display};
  font-size: 18px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.ink};
`;

const Title = styled.h1`
  font-size: 20px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.ink};
  margin: 0 0 6px;
`;

const Sub = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.inkSoft};
  margin: 0 0 28px;
`;

const Label = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.ink};
  margin-bottom: 6px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 14px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.bg};
  color: ${({ theme }) => theme.colors.ink};
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  &:focus { border-color: ${({ theme }) => theme.colors.accent}; }
`;

const Field = styled.div`
  margin-bottom: 18px;
`;

const Hint = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.inkFaint};
  margin-top: 4px;
`;

const Btn = styled.button`
  width: 100%;
  padding: 11px;
  background: ${({ theme }) => theme.colors.accent};
  color: #fff;
  border: none;
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 4px;
  &:disabled { opacity: 0.6; cursor: default; }
`;

const Error = styled.div`
  background: #fef2f2;
  border: 1px solid #fca5a5;
  color: #dc2626;
  border-radius: ${({ theme }) => theme.radius.sm};
  padding: 10px 14px;
  font-size: 13.5px;
  margin-bottom: 18px;
`;

export function SetupClient() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    setLoading(false);
    if (res.ok) {
      router.push('/login');
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Błąd konfiguracji.');
    }
  }

  return (
    <Page>
      <Card>
        <Logo>
          <LogoMark><Radar size={20} /></LogoMark>
          <LogoText>Flow Cars</LogoText>
        </Logo>
        <Title>Pierwsze uruchomienie</Title>
        <Sub>Utwórz konto administratora aby zacząć.</Sub>

        {error && <Error>{error}</Error>}

        <form onSubmit={handleSubmit}>
          <Field>
            <Label htmlFor="name">Imię (opcjonalne)</Label>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          <Field>
            <Label htmlFor="password">Hasło</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
            <Hint>Minimum 8 znaków</Hint>
          </Field>
          <Btn type="submit" disabled={loading}>
            {loading ? 'Tworzenie konta…' : 'Utwórz konto'}
          </Btn>
        </form>
      </Card>
    </Page>
  );
}
