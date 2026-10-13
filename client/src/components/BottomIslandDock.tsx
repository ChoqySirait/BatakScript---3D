'use client';

import React from 'react';
import {
  LucideIcon,
  ChevronLeft,
  ChevronRight,
  Layers,
  Flame,
  PenTool,
  Scroll,
  Paintbrush,
  Sparkles,
  PanelRightClose,
  PanelRightOpen,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { sound } from '@/lib/audio';

export type StudioMode = 'tracing' | 'quest' | 'calligraphy' | 'sandbox';

interface BottomIslandDockProps {
  // Page navigation
  currentPage: number;
  totalPages: number;
  currentGlyph: string;
  currentLatin: string;
  onPrevPage: () => void;
  onNextPage: () => void;

  // Accordion fold
  foldProgress: number;
  onToggleFold: () => void;

  // Mode switcher
  activeMode: StudioMode;
  onSelectMode: (mode: StudioMode) => void;

  // Telemetry
  lastScore: number | null;
  streakCount: number;

  // Right drawer toggle
  isDrawerOpen: boolean;
  onToggleDrawer: () => void;
}

export default function BottomIslandDock({
  currentPage,
  totalPages,
  currentGlyph,
  currentLatin,
  onPrevPage,
  onNextPage,
  foldProgress,
  onToggleFold,
  activeMode,
  onSelectMode,
  lastScore,
  streakCount,
  isDrawerOpen,
  onToggleDrawer,
}: BottomIslandDockProps) {
  const isFolded = foldProgress > 0.5;

  const MODES: { id: StudioMode; label: string; icon: LucideIcon }[] = [
    { id: 'tracing', label: 'Tracing Presisi', icon: PenTool },
    { id: 'quest', label: 'Babad Quest', icon: Scroll },
    { id: 'calligraphy', label: 'Kaligrafi Bebas', icon: Paintbrush },
    { id: 'sandbox', label: 'Sandbox X-Ray', icon: Sparkles },
  ];

  return (
    <nav
      aria-label="Bottom Island Dock"
      className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 max-w-[96vw] animate-in fade-in slide-in-from-bottom-3 duration-300"
    >
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-charcoal-border/70 bg-[#121214]/90 px-3.5 py-2.5 shadow-2xl backdrop-blur-2xl">
        {/* ── 1. Naskah Page Switcher ── */}
        <div className="flex items-center gap-1.5 border-r border-charcoal-border/60 pr-2.5">
          <button
            onClick={() => {
              sound.playClickSound();
              onPrevPage();
            }}
            className="rounded-xl border border-charcoal-border/50 bg-charcoal p-1.5 text-bone-muted hover:border-crimson hover:text-bone active:scale-95 transition-all"
            title="Bab Sebelumnya"
          >
            <ChevronLeft size={15} />
          </button>

          <div className="flex flex-col items-center min-w-[65px] px-1 select-none">
            <span className="batak-text text-lg text-gold leading-none">
              {currentGlyph}
            </span>
            <span className="text-[10px] font-mono font-bold text-bone-muted leading-tight">
              {currentPage} / {totalPages}
            </span>
          </div>

          <button
            onClick={() => {
              sound.playClickSound();
              onNextPage();
            }}
            className="rounded-xl border border-charcoal-border/50 bg-charcoal p-1.5 text-bone-muted hover:border-crimson hover:text-bone active:scale-95 transition-all"
            title="Bab Berikutnya"
          >
            <ChevronRight size={15} />
          </button>
        </div>

        {/* ── 2. Mode Switcher (Pill Tabs) ── */}
        <div className="flex items-center gap-1 border-r border-charcoal-border/60 pr-2.5">
          {MODES.map(({ id, label, icon: Icon }) => {
            const isActive = activeMode === id;
            return (
              <button
                key={id}
                onClick={() => {
                  sound.playClickSound();
                  onSelectMode(id);
                }}
                className={cn(
                  'flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all active:scale-95',
                  isActive
                    ? 'bg-crimson text-bone shadow-md shadow-crimson/30'
                    : 'bg-charcoal text-bone-dim hover:text-bone hover:bg-charcoal-light'
                )}
                title={label}
              >
                <Icon size={13} />
                <span className="hidden md:inline">{label}</span>
              </button>
            );
          })}
        </div>

        {/* ── 3. Accordion Fold Toggle ── */}
        <div className="flex items-center border-r border-charcoal-border/60 pr-2.5">
          <button
            onClick={() => {
              sound.playClickSound();
              onToggleFold();
            }}
            className={cn(
              'flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-all active:scale-95',
              isFolded
                ? 'border-gold/50 bg-gold/15 text-gold'
                : 'border-charcoal-border bg-charcoal text-bone-muted hover:border-crimson hover:text-bone'
            )}
            title={isFolded ? 'Buka Naskah (Unfold)' : 'Lipat Naskah (Fold)'}
          >
            <Layers size={13} />
            <span className="hidden sm:inline">
              {isFolded ? 'Buka' : 'Lipat'}
            </span>
          </button>
        </div>

        {/* ── 4. Telemetry: Accuracy & Streak ── */}
        <div className="flex items-center gap-2 border-r border-charcoal-border/60 pr-2.5">
          {/* Accuracy */}
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-bold uppercase tracking-wider text-bone-dim">
              Skor
            </span>
            <span className="font-mono text-xs font-black text-gold leading-none">
              {lastScore !== null ? `${lastScore}%` : '—'}
            </span>
          </div>

          {/* Streak Flame */}
          <div className="flex items-center gap-1">
            <div
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-lg transition-all',
                streakCount > 0
                  ? 'bg-crimson/20 text-crimson shadow-sm shadow-crimson/30 animate-pulse'
                  : 'bg-charcoal text-bone-dim'
              )}
            >
              <Flame size={13} />
            </div>
            <span className="font-mono text-xs font-bold text-bone">
              {streakCount}x
            </span>
          </div>
        </div>

        {/* ── 5. Drawer Toggle Button ── */}
        <div>
          <button
            onClick={() => {
              sound.playClickSound();
              onToggleDrawer();
            }}
            className={cn(
              'flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all active:scale-95',
              isDrawerOpen
                ? 'border-gold/40 bg-gold/15 text-gold'
                : 'border-charcoal-border bg-charcoal text-bone hover:border-crimson'
            )}
            title={isDrawerOpen ? 'Sembunyikan Panel' : 'Buka Panel Studio'}
          >
            {isDrawerOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
            <span className="hidden sm:inline">
              {isDrawerOpen ? 'Tutup Panel' : 'Panel Studio'}
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}
