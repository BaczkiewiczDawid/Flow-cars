'use client';

import { useState } from 'react';
import Image from 'next/image';
import styled from 'styled-components';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const MainImageWrap = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  background: ${({ theme }) => theme.colors.bgSoft};
  border-radius: ${({ theme }) => theme.radius.lg};
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const NavButton = styled.button<{ $side: 'left' | 'right' }>`
  position: absolute;
  top: 50%;
  ${({ $side }) => ($side === 'left' ? 'left: 12px;' : 'right: 12px;')}
  transform: translateY(-50%);
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  background: rgba(11, 12, 14, 0.55);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;

  &:hover {
    background: rgba(11, 12, 14, 0.75);
  }
`;

const Counter = styled.span`
  position: absolute;
  bottom: 10px;
  right: 12px;
  font-size: 11.5px;
  font-family: ${({ theme }) => theme.font.mono};
  background: rgba(11, 12, 14, 0.6);
  color: #fff;
  padding: 3px 8px;
  border-radius: ${({ theme }) => theme.radius.pill};
  z-index: 2;
`;

const Thumbs = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(76px, 1fr));
  gap: 8px;
`;

const Thumb = styled.button<{ $active: boolean }>`
  position: relative;
  aspect-ratio: 4 / 3;
  border-radius: ${({ theme }) => theme.radius.sm};
  overflow: hidden;
  border: 2px solid
    ${({ theme, $active }) => ($active ? theme.colors.accent : 'transparent')};
  opacity: ${({ $active }) => ($active ? 1 : 0.75)};
  background: ${({ theme }) => theme.colors.bgSoft};

  &:hover {
    opacity: 1;
  }
`;

export function Gallery({ photos, title }: { photos: string[]; title: string }) {
  const [index, setIndex] = useState(0);

  if (photos.length === 0) {
    return (
      <MainImageWrap>
        <div style={{ display: 'grid', height: '100%', placeItems: 'center', color: '#9AA2AC' }}>
          Brak zdjęć w ogłoszeniu
        </div>
      </MainImageWrap>
    );
  }

  const goTo = (next: number) => {
    setIndex((next + photos.length) % photos.length);
  };

  return (
    <Wrap>
      <MainImageWrap>
        <Image
          key={photos[index]}
          src={photos[index]}
          alt={`${title} - zdjęcie ${index + 1}`}
          fill
          sizes="(max-width: 880px) 100vw, 640px"
          style={{ objectFit: 'cover' }}
          priority
        />
        {photos.length > 1 && (
          <>
            <NavButton $side="left" onClick={() => goTo(index - 1)} aria-label="Poprzednie zdjęcie">
              <ChevronLeft size={18} />
            </NavButton>
            <NavButton $side="right" onClick={() => goTo(index + 1)} aria-label="Następne zdjęcie">
              <ChevronRight size={18} />
            </NavButton>
            <Counter>
              {index + 1} / {photos.length}
            </Counter>
          </>
        )}
      </MainImageWrap>

      {photos.length > 1 && (
        <Thumbs>
          {photos.map((photo, i) => (
            <Thumb key={photo} $active={i === index} onClick={() => setIndex(i)}>
              <Image
                src={photo}
                alt={`${title} - miniatura ${i + 1}`}
                fill
                sizes="100px"
                style={{ objectFit: 'cover' }}
              />
            </Thumb>
          ))}
        </Thumbs>
      )}
    </Wrap>
  );
}
