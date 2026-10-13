'use client';

import React from 'react';
import {
  ChevronRight,
  ChevronLeft,
  X,
  Maximize2,
  Minimize2,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { sound } from '@/lib/audio';

interface RightDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
  title: string;
  badge?: string;
  children: React.ReactNode;
}

export default function RightDrawer({
  isOpen,
  onToggle,
  title,
  badge,
  children,
}: RightDrawerProps) {
  return (
    <>
      {/* Toggle Tab Button visible when collapsed */}
      {!isOpen && (
        <button
          onClick={() => {
            sound.playClickSound();
            onToggle();
          }}
          className="fixed right-0 top-28 z-40 flex items-center gap-2 rounded-l-2xl border-y border-l border-gold/40 bg-[#141416]/90 px-3.5 py-3 text-gold shadow-2xl backdrop-blur-xl hover:bg-charcoal active:scale-95 transition-all"
          title="Buka Panel Studio (Kanvas & Panduan)"
        >
          <ChevronLeft size={18} className="animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">
            Panel Studio
          </span>
          <span className="batak-text text-lg">ᯅ</span>
        </button>
      )}

      {/* Floating Glass Drawer */}
      <aside
        className={cn(
          'fixed right-4 top-20 bottom-24 z-30 w-full sm:w-[440px] max-w-[calc(100vw-2rem)]',
          'flex flex-col rounded-3xl border border-charcoal-border/80 bg-[#121214]/90 shadow-2xl backdrop-blur-2xl',
          'transition-all duration-300 ease-in-out',
          isOpen
            ? 'translate-x-0 opacity-100 pointer-events-auto'
            : 'translate-x-[calc(100%+2rem)] opacity-0 pointer-events-none'
        )}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-charcoal-border/60 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="batak-text text-2xl text-gold glyph-glow leading-none">
              ᯅ
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-bone">{title}</h2>
                {badge && (
                  <span className="rounded-full bg-crimson/20 border border-crimson/40 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                    {badge}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-bone-dim">Panel Studio Interaktif</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                sound.playClickSound();
                onToggle();
              }}
              className="rounded-xl border border-charcoal-border/50 bg-charcoal p-1.5 text-bone-muted hover:border-crimson hover:text-bone active:scale-95 transition-all"
              title="Sembunyikan Panel (Collapse)"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Drawer Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {children}
        </div>
      </aside>
    </>
  );
}
