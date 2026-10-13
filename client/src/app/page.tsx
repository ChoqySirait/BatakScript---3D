import { Sparkles } from 'lucide-react';
import TransliterationSandbox from '@/components/TransliterationSandbox';

export default function HomePage() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="text-center space-y-4 pt-4">
        <p className="batak-text text-7xl text-gold glyph-glow select-none tracking-widest">
          ᯅᯖᯂ᯲ᯘᯀ᯲ᯒᯘ᯲
        </p>
        <h1 className="text-3xl font-bold text-bone">
          Pelajari{' '}
          <span className="text-crimson">Surat Batak Toba</span>
        </h1>
        <p className="mx-auto max-w-xl text-sm text-bone-muted leading-relaxed">
          Transliterasi teks Latin ke aksara Batak Toba secara langsung dengan mesin
          linguistik presisi. Aktifkan <strong className="text-bone">X-Ray Mode</strong> untuk
          membedah anatomi setiap karakter.
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-xs text-bone-dim">
          <span className="flex items-center gap-1"><Sparkles size={12} className="text-crimson" /> 19 Ina ni Surat</span>
          <span className="flex items-center gap-1"><Sparkles size={12} className="text-crimson" /> 6 Anak ni Surat</span>
          <span className="flex items-center gap-1"><Sparkles size={12} className="text-crimson" /> X-Ray Anatomy Inspector</span>
          <span className="flex items-center gap-1"><Sparkles size={12} className="text-crimson" /> Live Transliterasi</span>
        </div>
      </div>

      {/* Main sandbox */}
      <TransliterationSandbox />
    </div>
  );
}
