'use client';

import { useState, useEffect } from 'react';
import { BookOpen, CheckCircle2, Lock, Sparkles, Award } from 'lucide-react';
import StrokeCanvas from '@/components/StrokeCanvas';
import { INA_NI_SURAT } from '@/components/PustahaBook';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function LessonsPage() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<Record<number, number>>({});
  const [sessionId, setSessionId] = useState<string>('guest-session');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let sid = localStorage.getItem('batakscript_session_id');
      if (!sid) {
        sid = 'session-' + Math.random().toString(36).substring(2, 11);
        localStorage.setItem('batakscript_session_id', sid);
      }
      setSessionId(sid);

      // Load progress from backend
      api.getUserProgress(sid)
        .then((res) => {
          if (res?.progress) {
            const map: Record<number, number> = {};
            res.progress.forEach((p) => {
              if (p.completed) {
                map[p.lesson_id] = p.accuracy;
              }
            });
            setCompletedLessons(map);
          }
        })
        .catch(() => {
          // If backend not responding, load from local storage
          const stored = localStorage.getItem('batakscript_completed');
          if (stored) {
            try {
              setCompletedLessons(JSON.parse(stored));
            } catch {}
          }
        });
    }
  }, []);

  const handleLessonSuccess = (lessonId: number) => {
    setCompletedLessons((prev) => {
      const updated = { ...prev, [lessonId]: 100 };
      if (typeof window !== 'undefined') {
        localStorage.setItem('batakscript_completed', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const handleNextLesson = () => {
    if (selectedIdx < INA_NI_SURAT.length - 1) {
      setSelectedIdx(selectedIdx + 1);
    }
  };

  const activeLesson = INA_NI_SURAT[selectedIdx];
  const activeLessonId = selectedIdx + 1;
  const completedCount = Object.keys(completedLessons).length;
  const progressPercent = Math.round((completedCount / INA_NI_SURAT.length) * 100);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-charcoal-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <BookOpen size={28} className="text-crimson" />
          <div>
            <h1 className="text-2xl font-bold text-bone">Kurikulum Ina ni Surat</h1>
            <p className="text-sm text-bone-muted">
              Kuasai 19 karakter induk Surat Batak Toba melalui latihan kaligrafi Euclidean.
            </p>
          </div>
        </div>

        {/* Overall Progress Meter */}
        <div className="flex items-center gap-3 rounded-2xl border border-charcoal-border bg-charcoal-light px-4 py-2.5">
          <Award size={22} className="text-gold" />
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-bone-dim">Kemajuan Belajar</span>
              <span className="font-mono font-bold text-gold">{progressPercent}%</span>
            </div>
            <div className="mt-1 h-2 w-32 overflow-hidden rounded-full bg-charcoal">
              <div
                className="h-full bg-gradient-to-r from-crimson to-gold transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Lesson Navigation List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-bone-dim">
            Daftar Modul Pembelajaran ({INA_NI_SURAT.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 max-h-[640px] overflow-y-auto pr-1">
            {INA_NI_SURAT.map((item, idx) => {
              const id = idx + 1;
              const isCompleted = !!completedLessons[id];
              // First lesson always unlocked; others unlocked if previous is completed or already finished
              const isUnlocked = idx === 0 || !!completedLessons[idx] || isCompleted;
              const isSelected = idx === selectedIdx;

              return (
                <button
                  key={id}
                  disabled={!isUnlocked}
                  onClick={() => setSelectedIdx(idx)}
                  className={cn(
                    'flex items-center justify-between rounded-xl border p-3 text-left transition-all',
                    isSelected
                      ? 'border-crimson bg-charcoal-light shadow-md'
                      : isUnlocked
                      ? 'border-charcoal-border bg-charcoal hover:border-charcoal-muted hover:bg-charcoal-light'
                      : 'border-charcoal-border/30 bg-charcoal/40 opacity-50 cursor-not-allowed',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="batak-text text-2xl text-gold">{item.glyph}</span>
                    <div>
                      <p className="text-sm font-bold text-bone">
                        Aksara {item.latin}
                      </p>
                      <p className="text-xs text-bone-dim font-mono">
                        {item.sound} · Bab {id}
                      </p>
                    </div>
                  </div>

                  <div>
                    {isCompleted ? (
                      <span className="flex items-center gap-1 rounded-full bg-gold/10 px-2 py-0.5 text-[11px] font-bold text-gold">
                        <CheckCircle2 size={12} />
                        Lulus
                      </span>
                    ) : isUnlocked ? (
                      <span className="text-[11px] text-bone-dim">Terbuka</span>
                    ) : (
                      <Lock size={14} className="text-bone-dim" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Active Lesson Canvas & Details (7 cols) */}
        <div className="lg:col-span-7">
          <StrokeCanvas
            lessonId={activeLessonId}
            targetGlyph={activeLesson.glyph}
            latinSound={activeLesson.latin}
            glyphTitle={`Modul ${activeLessonId}: Aksara ${activeLesson.latin} (${activeLesson.glyph})`}
            onSuccess={() => handleLessonSuccess(activeLessonId)}
            onNextLesson={handleNextLesson}
            hasNextLesson={selectedIdx < INA_NI_SURAT.length - 1}
          />
        </div>
      </div>
    </div>
  );
}
