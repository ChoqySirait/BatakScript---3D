'use client';

import dynamic from 'next/dynamic';
import React, { useState } from 'react';
import {
  RotateCcw,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { INA_NI_SURAT } from './PustahaBook';
import { cn } from '@/lib/utils';
import { sound } from '@/lib/audio';

// Lazy-load the WebGL canvas to avoid SSR
const PustahaCanvas = dynamic(() => import('./PustahaCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <div className="text-center space-y-3">
        <div className="batak-text text-6xl text-gold glyph-glow animate-pulse">ᯅ</div>
        <p className="text-sm font-semibold text-bone-muted">Menyiapkan Naskah 3D Pustaha Laklak…</p>
      </div>
    </div>
  ),
});

interface PustahaSceneProps {
  /** External page index control */
  pageIndex?: number;
  /** Called when active glyph changes */
  onGlyphChange?: (index: number) => void;
  /** Live 2D canvas for real-time 3D texture mirroring */
  sourceCanvas?: HTMLCanvasElement | null;
  /** External fold progress controller if provided */
  foldProgress?: number;
  onFoldChange?: (val: number) => void;
  /** Fullscreen background stage mode */
  isFullScreen?: boolean;
}

export default function PustahaScene({
  pageIndex: externalPage,
  onGlyphChange,
  sourceCanvas,
  foldProgress: externalFold,
  onFoldChange,
  isFullScreen = false,
}: PustahaSceneProps) {
  const [internalPage, setInternalPage] = useState(0);
  const [internalFold, setInternalFold] = useState(0.18); // 0.0 open, 1.0 folded

  const pageIdx = externalPage !== undefined ? externalPage : internalPage;
  const setPageIdx = (idx: number) => {
    setInternalPage(idx);
    onGlyphChange?.(idx);
  };

  const fold = externalFold !== undefined ? externalFold : internalFold;
  const total = INA_NI_SURAT.length;
  const current = INA_NI_SURAT[pageIdx];

  const goNext = () => {
    sound.playClickSound();
    const next = (pageIdx + 1) % total;
    setPageIdx(next);
  };

  const goPrev = () => {
    sound.playClickSound();
    const prev = (pageIdx - 1 + total) % total;
    setPageIdx(prev);
  };

  if (isFullScreen) {
    return (
      <div className="fixed inset-0 h-screen w-screen z-0 overflow-hidden bg-[#0A0A0C] pointer-events-auto select-none">
        {/* Top-left Immersion Badge */}
        <div className="pointer-events-none absolute left-5 top-20 z-10 flex items-center gap-2 rounded-2xl bg-[#121214]/80 px-3.5 py-2 backdrop-blur-xl border border-charcoal-border/50">
          <RotateCcw size={13} className="text-gold animate-spin-slow" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-bone">
              Studio Naskah 3D
            </span>
            <span className="text-[10px] text-bone-dim">
              Klik &amp; Drag untuk memutar · Scroll untuk zoom bebas
            </span>
          </div>
        </div>

        {/* Top-right Status Pill */}
        <div className="absolute right-5 top-20 z-10 flex items-center gap-2">
          {sourceCanvas && (
            <div className="flex items-center gap-1.5 rounded-2xl bg-crimson/20 border border-crimson/40 px-3.5 py-2 backdrop-blur-xl">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-crimson opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-crimson"></span>
              </span>
              <span className="text-[11px] font-bold text-rose-300">
                Mirroring 3D Aktif
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 rounded-2xl bg-[#121214]/80 border border-charcoal-border/50 px-3.5 py-2 backdrop-blur-xl">
            <span className="batak-text text-xl text-gold leading-none">
              {current.glyph}
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-bone leading-tight">
                Aksara {current.latin}
              </span>
              <span className="text-[10px] font-mono text-bone-dim">
                {current.sound} · Bab {pageIdx + 1}
              </span>
            </div>
          </div>
        </div>

        {/* Full-screen WebGL Canvas */}
        <PustahaCanvas
          pageIndex={pageIdx}
          foldProgress={fold}
          sourceCanvas={sourceCanvas}
          onNext={goNext}
          onPrev={goPrev}
        />
      </div>
    );
  }

  // Embedded card mode fallback
  return (
    <section className="space-y-4">
      <div
        className="relative overflow-hidden rounded-2xl border border-charcoal-border bg-[#0D0D0E] shadow-2xl"
        style={{ height: '500px' }}
      >
        <PustahaCanvas
          pageIndex={pageIdx}
          foldProgress={fold}
          sourceCanvas={sourceCanvas}
          onNext={goNext}
          onPrev={goPrev}
        />
      </div>
    </section>
  );
}
