'use client';

import React, { useState, useCallback } from 'react';
import { Sparkles, BookOpen, Layers } from 'lucide-react';
import PustahaScene from '@/components/PustahaScene';
import StrokeCanvas from '@/components/StrokeCanvas';
import TransliterationSandbox from '@/components/TransliterationSandbox';
import HudDock from '@/components/HudDock';
import { INA_NI_SURAT } from '@/components/PustahaBook';

export default function HomePage() {
  // Shared state: 3D book page ↔ active lesson info ↔ StrokeCanvas
  const [activeIdx, setActiveIdx] = useState(0);
  const [mirrorCanvas, setMirrorCanvas] = useState<HTMLCanvasElement | null>(null);
  const [foldProgress, setFoldProgress] = useState(0.18);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [streakCount, setStreakCount] = useState(0);

  const active = INA_NI_SURAT[activeIdx];

  const handleNextLesson = () => {
    setActiveIdx((prev) => (prev + 1) % INA_NI_SURAT.length);
  };

  const handleCanvasUpdate = useCallback((canvas: HTMLCanvasElement) => {
    setMirrorCanvas(canvas);
  }, []);

  const handleToggleFold = () => {
    setFoldProgress((prev) => (prev > 0.5 ? 0.15 : 0.85));
  };

  const handleLessonSuccess = () => {
    setLastScore((prev) => (prev !== null ? Math.max(prev, 85) : 88));
    setStreakCount((prev) => {
      const next = prev + 1;
      if (typeof window !== 'undefined') {
        localStorage.setItem('batakscript_streak', next.toString());
      }
      return next;
    });
  };

  return (
    <div className="space-y-12 pb-24">
      {/* ── Hero ── */}
      <div className="text-center space-y-3 pt-4">
        <h1 className="text-3xl font-bold text-bone">
          Pelajari <span className="text-crimson">Surat Batak Toba</span>
        </h1>
        <p className="mx-auto max-w-xl text-sm text-bone-muted leading-relaxed">
          Putar buku 3D Pustaha Laklak akordeon, latih goresan presisi 64-titik dengan evaluasi arah vektor
          dan visual error heatmap, serta saksikan goresanmu tercermin langsung di atas permukaan 3D!
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-xs text-bone-dim">
          {[
            '19 Ina ni Surat',
            '3D Accordion Laklak',
            'Real-Time 3D Mirroring',
            'Gestur 64-Titik Presisi',
            'Error Heatmap',
            'Audio Haptic Prosedural',
          ].map((f) => (
            <span key={f} className="flex items-center gap-1">
              <Sparkles size={11} className="text-crimson" /> {f}
            </span>
          ))}
        </div>
      </div>

      {/* ── 3D Scene & Tracing Canvas Grid ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-charcoal-border pb-3">
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="text-crimson" />
            <h2 className="text-lg font-bold text-bone">
              Pustaha Laklak Akordeon &amp; Kanvas Tracing Presisi
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-bone-muted">
            <span className="batak-text text-xl text-gold">{active.glyph}</span>
            <span>{active.latin} ({active.sound})</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: 3D Pustaha Laklak (7 cols) with Live Canvas Mirroring */}
          <div className="lg:col-span-7">
            <PustahaScene
              onGlyphChange={setActiveIdx}
              sourceCanvas={mirrorCanvas}
              foldProgress={foldProgress}
              onFoldChange={setFoldProgress}
            />
          </div>

          {/* Right: Interactive Stroke Canvas (5 cols) */}
          <div className="lg:col-span-5">
            <StrokeCanvas
              lessonId={activeIdx + 1}
              targetGlyph={active.glyph}
              latinSound={active.latin}
              glyphTitle={`Latihan Menulis Aksara ${active.latin}`}
              onSuccess={handleLessonSuccess}
              onNextLesson={handleNextLesson}
              hasNextLesson={activeIdx < INA_NI_SURAT.length - 1}
              onCanvasUpdate={handleCanvasUpdate}
            />
          </div>
        </div>
      </section>

      {/* ── Separator ── */}
      <div className="relative">
        <hr className="border-charcoal-border" />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-charcoal px-4 text-xs text-bone-dim uppercase tracking-widest">
          Sandbox Transliterasi &amp; X-Ray
        </span>
      </div>

      {/* ── Transliteration sandbox ── */}
      <TransliterationSandbox />

      {/* ── Floating Glassmorphism HUD Dock ── */}
      <HudDock
        lastScore={lastScore}
        foldProgress={foldProgress}
        onToggleFold={handleToggleFold}
        streakCount={streakCount}
      />
    </div>
  );
}
