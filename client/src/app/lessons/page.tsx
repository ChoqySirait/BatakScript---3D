import { BookOpen } from 'lucide-react';

export const metadata = {
  title: 'Pelajaran — BatakScript 3D',
};

export default function LessonsPage() {
  return (
    <div className="space-y-8">
      <div className="border-b border-charcoal-border pb-6">
        <div className="flex items-center gap-3">
          <BookOpen size={24} className="text-crimson" />
          <div>
            <h1 className="text-2xl font-bold text-bone">Pelajaran Interaktif</h1>
            <p className="text-sm text-bone-muted">
              Modul canvas tracing dan kuis akan tersedia di Fase 5 &amp; 6.
            </p>
          </div>
        </div>
      </div>

      {/* Placeholder cards for 19 lessons */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 19 }, (_, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-2 rounded-xl border border-charcoal-border
                       bg-charcoal-light p-4 opacity-60 cursor-not-allowed"
          >
            <span className="text-xs text-bone-dim">Pelajaran {i + 1}</span>
            <div className="h-10 w-10 rounded-lg bg-charcoal-muted" />
            <span className="text-xs text-bone-dim">🔒 Segera Hadir</span>
          </div>
        ))}
      </div>
    </div>
  );
}

