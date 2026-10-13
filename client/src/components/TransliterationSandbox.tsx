'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Sparkles,
  Eye,
  EyeOff,
  Copy,
  Check,
  RotateCcw,
  WifiOff,
  Loader2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { TransliterationResult } from '@/types';
import { cn } from '@/lib/utils';
import XRayGlyph from './XRayGlyph';

const EXAMPLES = [
  'horas batak toba',
  'marhusip',
  'situmorang',
  'dalihan na tolu',
  'ompung',
];

export default function TransliterationSandbox() {
  const [input, setInput]   = useState('');
  const [result, setResult] = useState<TransliterationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [xray, setXray]     = useState(true);
  const [copied, setCopied] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const transliterate = useCallback(async (text: string) => {
    if (!text.trim()) { setResult(null); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await api.transliterate(text);
      setResult(data);
    } catch {
      setError('Tidak dapat terhubung ke backend. Pastikan server Go berjalan di port 8080.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (value: string) => {
    setInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => transliterate(value), 400);
  };

  const handleExample = (ex: string) => {
    setInput(ex);
    transliterate(ex);
  };

  const handleCopy = async () => {
    if (!result?.result) return;
    await navigator.clipboard.writeText(result.result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleReset = () => {
    setInput('');
    setResult(null);
    setError(null);
  };

  return (
    <section className="mx-auto max-w-3xl space-y-6">

      {/* ── Input panel ───────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-charcoal-border bg-charcoal-light p-5 shadow-xl">
        <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-bone-dim">
          Teks Latin
        </label>
        <textarea
          value={input}
          onChange={e => handleChange(e.target.value)}
          placeholder="Ketik teks Latin di sini…  contoh: horas batak toba"
          rows={3}
          className={cn(
            'w-full resize-none rounded-xl border bg-charcoal px-4 py-3',
            'text-base text-bone placeholder-bone-dim outline-none',
            'transition-colors focus:border-crimson',
            error ? 'border-crimson' : 'border-charcoal-border',
          )}
        />

        {/* Action bar */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          {/* Example chips */}
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLES.map(ex => (
              <button
                key={ex}
                onClick={() => handleExample(ex)}
                className="rounded-full border border-charcoal-border px-2.5 py-0.5 text-xs text-bone-muted
                           hover:border-crimson hover:text-bone transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>

          {/* Right buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setXray(v => !v)}
              title={xray ? 'Matikan X-Ray' : 'Aktifkan X-Ray'}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                xray
                  ? 'bg-crimson text-bone'
                  : 'border border-charcoal-border text-bone-muted hover:text-bone',
              )}
            >
              {xray ? <Eye size={13} /> : <EyeOff size={13} />}
              X-Ray
            </button>
            <button
              onClick={handleReset}
              title="Reset"
              className="rounded-lg border border-charcoal-border px-2.5 py-1.5 text-bone-muted
                         hover:text-bone transition-colors"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Result panel ──────────────────────────────────────────────── */}
      <div
        className={cn(
          'min-h-[120px] rounded-2xl border bg-charcoal-light p-5 shadow-xl transition-all',
          result ? 'border-charcoal-border' : 'border-charcoal-border/40',
        )}
      >
        {/* Loading */}
        {loading && (
          <div className="flex h-20 items-center justify-center gap-2 text-bone-dim">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Mentransliterasi…</span>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <WifiOff size={28} className="text-crimson" />
            <p className="text-sm text-bone-muted">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && !result && (
          <div className="flex h-20 items-center justify-center">
            <p className="batak-text text-4xl text-charcoal-muted select-none">ᯅᯖᯂ᯲</p>
          </div>
        )}

        {/* Result */}
        {!loading && !error && result && (
          <div className="space-y-4">
            {/* Big Batak output */}
            <div className="relative">
              <p
                className="batak-text text-center text-5xl leading-loose text-bone glyph-glow"
                dir="ltr"
              >
                {result.result}
              </p>
              {/* Copy button */}
              <button
                onClick={handleCopy}
                title="Salin ke clipboard"
                className="absolute right-0 top-0 rounded-lg p-1.5 text-bone-dim hover:text-bone transition-colors"
              >
                {copied ? <Check size={16} className="text-gold" /> : <Copy size={16} />}
              </button>
            </div>

            {/* Divider */}
            <hr className="border-charcoal-border" />

            {/* X-Ray token cards */}
            {xray && result.tokens && result.tokens.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-bone-dim">
                  <Sparkles size={11} className="text-crimson" />
                  X-Ray Inspector — arahkan kursor ke karakter
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.tokens.map((token, i) => (
                    <XRayGlyph key={i} token={token} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
