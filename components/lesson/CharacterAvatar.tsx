'use client';

import { useState } from 'react';
import Image from 'next/image';

const CHARACTERS = ['Lola', 'Akram', 'Ali', 'Soliha'] as const;
export type CharacterName = (typeof CHARACTERS)[number];

const COLORS: Record<CharacterName, string> = {
  Lola: 'bg-pink-200 text-pink-800 border-pink-300',
  Akram: 'bg-blue-200 text-blue-800 border-blue-300',
  Ali: 'bg-amber-200 text-amber-800 border-amber-300',
  Soliha: 'bg-emerald-200 text-emerald-800 border-emerald-300',
};

// Максимальные размеры для Image (качество); отображаемый размер — через классы (адаптивно)
const SIZES = { sm: 120, md: 160, lg: 220 } as const;

// Адаптивные классы: на телефоне меньше, на планшете/десктопе — больше, пропорционально
const SIZE_CLASSES = {
  sm: 'w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-lg',
  md: 'w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 lg:w-40 lg:h-40 text-2xl',
  lg: 'w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 lg:w-52 lg:h-52 xl:w-[12.5rem] xl:h-[12.5rem] text-3xl',
} as const;

export default function CharacterAvatar({
  name,
  size = 'md',
  priority = false,
}: {
  name: CharacterName;
  size?: 'sm' | 'md' | 'lg';
  priority?: boolean;
}) {
  const [imageError, setImageError] = useState(false);
  const sizeClass = SIZE_CLASSES[size];
  const px = SIZES[size];
  const src = `/characters/${name.toLowerCase()}.png`;

  if (imageError) {
    const initial = name.charAt(0);
    return (
      <div
        className={`rounded-2xl border-2 flex items-center justify-center font-bold flex-shrink-0 ${sizeClass} ${COLORS[name]}`}
        role="img"
        aria-label={name}
      >
        {initial}
      </div>
    );
  }

  return (
    <div className={`flex-shrink-0 overflow-hidden ${sizeClass}`} role="img" aria-label={name}>
      <Image
        src={src}
        alt={name}
        width={px}
        height={px}
        className="object-contain w-full h-full"
        priority={priority}
        onError={() => setImageError(true)}
      />
    </div>
  );
}
