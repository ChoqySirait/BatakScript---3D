'use client';

import dynamic from 'next/dynamic';
import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  BookOpen,
  Layers,
  Sparkles,
} from 'lucide-react';
import { INA_NI_SURAT } from './PustahaBook';
import { cn } from '@/lib/utils';
import { sound } from '@/lib/audio';

// Lazy-load the WebGL canvas to avoid SSR
const PustahaCanvas = dynamic(() => import('./PustahaCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <div className="text-center space-y-3">
        <div className="batak-text text-5xl text-gold glyph-glow animate-pulse">ᯅ</div>
        <p className="text-sm text-bone-dim">Memuat Pustaha Laklak 3D…</p>
      </div>
    </div>
  ),
});

interface PustahaSceneProps {
  /** Called when active glyph changes, so parent can sync lesson state */
  onGlyphChange?: (index: number) => void;
  /** Live 2D canvas for real-time 3D texture mirroring */
  sourceCanvas?: HTMLCanvasElement | null;
  /** External fold progress controller if provided */
  foldProgress?: number;
  onFoldChange?: (val: number) => void;
}

export default function PustahaScene({
  onGlyphChange,
  sourceCanvas,
  foldProgress: externalFold,
  onFoldChange,
}: PustahaSceneProps) {
  const [pageIdx, setPageIdx] = useState(0);
  const [internalFold, setInternalFold] = useState(0.18); // 0.0 open, 1.0 folded

  const fold = externalFold !== undefined ? externalFold : internalFold;
  const setFold = (val: number) => {
    setInternalFold(val);
    onFoldChange?.(val);
  };

  const total = INA_NI_SURAT.length;
  const current = INA_NI_SURAT[pageIdx];

  const goNext = () => {
    sound.playClickSound();
    const next = (pageIdx + 1) % total;
    setPageIdx(next);
    onGlyphChange?.(next);
  };

  const goPrev = () => {
    sound.playClickSound();
    const prev = (pageIdx - 1 + total) % total;
    setPageIdx(prev);
    onGlyphChange?.(prev);
  };

  const goTo = (i: number) => {
    sound.playClickSound();
    setPageIdx(i);
    onGlyphChange?.(i);
  };

  return (
    <section className="space-y-4">
      {/* ── 3D Canvas Box ── */}
      <div
        className="relative overflow-hidden rounded-2xl border border-charcoal-border bg-[#0D0D0E] shadow-2xl"
        style={{ height: '500px' }}
      >
        {/* Top-left Info Badge */}
        <div className="pointer-events-none absolute left-4 top-4 z-10 flex items-center gap-2 rounded-xl bg-charcoal/80 px-3 py-1.5 backdrop-blur-md border border-charcoal-border/50">
          <RotateCcw size={12} className="text-gold" />
          <span className="text-xs text-bone-muted">
            3D Orbit Controls · Drag untuk putar
          </span>
        </div>

        {/* Top-right Status Badges */}
        <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
          {sourceCanvas && (
            <div className="flex items-center gap-1.5 rounded-xl bg-crimson/20 border border-crimson/40 px-3 py-1.5 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-crimson opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-crimson"></span>
              </span>
              <span className="text-[11px] font-bold text-rose-300">
                Mirroring 3D Aktif
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5 rounded-xl bg-charcoal/80 border border-charcoal-border/50 px-3 py-1.5 backdrop-blur-md">
            <BookOpen size={12} className="text-gold" />
            <span className="text-xs font-mono font-bold text-bone">
              {pageIdx + 1} / {total}
            </span>
          </div>
        </div>

        {/* Floating Fold/Unfold Slider Control in Bottom-Right */}
        <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 rounded-xl border border-charcoal-border/60 bg-charcoal/85 px-3 py-2 backdrop-blur-md shadow-lg">
          <Layers size={14} className="text-gold" />
          <span className="text-[11px] font-semibold text-bone-dim">Lipatan:</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={fold}
            onChange={(e) => setFold(parseFloat(e.target.value))}
            className="w-24 accent-crimson cursor-pointer"
            title="Geser untuk melipat atau membuka lipatan akordeon Pustaha Laklak"
          />
          <span className="text-[10px] font-mono text-bone-muted w-7 text-right">
            {Math.round(fold * 100)}%
          </span>
        </div>

        {/* WebGL Canvas */}
        <PustahaCanvas
          pageIndex={pageIdx}
          foldProgress={fold}
          sourceCanvas={sourceCanvas}
          onNext={goNext}
          onPrev={goPrev}
        />
      </div>

      {/* ── Info + Navigation Bar ── */}
      <div className="flex items-center justify-between rounded-xl border border-charcoal-border bg-charcoal-light px-4 py-3 shadow-lg">
        {/* Prev button */}
        <button
          onClick={goPrev}
          className="flex items-center gap-1.5 rounded-lg border border-charcoal-border px-3 py-2 text-sm font-medium text-bone-muted hover:border-crimson hover:text-bone active:scale-95 transition-all"
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">Sebelumnya</span>
        </button>

        {/* Current glyph info */}
        <div className="flex flex-col items-center gap-0.5 text-center">
          <span className="batak-text text-3xl text-gold glyph-glow leading-none">
            {current.glyph}
          </span>
          <span className="text-sm font-bold text-bone">
            Aksara {current.latin}
          </span>
          <span className="text-xs text-bone-dim font-mono">
            {current.sound} · {current.unicode}
          </span>
        </div>

        {/* Next button */}
        <button
          onClick={goNext}
          className="flex items-center gap-1.5 rounded-lg border border-charcoal-border px-3 py-2 text-sm font-medium text-bone-muted hover:border-crimson hover:text-bone active:scale-95 transition-all"
        >
          <span className="hidden sm:inline">Berikutnya</span>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* ── Chapter Dot Navigation ── */}
      <div className="flex flex-wrap justify-center gap-1.5 px-2">
        {INA_NI_SURAT.map((g, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            title={`${g.latin} (${g.glyph})`}
            className={cn(
              'h-2.5 w-2.5 rounded-full transition-all',
              i === pageIdx
                ? 'scale-125 bg-crimson shadow-sm shadow-crimson'
                : 'bg-charcoal-border hover:bg-bone-dim',
            )}
          />
        ))}
      </div>
    </section>
  );
}
