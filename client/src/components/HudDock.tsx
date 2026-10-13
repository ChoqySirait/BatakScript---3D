'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Flame,
  BookOpen,
  Layers,
  Sparkles,
  Volume2,
  VolumeX,
  Compass,
  Trophy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { sound } from '@/lib/audio';

interface HudDockProps {
  lastScore?: number | null;
  foldProgress?: number;
  onToggleFold?: () => void;
  streakCount?: number;
}

export default function HudDock({
  lastScore = null,
  foldProgress = 0.18,
  onToggleFold,
  streakCount = 0,
}: HudDockProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [streak, setStreak] = useState(streakCount);

  // Sync streak from localStorage or props
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('batakscript_streak');
      if (stored) {
        setStreak(parseInt(stored, 10) || 0);
      }
    }
  }, []);

  const toggleSound = () => {
    sound.playClickSound();
    setIsMuted((prev) => !prev);
  };

  const isFolded = (foldProgress ?? 0) > 0.5;

  return (
    <aside
      aria-label="HUD Telemetri BatakScript"
      className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      <div className="flex items-center gap-2.5 rounded-2xl border border-charcoal-border/70 bg-[#121214]/85 px-4 py-2.5 shadow-2xl backdrop-blur-xl">
        {/* Brand Batak Glyph Badge */}
        <div className="flex items-center gap-2 border-r border-charcoal-border/60 pr-3">
          <span className="batak-text text-xl text-gold glyph-glow select-none leading-none">
            ᯅ
          </span>
          <span className="hidden sm:inline text-xs font-bold tracking-wider text-bone">
            HUD 3D
          </span>
        </div>

        {/* 1. Accuracy Telemetry */}
        <div className="flex items-center gap-2 border-r border-charcoal-border/60 pr-3">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold uppercase tracking-wider text-bone-dim">
              Akurasi
            </span>
            <span className="font-mono text-xs font-black text-gold leading-none">
              {lastScore !== null && lastScore !== undefined ? `${lastScore}%` : '—'}
            </span>
          </div>
        </div>

        {/* 2. Visual Streak Counter */}
        <div className="flex items-center gap-1.5 border-r border-charcoal-border/60 pr-3">
          <div
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-lg transition-all',
              streak > 0
                ? 'bg-crimson/20 text-crimson shadow-sm shadow-crimson/30 animate-pulse'
                : 'bg-charcoal text-bone-dim'
            )}
          >
            <Flame size={14} />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold uppercase tracking-wider text-bone-dim">
              Streak
            </span>
            <span className="font-mono text-xs font-bold text-bone leading-none">
              {streak}x
            </span>
          </div>
        </div>

        {/* 3. 3D Pustaha Accordion Fold Toggle Button */}
        {onToggleFold && (
          <button
            onClick={() => {
              sound.playClickSound();
              onToggleFold();
            }}
            className={cn(
              'flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all active:scale-95',
              isFolded
                ? 'border-gold/50 bg-gold/15 text-gold'
                : 'border-charcoal-border bg-charcoal text-bone-muted hover:border-crimson hover:text-bone'
            )}
            title={isFolded ? 'Buka Lipatan Pustaha (Unfold)' : 'Lipat Pustaha (Fold)'}
          >
            <Layers size={13} />
            <span className="hidden sm:inline">
              {isFolded ? 'Buka Buku' : 'Lipat Buku'}
            </span>
          </button>
        )}

        {/* 4. Link to Speed Quiz */}
        <Link
          href="/quiz"
          className="flex items-center gap-1.5 rounded-xl border border-charcoal-border bg-charcoal px-3 py-1.5 text-xs font-semibold text-bone-muted hover:border-crimson hover:text-bone transition-all active:scale-95"
          title="Tantangan Kuis Kecepatan 10 Soal"
        >
          <Trophy size={13} className="text-gold" />
          <span className="hidden md:inline">Kuis Kilat</span>
        </Link>

        {/* 5. Sound Mute Toggle */}
        <button
          onClick={toggleSound}
          className="rounded-xl border border-charcoal-border bg-charcoal p-1.5 text-bone-dim hover:text-bone transition-all active:scale-95"
          title={isMuted ? 'Nyalakan Audio Haptic' : 'Senyap'}
        >
          {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
      </div>
    </aside>
  );
}
