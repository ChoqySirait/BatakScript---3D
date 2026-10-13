'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Medal, X, Flame, Check, Loader2, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { LeaderboardEntry } from '@/types';
import { cn } from '@/lib/utils';
import { sound } from '@/lib/audio';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  highlightPlayer?: string;
}

export default function LeaderboardModal({
  isOpen,
  onClose,
  highlightPlayer,
}: LeaderboardModalProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.leaderboard()
        .then((res) => setEntries(res.entries || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-charcoal-border bg-[#141416] p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-charcoal-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15 text-gold">
              <Trophy size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-bone">
                Papan Peringkat Cendekia
              </h3>
              <p className="text-xs text-bone-muted">
                20 Rekor Tertinggi Tantangan Kecepatan Aksara
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClickSound();
              onClose();
            }}
            className="rounded-lg p-1.5 text-bone-dim hover:bg-charcoal hover:text-bone transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content list */}
        {loading ? (
          <div className="flex h-48 items-center justify-center gap-2 text-bone-dim">
            <Loader2 size={20} className="animate-spin text-gold" />
            <span className="text-xs">Memuat rekor dunia…</span>
          </div>
        ) : entries.length === 0 ? (
          <div className="py-12 text-center text-xs text-bone-dim">
            Belum ada catatan skor. Jadilah yang pertama!
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
            {entries.map((entry, idx) => {
              const rank = idx + 1;
              const isHighlight = highlightPlayer && entry.player_name.toLowerCase() === highlightPlayer.toLowerCase();

              return (
                <div
                  key={entry.id || idx}
                  className={cn(
                    'flex items-center justify-between rounded-xl border p-3 transition-all',
                    isHighlight
                      ? 'border-gold bg-gold/10 shadow-md'
                      : rank === 1
                      ? 'border-gold/40 bg-gold/5'
                      : rank === 2
                      ? 'border-bone/30 bg-charcoal'
                      : rank === 3
                      ? 'border-amber-700/40 bg-charcoal'
                      : 'border-charcoal-border/40 bg-charcoal/50 text-bone-muted'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-lg font-mono text-xs font-black',
                        rank === 1
                          ? 'bg-gold text-charcoal'
                          : rank === 2
                          ? 'bg-bone text-charcoal'
                          : rank === 3
                          ? 'bg-amber-700 text-bone'
                          : 'bg-charcoal text-bone-dim'
                      )}
                    >
                      {rank}
                    </span>

                    <div>
                      <p className="text-sm font-bold text-bone">
                        {entry.player_name}
                      </p>
                      <p className="text-[11px] text-bone-dim">
                        Akurasi: {entry.accuracy}% · Streak: {entry.max_streak}x
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-base font-black text-gold">
                      {entry.score}
                    </span>
                    <span className="block text-[10px] text-bone-dim uppercase">
                      Poin
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={() => {
            sound.playClickSound();
            onClose();
          }}
          className="w-full rounded-xl bg-charcoal py-2.5 text-xs font-semibold text-bone hover:bg-charcoal-light transition-colors"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}
