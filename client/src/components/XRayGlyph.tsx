'use client';

import { useState } from 'react';
import { SyllableToken } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  token: SyllableToken;
}

// Map component names to human-readable labels and colours
const COMPONENT_META: Record<string, { label: string; color: string }> = {
  // Ina ni Surat
  ha: { label: 'Karakter Induk HA', color: 'text-gold' },
  ba: { label: 'Karakter Induk BA', color: 'text-gold' },
  pa: { label: 'Karakter Induk PA', color: 'text-gold' },
  na: { label: 'Karakter Induk NA', color: 'text-gold' },
  ra: { label: 'Karakter Induk RA', color: 'text-gold' },
  ta: { label: 'Karakter Induk TA', color: 'text-gold' },
  ma: { label: 'Karakter Induk MA', color: 'text-gold' },
  sa: { label: 'Karakter Induk SA', color: 'text-gold' },
  da: { label: 'Karakter Induk DA', color: 'text-gold' },
  ga: { label: 'Karakter Induk GA', color: 'text-gold' },
  ja: { label: 'Karakter Induk JA', color: 'text-gold' },
  wa: { label: 'Karakter Induk WA', color: 'text-gold' },
  ya: { label: 'Karakter Induk YA', color: 'text-gold' },
  nga:{ label: 'Karakter Induk NGA', color: 'text-gold' },
  nya:{ label: 'Karakter Induk NYA', color: 'text-gold' },
  ca: { label: 'Karakter Induk CA', color: 'text-gold' },
  a:  { label: 'Vokal Mandiri A', color: 'text-gold' },
  'i-mandiri': { label: 'Vokal Mandiri I', color: 'text-gold' },
  'u-mandiri': { label: 'Vokal Mandiri U', color: 'text-gold' },
  // Anak ni Surat
  haborotan:  { label: 'Haborotan — vokal /i/', color: 'text-crimson-glow' },
  sihorhor:   { label: 'Sihorhor — vokal /u/', color: 'text-crimson-glow' },
  hatadingan: { label: 'Hatadingan — vokal /e/', color: 'text-crimson-glow' },
  hatalingan: { label: 'Hatalingan — vokal /o/', color: 'text-crimson-glow' },
  pangolat:   { label: 'Pangolat — pemati vokal', color: 'text-bone-dim' },
  hamisaran:  { label: 'Hamisaran — sengau /ng/', color: 'text-crimson-glow' },
};

function getMeta(comp: string) {
  return COMPONENT_META[comp] ?? { label: comp, color: 'text-bone-muted' };
}

export default function XRayGlyph({ token }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      {/* Token card */}
      <button
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className={cn(
          'flex flex-col items-center gap-1 rounded-xl border px-3 py-2 transition-all cursor-default',
          'border-charcoal-border bg-charcoal-light',
          'hover:border-crimson hover:bg-charcoal-muted',
        )}
      >
        <span className="batak-text text-2xl text-bone">{token.glyph}</span>
        <span className="text-xs text-bone-dim font-mono">{token.syllable}</span>
      </button>

      {/* Tooltip */}
      {open && (
        <div
          className={cn(
            'absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2',
            'w-56 rounded-xl border border-charcoal-border bg-charcoal p-3 shadow-2xl',
            'pointer-events-none',
          )}
        >
          {/* Header */}
          <div className="mb-2 border-b border-charcoal-border pb-2">
            <p className="batak-text text-2xl text-bone leading-none">{token.glyph}</p>
            <p className="mt-0.5 text-xs font-semibold text-bone-muted uppercase tracking-widest">
              {token.syllable}
            </p>
          </div>

          {/* Components */}
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-bone-dim">
            Anatomi
          </p>
          <ul className="space-y-1">
            {token.components.map((comp, i) => {
              const { label, color } = getMeta(comp);
              return (
                <li key={i} className="flex items-start gap-1.5 text-xs">
                  <span className={cn('mt-px font-bold', color)}>▪</span>
                  <span className="text-bone-muted">{label}</span>
                </li>
              );
            })}
          </ul>

          {/* Arrow */}
          <div className="absolute left-1/2 top-full -translate-x-1/2">
            <div className="border-4 border-transparent border-t-charcoal" />
          </div>
        </div>
      )}
    </div>
  );
}

