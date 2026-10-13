'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, BookOpen } from 'lucide-react';
import { INA_NI_SURAT } from './PustahaBook';
import { cn } from '@/lib/utils';

// Lazy-load the WebGL canvas to avoid SSR
const PustahaCanvas = dynamic(() => import('./PustahaCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <div className="text-center space-y-3">
        <div className="batak-text text-5xl text-gold glyph-glow animate-pulse">ᯅ</div>
        <p className="text-sm text-bone-dim">Memuat scene 3D…</p>
      </div>
    </div>
  ),
});

interface Props {
  /** Called when active glyph changes, so parent can sync lesson state */
  onGlyphChange?: (index: number) => void;
}

export default function PustahaScene({ onGlyphChange }: Props) {
  const [pageIdx, setPageIdx] = useState(0);
  const total = INA_NI_SURAT.length;
  const current = INA_NI_SURAT[pageIdx];

  const goNext = () => {
    const next = (pageIdx + 1) % total;
    setPageIdx(next);
    onGlyphChange?.(next);
  };

  const goPrev = () => {
    const prev = (pageIdx - 1 + total) % total;
    setPageIdx(prev);
    onGlyphChange?.(prev);
  };

  const goTo = (i: number) => {
    setPageIdx(i);
    onGlyphChange?.(i);
  };

  return (
    <section className="space-y-4">
      {/* ── 3D Canvas ── */}
      <div className="relative overflow-hidden rounded-2xl border border-charcoal-border bg-charcoal shadow-2xl"
           style={{ height: '480px' }}>

        {/* Hint overlay */}
        <div className="pointer-events-none absolute left-4 top-4 z-10 flex items-center gap-1.5
                        rounded-lg bg-charcoal/70 px-2.5 py-1.5 backdrop-blur-sm">
          <RotateCcw size={11} className="text-bone-dim" />
          <span className="text-xs text-bone-dim">Drag untuk memutar · Scroll untuk zoom · Klik buku untuk berpindah bab</span>
        </div>

        {/* Page counter badge */}
        <div className="pointer-events-none absolute right-4 top-4 z-10 flex items-center gap-1.5
                        rounded-lg bg-charcoal/70 px-2.5 py-1.5 backdrop-blur-sm">
          <BookOpen size={11} className="text-crimson" />
          <span className="text-xs font-mono text-bone">
            {pageIdx + 1} / {total}
          </span>
        </div>

        <PustahaCanvas pageIndex={pageIdx} onNext={goNext} onPrev={goPrev} />
      </div>

      {/* ── Info + navigation bar ── */}
      <div className="flex items-center justify-between rounded-xl border border-charcoal-border
                      bg-charcoal-light px-4 py-3">
        {/* Prev button */}
        <button
          onClick={goPrev}
          className="flex items-center gap-1.5 rounded-lg border border-charcoal-border px-3 py-2
                     text-sm text-bone-muted hover:border-crimson hover:text-bone transition-all"
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">Sebelumnya</span>
        </button>

        {/* Current glyph info */}
        <div className="flex flex-col items-center gap-0.5 text-center">
          <span className="batak-text text-3xl text-gold leading-none">{current.glyph}</span>
          <span className="text-sm font-bold text-bone">{current.latin}</span>
          <span className="text-xs text-bone-dim font-mono">{current.sound} · {current.unicode}</span>
        </div>

        {/* Next button */}
        <button
          onClick={goNext}
          className="flex items-center gap-1.5 rounded-lg border border-charcoal-border px-3 py-2
                     text-sm text-bone-muted hover:border-crimson hover:text-bone transition-all"
        >
          <span className="hidden sm:inline">Berikutnya</span>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* ── Chapter dot navigation ── */}
      <div className="flex flex-wrap justify-center gap-1.5 px-2">
        {INA_NI_SURAT.map((g, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            title={`${g.latin} (${g.glyph})`}
            className={cn(
              'h-2.5 w-2.5 rounded-full transition-all',
              i === pageIdx
                ? 'scale-125 bg-crimson'
                : 'bg-charcoal-border hover:bg-bone-dim',
            )}
          />
        ))}
      </div>
    </section>
  );
}

