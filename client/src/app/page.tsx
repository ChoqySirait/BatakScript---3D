'use client';

import { useState } from 'react';
import { Sparkles, PenTool, BookOpen } from 'lucide-react';
import PustahaScene from '@/components/PustahaScene';
import StrokeCanvas from '@/components/StrokeCanvas';
import TransliterationSandbox from '@/components/TransliterationSandbox';
import { INA_NI_SURAT } from '@/components/PustahaBook';

export default function HomePage() {
  // Shared state: 3D book page ↔ active lesson info ↔ StrokeCanvas
  const [activeIdx, setActiveIdx] = useState(0);
  const active = INA_NI_SURAT[activeIdx];

  const handleNextLesson = () => {
    setActiveIdx((prev) => (prev + 1) % INA_NI_SURAT.length);
  };

  return (
    <div className="space-y-12">
      {/* ── Hero ── */}
      <div className="text-center space-y-3 pt-4">
        <h1 className="text-3xl font-bold text-bone">
          Pelajari <span className="text-crimson">Surat Batak Toba</span>
        </h1>
        <p className="mx-auto max-w-xl text-sm text-bone-muted leading-relaxed">
          Putar buku 3D Pustaha Laklak, latih penulisan aksara dengan evaluasi deviasi Euclidean presisi,
          dan jelajahi transliterasi langsung dengan <strong className="text-bone">X-Ray Inspector</strong>.
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-xs text-bone-dim">
          {[
            '19 Ina ni Surat',
            '3D Pustaha Laklak',
            'Canvas Tracing Euclidean',
            'X-Ray Inspector',
            'Live Transliterasi',
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
            <h2 className="text-lg font-bold text-bone">Pustaha Laklak &amp; Kanvas Tracing</h2>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-bone-muted">
            <span className="batak-text text-xl text-gold">{active.glyph}</span>
            <span>{active.latin} ({active.sound})</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: 3D Pustaha Laklak (7 cols) */}
          <div className="lg:col-span-7">
            <PustahaScene onGlyphChange={setActiveIdx} />
          </div>

          {/* Right: Interactive Stroke Canvas (5 cols) */}
          <div className="lg:col-span-5">
            <StrokeCanvas
              lessonId={activeIdx + 1}
              targetGlyph={active.glyph}
              latinSound={active.latin}
              glyphTitle={`Latihan Menulis Aksara ${active.latin}`}
              onNextLesson={handleNextLesson}
              hasNextLesson={activeIdx < INA_NI_SURAT.length - 1}
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
    </div>
  );
}
