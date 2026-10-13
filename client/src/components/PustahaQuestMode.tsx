'use client';

import React, { useState, useEffect } from 'react';
import {
  Scroll,
  Lock,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  BookOpen,
  Award,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import StrokeCanvas from './StrokeCanvas';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { sound } from '@/lib/audio';

interface QuestChapter {
  id: number;
  title: string;
  subtitle: string;
  lore: string;
  targetGlyph: string;
  latinSound: string;
  relicName: string;
}

const QUEST_CHAPTERS: QuestChapter[] = [
  {
    id: 1,
    title: 'Bab I: Pangurason',
    subtitle: 'Ritual Penyucian Awal',
    lore: 'Sebelum membuka tabir rahasia pustaha, sang datu membasuh jiwa dengan air pangurason di bawah pohon rindang. Tuliskan aksara A sebagai lambang mula segala napas kehidupan di tanah Batak.',
    targetGlyph: '\u1BC0',
    latinSound: 'A',
    relicName: 'Cawan Pangurason Purba',
  },
  {
    id: 2,
    title: 'Bab II: Poda ni Datu',
    subtitle: 'Ajaran Kebijaksanaan Sang Guru',
    lore: 'Di balik dedaunan pohon beringin keramat, tersimpan bisikan amanat leluhur. Pecahkan teka-teki aksara HA untuk membuka lembaran ajaran ilmu kebatinan kuno.',
    targetGlyph: '\u1BC2',
    latinSound: 'HA',
    relicName: 'Gulungan Poda Laklak',
  },
  {
    id: 3,
    title: 'Bab III: Bona ni Pasu-pasu',
    subtitle: 'Pangkal Segala Berkat',
    lore: 'Segala rezeki dan kemakmuran berakar dari restu semesta dan dalihan na tolu. Tuliskan aksara BA penanda awal berkat yang mengalir tak kunjung henti.',
    targetGlyph: '\u1BC5',
    latinSound: 'BA',
    relicName: 'Ulos Bintang Maratur Emas',
  },
  {
    id: 4,
    title: 'Bab IV: Panaek ni Harajaon',
    subtitle: 'Kejayaan Raja & Keadilan',
    lore: 'Pemimpin adil berdiri teguh di tengah rakyatnya. Goreskan aksara NA sebagai peneguh martabat kepemimpinan dan sumpah suci para leluhur.',
    targetGlyph: '\u1BC9',
    latinSound: 'NA',
    relicName: 'Pedang Piso Gaja Dompak',
  },
  {
    id: 5,
    title: 'Bab V: Tunggal Panaluan',
    subtitle: 'Pusaka Sakti Batak Pamungkas',
    lore: 'Pusaka tertinggi di tangan Datu Bolon, pemersatu tujuh penjuru angin dan penolak bala. Bentuk aksara TA dengan ketepatan sempurna untuk mengakhiri babad suci!',
    targetGlyph: '\u1BD6',
    latinSound: 'TA',
    relicName: 'Mahkota Datu Agung',
  },
];

interface PustahaQuestModeProps {
  onCanvasUpdate?: (canvas: HTMLCanvasElement) => void;
}

export default function PustahaQuestMode({ onCanvasUpdate }: PustahaQuestModeProps) {
  const [activeChapterId, setActiveChapterId] = useState(1);
  const [unlockedChapters, setUnlockedChapters] = useState<Record<number, boolean>>({ 1: true });
  const [sessionId, setSessionId] = useState('guest-quest');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let sid = localStorage.getItem('batakscript_session_id');
      if (!sid) {
        sid = 'session-' + Math.random().toString(36).substring(2, 11);
        localStorage.setItem('batakscript_session_id', sid);
      }
      setSessionId(sid);

      // Load quest progress from Go backend
      api.getQuestProgress(sid)
        .then((res) => {
          if (res?.chapters && res.chapters.length > 0) {
            const map: Record<number, boolean> = { 1: true };
            res.chapters.forEach((c) => {
              if (c.unlocked) {
                map[c.chapter_id] = true;
                if (c.chapter_id < 5) {
                  map[c.chapter_id + 1] = true;
                }
              }
            });
            setUnlockedChapters(map);
          }
        })
        .catch(() => {
          // Local fallback
          const saved = localStorage.getItem('batakscript_quest_unlocked');
          if (saved) {
            try {
              setUnlockedChapters(JSON.parse(saved));
            } catch {}
          }
        });
    }
  }, []);

  const handleChapterSuccess = async () => {
    sound.playEthnicSuccessChime();

    // Mark current unlocked and unlock next
    const updated = {
      ...unlockedChapters,
      [activeChapterId]: true,
      ...(activeChapterId < 5 ? { [activeChapterId + 1]: true } : {}),
    };
    setUnlockedChapters(updated);

    if (typeof window !== 'undefined') {
      localStorage.setItem('batakscript_quest_unlocked', JSON.stringify(updated));
    }

    // Save to Go backend
    try {
      await api.submitQuestProgress({
        session_id: sessionId,
        chapter_id: activeChapterId,
        accuracy: 85,
      });
    } catch (err) {
      console.warn('Gagal simpan progres babad:', err);
    }
  };

  const handleNextChapter = () => {
    if (activeChapterId < 5 && unlockedChapters[activeChapterId + 1]) {
      setActiveChapterId(activeChapterId + 1);
    }
  };

  const current = QUEST_CHAPTERS.find((c) => c.id === activeChapterId) || QUEST_CHAPTERS[0];
  const unlockedCount = Object.keys(unlockedChapters).length;

  return (
    <div className="space-y-6">
      {/* Quest Banner Header */}
      <div className="rounded-2xl border border-charcoal-border bg-[#141416] p-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-crimson/20 border border-crimson/40 text-crimson">
              <Scroll size={22} />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-crimson">
                Mode Petualangan Babad
              </span>
              <h2 className="text-lg font-bold text-bone">
                Kisah 5 Naskah Rahasia Datu Bolon
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto rounded-xl bg-charcoal px-3 py-1.5 border border-charcoal-border/60">
            <Award size={16} className="text-gold" />
            <span className="text-xs font-mono font-bold text-bone">
              {Math.min(5, unlockedCount)} / 5 Bab Terbuka
            </span>
          </div>
        </div>

        {/* Chapter Steps Row */}
        <div className="mt-4 grid grid-cols-5 gap-2 border-t border-charcoal-border/50 pt-3">
          {QUEST_CHAPTERS.map((chap) => {
            const isUnlocked = !!unlockedChapters[chap.id];
            const isActive = chap.id === activeChapterId;

            return (
              <button
                key={chap.id}
                disabled={!isUnlocked}
                onClick={() => {
                  sound.playClickSound();
                  setActiveChapterId(chap.id);
                }}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl p-2 transition-all',
                  isActive
                    ? 'bg-crimson/20 border border-crimson text-bone'
                    : isUnlocked
                    ? 'bg-charcoal hover:bg-charcoal-light border border-charcoal-border text-bone-muted'
                    : 'bg-charcoal/40 border border-charcoal-border/30 opacity-40 cursor-not-allowed text-bone-dim'
                )}
              >
                <div className="flex items-center gap-1 text-[11px] font-bold">
                  {isUnlocked ? (
                    <span className="batak-text text-sm text-gold">{chap.targetGlyph}</span>
                  ) : (
                    <Lock size={11} />
                  )}
                  <span>Bab {chap.id}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chapter Lore Scroll & Active Canvas */}
      <div className="space-y-4">
        {/* Ancient Manuscript Lore Box */}
        <div className="relative overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-br from-[#20140A] to-[#120E09] p-5 shadow-xl">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gold">
            <Sparkles size={14} />
            <span>{current.subtitle}</span>
          </div>
          <h3 className="mt-1 text-xl font-black text-bone">{current.title}</h3>
          <p className="mt-2 text-xs italic leading-relaxed text-[#D8C7A3]">
            &ldquo;{current.lore}&rdquo;
          </p>

          <div className="mt-4 flex items-center justify-between border-t border-gold/20 pt-3 text-xs">
            <span className="font-semibold text-bone-dim">
              Pusaka Terkunci: <strong className="text-gold">{current.relicName}</strong>
            </span>
            <span className="rounded-lg bg-gold/15 px-2.5 py-1 font-mono font-bold text-gold">
              Mantra Target: {current.latinSound} ({current.targetGlyph})
            </span>
          </div>
        </div>

        {/* Tracing Canvas with target glyph */}
        <StrokeCanvas
          lessonId={current.id * 100}
          targetGlyph={current.targetGlyph}
          latinSound={current.latinSound}
          glyphTitle={`Pecahkan Mantra ${current.title}`}
          onSuccess={handleChapterSuccess}
          onNextLesson={handleNextChapter}
          hasNextLesson={activeChapterId < 5 && !!unlockedChapters[activeChapterId + 1]}
          onCanvasUpdate={onCanvasUpdate}
        />
      </div>
    </div>
  );
}
