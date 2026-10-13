import { Library } from 'lucide-react';
import GlyphDictionary from '@/components/GlyphDictionary';

export const metadata = {
  title: 'Kamus Glyph — BatakScript 3D',
  description: 'Kamus lengkap 19 Ina ni Surat dan 6 Anak ni Surat dalam Surat Batak Toba.',
};

export default function GlyphsPage() {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="border-b border-charcoal-border pb-6">
        <div className="flex items-center gap-3">
          <Library size={24} className="text-crimson" />
          <div>
            <h1 className="text-2xl font-bold text-bone">Kamus Glyph</h1>
            <p className="text-sm text-bone-muted">
              Seluruh karakter Surat Batak Toba — Ina ni Surat &amp; Anak ni Surat
            </p>
          </div>
        </div>
      </div>

      {/* Dictionary */}
      <GlyphDictionary />
    </div>
  );
}
