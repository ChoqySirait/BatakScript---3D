'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import PustahaScene from '@/components/PustahaScene';
import TransliterationSandbox from '@/components/TransliterationSandbox';
import { INA_NI_SURAT } from '@/components/PustahaBook';

export default function HomePage() {
  // Shared state: 3D book page ↔ active lesson info
  const [activeIdx, setActiveIdx] = useState(0);
  const active = INA_NI_SURAT[activeIdx];

  return (
    <div className="space-y-12">

      {/* ── Hero ── */}
      <div className="text-center space-y-3 pt-4">
        <h1 className="text-3xl font-bold text-bone">
          Pelajari{' '}
          <span className="text-crimson">Surat Batak Toba</span>
        </h1>
        <p className="mx-auto max-w-xl text-sm text-bone-muted leading-relaxed">
          Putar buku 3D Pustaha Laklak, klik halaman untuk berpindah bab, dan
          gunakan sandbox transliterasi dengan <strong className="text-bone">X-Ray Inspector</strong>.
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-xs text-bone-dim">
          {['19 Ina ni Surat', '3D Pustaha Laklak', 'X-Ray Inspector', 'Live Transliterasi'].map(f => (
            <span key={f} className="flex items-center gap-1">
              <Sparkles size={11} className="text-crimson" /> {f}
            </span>
          ))}
        </div>
      </div>

      {/* ── 3D Pustaha Scene ── */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <span className="batak-text text-2xl text-gold">{active.glyph}</span>
          <div>
            <p className="text-sm font-bold text-bone">Bab Aktif: {active.latin}</p>
            <p className="text-xs text-bone-dim font-mono">{active.sound} · {active.unicode}</p>
          </div>
        </div>
        <PustahaScene onGlyphChange={setActiveIdx} />
      </section>

      {/* ── Separator ── */}
      <div className="relative">
        <hr className="border-charcoal-border" />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                         bg-charcoal px-4 text-xs text-bone-dim uppercase tracking-widest">
          Sandbox Transliterasi
        </span>
      </div>

      {/* ── Transliteration sandbox ── */}
      <TransliterationSandbox />

    </div>
  );
}
