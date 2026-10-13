'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { GlyphInfo } from '@/types';
import { cn } from '@/lib/utils';
import { Loader2, WifiOff, Search } from 'lucide-react';

const TYPE_LABEL: Record<string, string> = {
  ina:  'Ina ni Surat — Karakter Induk',
  anak: 'Anak ni Surat — Diakritik',
};

function GlyphCard({ glyph }: { glyph: GlyphInfo }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 rounded-xl border border-charcoal-border p-4',
        'bg-charcoal-light transition-all hover:border-crimson hover:bg-charcoal-muted',
        'cursor-default group',
      )}
    >
      <span className="batak-text text-4xl text-bone group-hover:text-gold transition-colors">
        {glyph.glyph}
      </span>
      <span className="font-mono text-sm font-semibold text-crimson">{glyph.latin}</span>
      <span className="text-center text-xs text-bone-dim leading-tight">{glyph.description}</span>
      <span className="rounded-md bg-charcoal px-2 py-0.5 font-mono text-[10px] text-bone-dim">
        {glyph.unicode_hex}
      </span>
    </div>
  );
}

export default function GlyphDictionary() {
  const [glyphs, setGlyphs] = useState<GlyphInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [query, setQuery]   = useState('');

  useEffect(() => {
    api.glyphs()
      .then(r => setGlyphs(r.glyphs))
      .catch(() => setError('Tidak dapat memuat data glyph. Pastikan backend berjalan.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center gap-2 text-bone-dim">
        <Loader2 size={20} className="animate-spin" />
        <span>Memuat kamus glyph…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <WifiOff size={36} className="text-crimson" />
        <p className="text-sm text-bone-muted">{error}</p>
      </div>
    );
  }

  const q = query.toLowerCase();
  const filtered = glyphs.filter(
    g => g.latin.toLowerCase().includes(q) || g.description.toLowerCase().includes(q),
  );

  const ina  = filtered.filter(g => g.type === 'ina');
  const anak = filtered.filter(g => g.type === 'anak');

  return (
    <div className="space-y-8">
      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-bone-dim" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Cari glyph… (contoh: ha, ba, pangolat)"
          className="w-full rounded-xl border border-charcoal-border bg-charcoal-light py-2.5 pl-9 pr-4
                     text-sm text-bone placeholder-bone-dim outline-none focus:border-crimson transition-colors"
        />
      </div>

      {/* Ina ni Surat */}
      {ina.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-bone-dim">
            {TYPE_LABEL['ina']}
            <span className="ml-2 rounded-full bg-crimson px-2 py-0.5 text-bone text-[10px]">
              {ina.length}
            </span>
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {ina.map(g => <GlyphCard key={g.unicode_hex} glyph={g} />)}
          </div>
        </section>
      )}

      {/* Anak ni Surat */}
      {anak.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-bone-dim">
            {TYPE_LABEL['anak']}
            <span className="ml-2 rounded-full bg-charcoal-muted px-2 py-0.5 text-bone-muted text-[10px]">
              {anak.length}
            </span>
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {anak.map(g => <GlyphCard key={g.unicode_hex} glyph={g} />)}
          </div>
        </section>
      )}

      {filtered.length === 0 && (
        <p className="py-8 text-center text-sm text-bone-dim">
          Tidak ditemukan glyph yang cocok dengan &quot;{query}&quot;.
        </p>
      )}
    </div>
  );
}
