'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import PustahaScene from '@/components/PustahaScene';
import { InkType } from '@/components/StoneInkpot';
import { INA_NI_SURAT } from '@/components/PustahaBook';
import { evaluateUserStrokes, EvaluationResult, Point } from '@/lib/strokeEvaluator';
import { extractGlyphReferencePoints } from '@/lib/glyphReference';
import { sound } from '@/lib/audio';
import { Flame, ChevronLeft, ChevronRight, BookOpen, Layers, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

export default function HomePage() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [foldProgress, setFoldProgress] = useState(0.18);
  const [activeInk, setActiveInk] = useState<InkType>('charcoal');
  const [userStrokes, setUserStrokes] = useState<Point[][]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [streakCount, setStreakCount] = useState(0);
  const [sessionId, setSessionId] = useState('guest-session');
  const [isPorhalaanUnlocked, setIsPorhalaanUnlocked] = useState(false);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const activeGlyphInfo = INA_NI_SURAT[activeIdx];

  // Initialize session and streak from local storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let sid = localStorage.getItem('batakscript_session_id');
      if (!sid) {
        sid = 'session-' + Math.random().toString(36).substring(2, 11);
        localStorage.setItem('batakscript_session_id', sid);
      }
      setSessionId(sid);

      const savedStreak = localStorage.getItem('batakscript_streak');
      if (savedStreak) {
        setStreakCount(parseInt(savedStreak, 10) || 0);
      }

      const savedPorhalaan = localStorage.getItem('batakscript_porhalaan_unlocked');
      if (savedPorhalaan === 'true') {
        setIsPorhalaanUnlocked(true);
      }

      // Start gentle ambient lantern whisper
      sound.startLanternAmbiance();
    }
  }, []);

  const handleNextPage = () => {
    sound.playClickSound();
    setActiveIdx((prev) => (prev + 1) % INA_NI_SURAT.length);
    setUserStrokes([]);
    setEvaluation(null);
  };

  const handlePrevPage = () => {
    sound.playClickSound();
    setActiveIdx((prev) => (prev - 1 + INA_NI_SURAT.length) % INA_NI_SURAT.length);
    setUserStrokes([]);
    setEvaluation(null);
  };

  const handleToggleFold = () => {
    sound.playClickSound();
    setFoldProgress((prev) => (prev > 0.5 ? 0.15 : 0.85));
  };

  const handleClearStrokes = () => {
    setUserStrokes([]);
    setEvaluation(null);
  };

  // ── Diegetic DTW Evaluation Triggered by the 3D Bronze Bell ───────────────
  const handleValidateStrokes = useCallback(() => {
    if (userStrokes.length === 0) {
      setBannerNotice('Goreskan pena bambu terlebih dahulu sebelum membunyikan genta!');
      setTimeout(() => setBannerNotice(null), 3000);
      return;
    }

    setIsValidating(true);
    setBannerNotice('Mengevaluasi harmoni goresan dengan algoritma DTW…');

    // Extract reference points for target glyph
    const refPoints = extractGlyphReferencePoints(activeGlyphInfo.glyph, 360);

    // Scale UV points (range [0, 1]) to [0, 360] space
    const scaledStrokes: Point[][] = userStrokes.map((stroke) =>
      stroke.map((pt) => ({
        x: pt.x * 360,
        y: (1.0 - pt.y) * 360,
        t: pt.t,
      }))
    );

    const result = evaluateUserStrokes(scaledStrokes, refPoints, 360, 360);
    setEvaluation(result);
    setIsValidating(false);

    if (result.isPassed) {
      sound.playEthnicSuccessChime();
      sound.playHasapiPluck(4);
      setStreakCount((prev) => {
        const next = prev + 1;
        if (typeof window !== 'undefined') {
          localStorage.setItem('batakscript_streak', next.toString());
        }
        return next;
      });

      setBannerNotice(
        `✨ Berhasil! Skor DTW: ${result.score}% (Akurasi: ${result.accuracy}%, Arah: ${result.directionSimilarity}%)`
      );

      // Async backend progress sync
      api
        .submitProgress({
          session_id: sessionId,
          lesson_id: activeIdx + 1,
          accuracy: result.accuracy,
        })
        .catch(() => {});

      // Auto advance to next page after 2.8 seconds
      setTimeout(() => {
        startTransition(() => {
          setActiveIdx((prev) => (prev + 1) % INA_NI_SURAT.length);
          setUserStrokes([]);
          setEvaluation(null);
          setBannerNotice(null);
        });
      }, 2800);
    } else {
      setBannerNotice(
        `Goresan belum selaras (Skor: ${result.score}%). Perhatikan arah dan kelengkungan aksara.`
      );
      setTimeout(() => setBannerNotice(null), 3500);
    }
  }, [userStrokes, activeGlyphInfo, sessionId, activeIdx]);

  // ── Porhalaan Cosmic Wheel Puzzle Solved Handler ───────────────────────────
  const handlePorhalaanSolved = useCallback(() => {
    setIsPorhalaanUnlocked(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('batakscript_porhalaan_unlocked', 'true');
    }
    setBannerNotice(
      '🌌 Segel Babad Porhalaan Terbuka! Rahasia Konstelasi Batak Kuno telah tersingkap.'
    );
    setTimeout(() => setBannerNotice(null), 5000);
  }, []);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#070709] select-none text-bone font-sans">
      {/* ═══════════════════════════════════════════════════════════════════════
          1. FULL-SCREEN 3D DIEGETIC VIEWPORT (SURFACE PAINTING & RITUAL CHAMBER)
          ═══════════════════════════════════════════════════════════════════════ */}
      <PustahaScene
        pageIndex={activeIdx}
        foldProgress={foldProgress}
        activeInk={activeInk}
        onSelectInk={setActiveInk}
        onValidate={handleValidateStrokes}
        onClear={handleClearStrokes}
        isValidating={isValidating}
        onStrokesChange={setUserStrokes}
        onPorhalaanSolved={handlePorhalaanSolved}
        isPorhalaanUnlocked={isPorhalaanUnlocked}
      />

      {/* ═══════════════════════════════════════════════════════════════════════
          2. MINIMALIST DIEGETIC TOP HEADER (UNOBTRUSIVE AURA)
          ═══════════════════════════════════════════════════════════════════════ */}
      <header className="pointer-events-none fixed top-16 left-0 right-0 z-20 flex items-center justify-between px-6 py-2">
        {/* Left: Atmospheric Title */}
        <div className="flex items-center gap-3 rounded-2xl border border-charcoal-border/50 bg-[#121216]/80 px-4 py-2 shadow-2xl backdrop-blur-xl">
          <span className="batak-text text-2xl text-gold glyph-glow">ᯅ</span>
          <div>
            <h1 className="text-sm font-bold tracking-wide text-bone">
              BatakScript 3D
            </h1>
            <p className="text-[10px] tracking-wider text-bone-dim uppercase">
              Bilik Ritual Datu Bolon
            </p>
          </div>
        </div>

        {/* Center: Page Switcher & Accordion Fold Toggle */}
        <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-charcoal-border/50 bg-[#121216]/85 px-3 py-1.5 shadow-2xl backdrop-blur-xl">
          <button
            onClick={handlePrevPage}
            className="rounded-xl border border-charcoal-border/50 bg-charcoal p-1.5 text-bone-muted hover:border-gold hover:text-gold active:scale-95 transition-all"
            title="Lembaran Lalu (←)"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex items-center gap-2 px-2 select-none">
            <span className="batak-text text-xl text-gold leading-none">
              {activeGlyphInfo.glyph}
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-bone leading-tight">
                Surat {activeGlyphInfo.latin}
              </span>
              <span className="text-[10px] font-mono text-bone-dim leading-none">
                Bab {activeIdx + 1} / {INA_NI_SURAT.length}
              </span>
            </div>
          </div>

          <button
            onClick={handleNextPage}
            className="rounded-xl border border-charcoal-border/50 bg-charcoal p-1.5 text-bone-muted hover:border-gold hover:text-gold active:scale-95 transition-all"
            title="Lembaran Lanjut (→)"
          >
            <ChevronRight size={16} />
          </button>

          <div className="h-4 w-px bg-charcoal-border/60 mx-1" />

          {/* Fold / Unfold Toggle */}
          <button
            onClick={handleToggleFold}
            className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold transition-all active:scale-95 ${
              foldProgress > 0.5
                ? 'border-gold/50 bg-gold/15 text-gold'
                : 'border-charcoal-border/50 bg-charcoal text-bone-dim hover:text-bone'
            }`}
            title="Buka / Lipat Akordeon Pustaha"
          >
            <Layers size={13} />
            <span className="hidden sm:inline">
              {foldProgress > 0.5 ? 'Terlipat' : 'Terbuka'}
            </span>
          </button>
        </div>

        {/* Right: Active Ink & Streak Counter */}
        <div className="flex items-center gap-2.5">
          {/* Active Ink Diegetic Indicator */}
          <div className="flex items-center gap-2 rounded-2xl border border-charcoal-border/50 bg-[#121216]/80 px-3.5 py-2 backdrop-blur-xl">
            <span
              className={`h-3 w-3 rounded-full shadow-inner ${
                activeInk === 'gold'
                  ? 'bg-gradient-to-br from-amber-300 to-yellow-500 shadow-yellow-400/50'
                  : 'bg-gradient-to-br from-neutral-700 to-neutral-900 border border-neutral-600'
              }`}
            />
            <span className="text-xs font-bold text-bone">
              {activeInk === 'gold' ? 'Tinta Emas' : 'Kuas Arang'}
            </span>
          </div>

          {/* Streak Counter */}
          <div className="flex items-center gap-1.5 rounded-2xl border border-gold/40 bg-gold/10 px-3 py-2 backdrop-blur-xl">
            <Flame size={14} className="text-gold animate-bounce" />
            <span className="text-xs font-mono font-bold text-gold">
              {streakCount}
            </span>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════
          3. DIEGETIC BANNER / EVALUATION HUD OVERLAY
          ═══════════════════════════════════════════════════════════════════════ */}
      {bannerNotice && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-30 animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="flex items-center gap-2.5 rounded-2xl border border-gold/40 bg-[#161412]/95 px-5 py-2.5 shadow-2xl backdrop-blur-2xl text-sm font-medium text-bone">
            <Sparkles size={16} className="text-gold shrink-0 animate-spin-slow" />
            <span>{bannerNotice}</span>
          </div>
        </div>
      )}

      {/* DTW Evaluation Result Card (When ringing bell) */}
      {evaluation && (
        <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-30 animate-in fade-in slide-in-from-bottom-3 duration-300 max-w-[92vw]">
          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-charcoal-border/80 bg-[#121216]/95 px-5 py-3 shadow-2xl backdrop-blur-2xl">
            <div className="flex items-center gap-2">
              {evaluation.isPassed ? (
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle size={18} className="text-amber-400 shrink-0" />
              )}
              <div className="flex flex-col">
                <span className="text-xs font-bold text-bone">
                  {evaluation.isPassed ? 'Validasi Sempurna' : 'Perlu Penyesuaian'}
                </span>
                <span className="text-[11px] text-bone-dim">
                  Skor DTW: <span className="font-bold text-gold">{evaluation.score}%</span> · Deviasi: {evaluation.dAvg}px
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-mono border-l border-charcoal-border/60 pl-3 text-bone-muted">
              <div>Akurasi Bentuk: <span className="text-bone">{evaluation.accuracy}%</span></div>
              <div>Vektor Arah: <span className="text-bone">{evaluation.directionSimilarity}%</span></div>
              <div>Lengkungan: <span className="text-bone">{evaluation.curvatureSimilarity}%</span></div>
            </div>

            {!evaluation.isPassed && (
              <button
                onClick={handleClearStrokes}
                className="rounded-xl border border-crimson/50 bg-crimson/20 px-3 py-1 text-xs font-bold text-rose-300 hover:bg-crimson/30 transition-all active:scale-95"
              >
                Hapus &amp; Ulangi
              </button>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          4. DIEGETIC ENVIRONMENT GUIDE LEGEND (FOOTER BAR)
          ═══════════════════════════════════════════════════════════════════════ */}
      <footer className="pointer-events-none fixed bottom-3 left-0 right-0 z-10 flex items-center justify-center">
        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-5 rounded-full border border-charcoal-border/40 bg-[#0E0E12]/80 px-5 py-1.5 backdrop-blur-md text-[11px] text-bone-dim select-none">
          <span className="flex items-center gap-1.5">
            <span className="text-amber-400">✒️</span>
            <span>Gores di lembaran tengah</span>
          </span>
          <span className="text-charcoal-border">•</span>
          <span className="flex items-center gap-1.5">
            <span className="text-amber-400">🪔</span>
            <span>Geser lentera minyak</span>
          </span>
          <span className="text-charcoal-border">•</span>
          <span className="flex items-center gap-1.5">
            <span className="text-amber-400">🥣</span>
            <span>Klik cawan batu tinta</span>
          </span>
          <span className="text-charcoal-border">•</span>
          <span className="flex items-center gap-1.5">
            <span className="text-amber-400">🔔</span>
            <span>Bunyikan genta untuk validasi DTW</span>
          </span>
          <span className="text-charcoal-border">•</span>
          <span className="flex items-center gap-1.5">
            <span className="text-amber-400">🌌</span>
            <span>Putar Kalender Porhalaan di panel 3</span>
          </span>
        </div>
      </footer>
    </main>
  );
}
