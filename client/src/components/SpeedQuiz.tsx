'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Timer,
  Flame,
  Award,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowRight,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { sound } from '@/lib/audio';
import { api } from '@/lib/api';
import LeaderboardModal from './LeaderboardModal';

interface QuizQuestion {
  id: number;
  question: string;
  subtext?: string;
  glyphDisplay?: string;
  options: { label: string; glyph?: string }[];
  correctAnswer: number;
  explanation: string;
  category: 'Ina ni Surat' | 'Anak ni Surat' | 'Kaidah';
}

const QUIZ_BANK: QuizQuestion[] = [
  {
    id: 1,
    question: 'Aksara manakah yang melambangkan karakter induk "HA"?',
    options: [
      { label: 'ᯀ (A)', glyph: 'ᯀ' },
      { label: 'ᯂ (HA)', glyph: 'ᯂ' },
      { label: 'ᯅ (BA)', glyph: 'ᯅ' },
      { label: 'ᯇ (PA)', glyph: 'ᯇ' },
    ],
    correctAnswer: 1,
    explanation: 'ᯂ (U+1BC2) adalah Ina ni Surat untuk fonem "ha" dengan vokal inheren /a/.',
    category: 'Ina ni Surat',
  },
  {
    id: 2,
    question: 'Aksara berikut ini dibaca sebagai bunyi apa?',
    glyphDisplay: 'ᯔ',
    options: [
      { label: 'NA' },
      { label: 'MA' },
      { label: 'RA' },
      { label: 'TA' },
    ],
    correctAnswer: 1,
    explanation: 'ᯔ (U+1BD4) adalah karakter induk MA.',
    category: 'Ina ni Surat',
  },
  {
    id: 3,
    question: 'Apa nama diakritik (Anak ni Surat) yang mengubah vokal menjadi /i/?',
    options: [
      { label: 'Sihorhor (/u/)' },
      { label: 'Hatalingan (/o/)' },
      { label: 'Haborotan (/i/)' },
      { label: 'Hatadingan (/e/)' },
    ],
    correctAnswer: 2,
    explanation: 'Haborotan (ᯪ - U+1BEA) terletak di atas konsonan untuk menghasilkan vokal /i/.',
    category: 'Anak ni Surat',
  },
  {
    id: 4,
    question: 'Aksara manakah yang merupakan karakter induk "BA"?',
    options: [
      { label: 'ᯅ (BA)', glyph: 'ᯅ' },
      { label: 'ᯑ (DA)', glyph: 'ᯑ' },
      { label: 'ᯎ (GA)', glyph: 'ᯎ' },
      { label: 'ᯐ (JA)', glyph: 'ᯐ' },
    ],
    correctAnswer: 0,
    explanation: 'ᯅ (U+1BC5) adalah Ina ni Surat untuk fonem "ba".',
    category: 'Ina ni Surat',
  },
  {
    id: 5,
    question: 'Diakritik "Pangolat" (᯲) berfungsi untuk...',
    options: [
      { label: 'Menambah bunyi sengau /ng/' },
      { label: 'Mematikan vokal /a/ pada akhir suku kata' },
      { label: 'Mengubah vokal menjadi /o/' },
      { label: 'Menandai vokal mandiri di awal kata' },
    ],
    correctAnswer: 1,
    explanation: 'Pangolat (᯲ - U+1BF2) adalah virama yang mematikan vokal inheren /a/ pada konsonan akhir.',
    category: 'Anak ni Surat',
  },
  {
    id: 6,
    question: 'Aksara berikut ini dibaca sebagai bunyi apa?',
    glyphDisplay: 'ᯖ',
    options: [
      { label: 'SA' },
      { label: 'RA' },
      { label: 'TA' },
      { label: 'DA' },
    ],
    correctAnswer: 2,
    explanation: 'ᯖ (U+1BD6) adalah karakter induk TA.',
    category: 'Ina ni Surat',
  },
  {
    id: 7,
    question: 'Diakritik "Hamisaran" (ᯰ) menghasilkan bunyi konsonan penutup apa?',
    options: [
      { label: 'Konsonan /r/' },
      { label: 'Konsonan /s/' },
      { label: 'Konsonan sengau /ng/' },
      { label: 'Konsonan /m/' },
    ],
    correctAnswer: 2,
    explanation: 'Hamisaran (ᯰ - U+1BF0) diletakkan di atas aksara untuk menandai bunyi sengau /ng/ di akhir suku kata.',
    category: 'Anak ni Surat',
  },
  {
    id: 8,
    question: 'Aksara manakah yang merupakan Vokal Mandiri "I" di awal kata?',
    options: [
      { label: 'ᯀ (A)', glyph: 'ᯀ' },
      { label: 'ᯤ (I)', glyph: 'ᯤ' },
      { label: 'ᯥ (U)', glyph: 'ᯥ' },
      { label: 'ᯂ (HA)', glyph: 'ᯂ' },
    ],
    correctAnswer: 1,
    explanation: 'ᯤ (U+1BE4) adalah vokal mandiri I yang digunakan khusus di awal kata tanpa konsonan pangkal.',
    category: 'Ina ni Surat',
  },
  {
    id: 9,
    question: 'Bagaimana penulisan suku kata "ho" dalam kaidah Surat Batak Toba?',
    options: [
      { label: 'ᯂᯪ (ha + haborotan)' },
      { label: 'ᯂᯮ (ha + sihorhor)' },
      { label: 'ᯂᯫ (ha + hatalingan)' },
      { label: 'ᯂ᯲ (ha + pangolat)' },
    ],
    correctAnswer: 2,
    explanation: 'Suku kata "ho" ditulis dengan karakter induk HA (ᯂ) ditambah diakritik Hatalingan (ᯫ).',
    category: 'Kaidah',
  },
  {
    id: 10,
    question: 'Aksara berikut ini melambangkan bunyi konsonan apa?',
    glyphDisplay: 'ᯝ',
    options: [
      { label: 'NGA' },
      { label: 'NYA' },
      { label: 'GA' },
      { label: 'WA' },
    ],
    correctAnswer: 0,
    explanation: 'ᯝ (U+1BDD) adalah karakter induk NGA.',
    category: 'Ina ni Surat',
  },
];

const QUESTION_TIME = 15; // 15 seconds per question

export default function SpeedQuiz() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [submittedRank, setSubmittedRank] = useState<number | null>(null);
  const [submittingLb, setSubmittingLb] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentQ = QUIZ_BANK[currentIdx];

  // Timer countdown
  useEffect(() => {
    if (!isStarted || isFinished || isAnswered) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isStarted, isFinished, isAnswered, currentIdx]);

  const handleTimeout = () => {
    setIsAnswered(true);
    setSelectedAnswer(-1); // Timeout indicator
    setStreak(0);
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setSelectedAnswer(idx);
    setIsAnswered(true);

    const isCorrect = idx === currentQ.correctAnswer;
    if (isCorrect) {
      sound.playClickSound();
      const basePoints = 100;
      const timeBonus = Math.round((timeLeft / QUESTION_TIME) * 100);
      const streakBonus = (streak + 1) * 25;
      const roundScore = basePoints + timeBonus + streakBonus;

      setScore((prev) => prev + roundScore);
      setCorrectCount((prev) => prev + 1);
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      if (nextStreak > maxStreak) {
        setMaxStreak(nextStreak);
      }
    } else {
      sound.playClickSound();
      setStreak(0);
    }
  };

  const handleNextQuestion = () => {
    sound.playClickSound();
    if (currentIdx + 1 < QUIZ_BANK.length) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setTimeLeft(QUESTION_TIME);
    } else {
      sound.playEthnicSuccessChime();
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    sound.playClickSound();
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setTimeLeft(QUESTION_TIME);
    setStreak(0);
    setMaxStreak(0);
    setScore(0);
    setCorrectCount(0);
    setIsFinished(false);
    setIsStarted(true);
  };

  // Grade calculation
  const getGrade = (pts: number) => {
    if (pts >= 2200) return { rank: 'S', title: 'Datu Guru Agung', color: 'text-gold' };
    if (pts >= 1600) return { rank: 'A', title: 'Cendekia Batak', color: 'text-crimson' };
    if (pts >= 1100) return { rank: 'B', title: 'Pembelajar Rajin', color: 'text-bone' };
    return { rank: 'C', title: 'Pemula Bersemangat', color: 'text-bone-muted' };
  };

  // Start Screen
  if (!isStarted) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-charcoal-border bg-charcoal-light p-8 text-center shadow-2xl space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-crimson/10 text-crimson">
          <Flame size={40} className="animate-pulse" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-bone">Tantangan Kuis Kecepatan</h2>
          <p className="mt-2 text-sm text-bone-muted">
            Uji refleks dan pemahamanmu terhadap Surat Batak Toba dalam 10 soal kilat.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 rounded-xl border border-charcoal-border bg-charcoal p-4 text-xs">
          <div>
            <p className="text-bone-dim">Jumlah Soal</p>
            <p className="text-base font-bold text-bone">10 Soal</p>
          </div>
          <div>
            <p className="text-bone-dim">Waktu / Soal</p>
            <p className="text-base font-bold text-gold">15 Detik</p>
          </div>
          <div>
            <p className="text-bone-dim">Sistem Streak</p>
            <p className="text-base font-bold text-crimson">+Combo Poin</p>
          </div>
        </div>

        <button
          onClick={() => setIsStarted(true)}
          className="w-full rounded-xl bg-crimson py-3 text-base font-bold text-bone shadow-lg shadow-crimson/30 hover:bg-crimson-glow active:scale-98 transition-all"
        >
          Mulai Tantangan Sekarang
        </button>
      </div>
    );
  }

  // Summary / Result Screen
  if (isFinished) {
    const grade = getGrade(score);
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-charcoal-border bg-charcoal-light p-8 text-center shadow-2xl space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gold/10 text-gold">
          <Trophy size={40} />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-bone-dim">
            Hasil Akhir Tantangan
          </span>
          <div className={cn('text-6xl font-black mt-1', grade.color)}>
            {grade.rank}
          </div>
          <p className="text-lg font-bold text-bone mt-1">{grade.title}</p>
        </div>

        <div className="grid grid-cols-3 gap-4 rounded-xl border border-charcoal-border bg-charcoal p-4">
          <div>
            <p className="text-xs text-bone-dim">Total Skor</p>
            <p className="text-xl font-black font-mono text-gold">{score}</p>
          </div>
          <div>
            <p className="text-xs text-bone-dim">Benar</p>
            <p className="text-xl font-black font-mono text-bone">
              {correctCount} / {QUIZ_BANK.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-bone-dim">Max Streak</p>
            <p className="text-xl font-black font-mono text-crimson">
              {maxStreak} 🔥
            </p>
          </div>
        </div>

        {/* Leaderboard Submission Box */}
        <div className="rounded-xl border border-charcoal-border bg-charcoal p-4 text-left space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-bone-dim">
              Catat Namamu di Papan Peringkat
            </span>
            <button
              onClick={() => {
                sound.playClickSound();
                setShowLeaderboard(true);
              }}
              className="text-xs text-gold hover:underline font-semibold"
            >
              Lihat Ranking 🏆
            </button>
          </div>

          {submittedRank ? (
            <div className="flex items-center gap-2 rounded-lg bg-gold/15 p-2.5 text-xs font-bold text-gold">
              <Trophy size={16} />
              <span>Terdaftar! Posisi kamu di Papan Peringkat: Peringkat #{submittedRank}</span>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ketik namamu / alias (contoh: Datu Muda)"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={30}
                className="flex-1 rounded-xl border border-charcoal-border bg-charcoal-light px-3 py-2 text-xs text-bone placeholder-bone-dim outline-none focus:border-gold"
              />
              <button
                disabled={submittingLb || playerName.trim().length < 2}
                onClick={async () => {
                  sound.playClickSound();
                  setSubmittingLb(true);
                  try {
                    const acc = Math.round((correctCount / QUIZ_BANK.length) * 100);
                    const res = await api.submitLeaderboard({
                      player_name: playerName.trim(),
                      score,
                      accuracy: acc,
                      max_streak: maxStreak,
                    });
                    if (res?.rank) {
                      setSubmittedRank(res.rank);
                      sound.playEthnicSuccessChime();
                    }
                  } catch (err) {
                    console.warn(err);
                  } finally {
                    setSubmittingLb(false);
                  }
                }}
                className="rounded-xl bg-gold px-4 py-2 text-xs font-bold text-charcoal hover:bg-gold-dim disabled:opacity-40 transition-all"
              >
                {submittingLb ? 'Menyimpan…' : 'Kirim Skor'}
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleRestart}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-crimson py-3 text-sm font-bold text-bone shadow-lg shadow-crimson/30 hover:bg-crimson-glow transition-all"
          >
            <RotateCcw size={16} />
            Ulangi Kuis
          </button>
          <button
            onClick={() => {
              sound.playClickSound();
              setShowLeaderboard(true);
            }}
            className="flex items-center justify-center gap-2 rounded-xl border border-charcoal-border bg-charcoal px-5 py-3 text-sm font-semibold text-bone hover:border-gold hover:text-gold transition-all"
          >
            <Trophy size={16} className="text-gold" />
            Papan Peringkat
          </button>
        </div>

        <LeaderboardModal
          isOpen={showLeaderboard}
          onClose={() => setShowLeaderboard(false)}
          highlightPlayer={playerName}
        />
      </div>
    );
  }

  const timerRatio = timeLeft / QUESTION_TIME;

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-charcoal-border bg-charcoal-light p-6 shadow-2xl space-y-6">
      {/* Top Status Bar: Progress, Timer, Streak, Score */}
      <div className="flex items-center justify-between gap-4">
        {/* Question Counter */}
        <div className="text-xs font-mono font-bold text-bone-dim">
          SOAL {currentIdx + 1} / {QUIZ_BANK.length}
        </div>

        {/* Streak Indicator */}
        {streak > 1 && (
          <div className="flex items-center gap-1 rounded-full bg-crimson/20 border border-crimson/40 px-3 py-1 text-xs font-bold text-crimson animate-bounce">
            <Flame size={14} />
            <span>STREAK x{streak}</span>
          </div>
        )}

        {/* Score Display */}
        <div className="text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-bone-dim">
            Skor
          </span>
          <p className="text-lg font-black font-mono text-gold leading-none">
            {score}
          </p>
        </div>
      </div>

      {/* Countdown Timer Bar */}
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-charcoal border border-charcoal-border">
        <div
          className={cn(
            'h-full transition-all duration-1000 ease-linear rounded-full',
            timeLeft <= 4
              ? 'bg-crimson animate-pulse'
              : timeLeft <= 8
              ? 'bg-gold'
              : 'bg-emerald-500',
          )}
          style={{ width: `${timerRatio * 100}%` }}
        />
      </div>

      {/* Timer Text Indicator */}
      <div className="flex items-center justify-between text-xs text-bone-dim">
        <span className="rounded-md bg-charcoal px-2 py-0.5 uppercase tracking-wider font-semibold">
          {currentQ.category}
        </span>
        <div className="flex items-center gap-1 font-mono font-bold">
          <Timer size={14} className={timeLeft <= 4 ? 'text-crimson' : 'text-bone-muted'} />
          <span className={timeLeft <= 4 ? 'text-crimson font-black' : 'text-bone'}>
            {timeLeft}s
          </span>
        </div>
      </div>

      {/* Question Card */}
      <div className="text-center space-y-4 py-2">
        {currentQ.glyphDisplay && (
          <div className="batak-text text-7xl text-gold glyph-glow select-none">
            {currentQ.glyphDisplay}
          </div>
        )}
        <h3 className="text-xl font-bold text-bone leading-snug">
          {currentQ.question}
        </h3>
      </div>

      {/* Multiple Choice Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {currentQ.options.map((opt, idx) => {
          const isSelected = selectedAnswer === idx;
          const isCorrect = idx === currentQ.correctAnswer;
          const showSuccess = isAnswered && isCorrect;
          const showFailure = isAnswered && isSelected && !isCorrect;

          return (
            <button
              key={idx}
              disabled={isAnswered}
              onClick={() => handleSelectOption(idx)}
              className={cn(
                'group flex items-center justify-between rounded-xl border p-4 text-left transition-all',
                showSuccess
                  ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                  : showFailure
                  ? 'border-crimson bg-crimson/20 text-rose-300'
                  : isAnswered
                  ? 'border-charcoal-border bg-charcoal opacity-40 cursor-not-allowed'
                  : 'border-charcoal-border bg-charcoal hover:border-crimson hover:bg-charcoal-muted active:scale-98',
              )}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-charcoal-light font-mono text-xs font-bold text-bone-dim group-hover:text-gold">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="text-sm font-semibold text-bone">
                  {opt.label}
                </span>
              </div>

              {showSuccess && <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />}
              {showFailure && <XCircle size={18} className="text-crimson shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Explanation Banner & Next Button */}
      {isAnswered && (
        <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div
            className={cn(
              'rounded-xl border p-4 text-xs',
              selectedAnswer === currentQ.correctAnswer
                ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-200'
                : 'border-crimson/30 bg-crimson/10 text-rose-200',
            )}
          >
            <div className="font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
              {selectedAnswer === currentQ.correctAnswer ? (
                <>
                  <Sparkles size={14} className="text-emerald-400" />
                  Jawaban Benar!
                </>
              ) : selectedAnswer === -1 ? (
                <>
                  <Timer size={14} className="text-crimson" />
                  Waktu Habis!
                </>
              ) : (
                <>
                  <XCircle size={14} className="text-crimson" />
                  Kurang Tepat!
                </>
              )}
            </div>
            <p className="text-bone-muted leading-relaxed">{currentQ.explanation}</p>
          </div>

          <button
            onClick={handleNextQuestion}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-crimson py-3 text-sm font-bold text-bone shadow-lg shadow-crimson/30 hover:bg-crimson-glow transition-all"
          >
            {currentIdx + 1 < QUIZ_BANK.length ? (
              <>
                Soal Berikutnya
                <ArrowRight size={16} />
              </>
            ) : (
              <>
                Lihat Hasil Akhir
                <Award size={16} />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

