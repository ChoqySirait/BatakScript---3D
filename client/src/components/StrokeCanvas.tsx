'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  RotateCcw,
  Undo2,
  CheckCircle2,
  Trophy,
  AlertCircle,
  ArrowRight,
  Loader2,
  Layers,
  Sparkles,
  Compass,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Point,
  HeatmapSegment,
  EvaluationResult,
  evaluateUserStrokes,
} from '@/lib/strokeEvaluator';
import { sound } from '@/lib/audio';

interface StrokeCanvasProps {
  lessonId: number;
  targetGlyph: string;
  latinSound: string;
  glyphTitle?: string;
  onSuccess?: () => void;
  onNextLesson?: () => void;
  hasNextLesson?: boolean;
  /** Expose the raw canvas element for Real-Time 3D Mirroring */
  onCanvasUpdate?: (canvas: HTMLCanvasElement) => void;
}

// Particle structure for celebration
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
}

export default function StrokeCanvas({
  lessonId,
  targetGlyph,
  latinSound,
  glyphTitle,
  onSuccess,
  onNextLesson,
  hasNextLesson = true,
  onCanvasUpdate,
}: StrokeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Stroke states (multi-stroke support)
  const [isDrawing, setIsDrawing] = useState(false);
  const [userStrokes, setUserStrokes] = useState<Point[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [referencePoints, setReferencePoints] = useState<Point[]>([]);
  const [heatmapSegments, setHeatmapSegments] = useState<HeatmapSegment[]>([]);

  // Telemetry & evaluation results
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>('guest-session');
  const [showHeatmap, setShowHeatmap] = useState(true);

  // Last pointer coordinates for velocity calculation
  const lastPosRef = useRef<Point | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Particles ref for celebration
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);

  // Initialize session ID
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let sid = localStorage.getItem('batakscript_session_id');
      if (!sid) {
        sid = 'session-' + Math.random().toString(36).substring(2, 11);
        localStorage.setItem('batakscript_session_id', sid);
      }
      setSessionId(sid);
    }
  }, []);

  // Compute reference points from font glyph rasterization
  useEffect(() => {
    const extractRefPoints = () => {
      const offscreen = document.createElement('canvas');
      const size = 360;
      offscreen.width = size;
      offscreen.height = size;
      const ctx = offscreen.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, size, size);
      ctx.font = 'bold 220px "Noto Sans Batak", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(targetGlyph, size / 2, size / 2 + 10);

      const imgData = ctx.getImageData(0, 0, size, size);
      const data = imgData.data;
      const points: Point[] = [];
      const step = 4; // Sample step for performance and coverage

      for (let y = 0; y < size; y += step) {
        for (let x = 0; x < size; x += step) {
          const alpha = data[(y * size + x) * 4 + 3];
          if (alpha > 120) {
            points.push({ x, y });
          }
        }
      }
      setReferencePoints(points);
    };

    if (document.fonts) {
      document.fonts.ready.then(extractRefPoints);
    } else {
      extractRefPoints();
    }

    // Reset user drawing when target glyph changes
    handleClear();
  }, [targetGlyph]);

  // Redraw canvas: ghost glyph, strokes, and visual error heatmap
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Dark charcoal OLED background
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0D0D0E';
    ctx.fillRect(0, 0, w, h);

    // Subtle alignment grid
    ctx.strokeStyle = 'rgba(74, 74, 76, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    ctx.setLineDash([]); // Reset dash

    // Ghost glyph (translucent gold silhouette)
    ctx.save();
    ctx.font = 'bold 220px "Noto Sans Batak", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255, 215, 0, 0.16)';
    ctx.fillText(targetGlyph, w / 2, h / 2 + 10);

    ctx.strokeStyle = 'rgba(245, 240, 232, 0.08)';
    ctx.lineWidth = 2;
    ctx.strokeText(targetGlyph, w / 2, h / 2 + 10);
    ctx.restore();

    // ── Render Error Heatmap if evaluated and active ──────────────────────────
    if (evaluation && showHeatmap && heatmapSegments.length > 0) {
      for (const seg of heatmapSegments) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(seg.p1.x, seg.p1.y);
        ctx.lineTo(seg.p2.x, seg.p2.y);
        ctx.strokeStyle = seg.color;
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.shadowColor = seg.color;
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.restore();
      }
    } else {
      // ── Render standard strokes ───────────────────────────────────────────
      const allStrokes = [...userStrokes];
      if (currentStroke.length > 0) {
        allStrokes.push(currentStroke);
      }

      for (const stroke of allStrokes) {
        if (stroke.length < 2) continue;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(stroke[0].x, stroke[0].y);
        for (let i = 1; i < stroke.length; i++) {
          ctx.lineTo(stroke[i].x, stroke[i].y);
        }
        ctx.strokeStyle = '#DC143C'; // Batak crimson
        ctx.lineWidth = 9;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = '#FF1A4A';
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.restore();
      }
    }

    // Notify 3D mirroring listener
    if (onCanvasUpdate) {
      onCanvasUpdate(canvas);
    }
  }, [targetGlyph, userStrokes, currentStroke, evaluation, showHeatmap, heatmapSegments, onCanvasUpdate]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  // Pointer event handlers with velocity audio feedback
  const getCanvasPos = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = getCanvasPos(e);
    setIsDrawing(true);
    setCurrentStroke([p]);
    lastPosRef.current = p;
    lastTimeRef.current = performance.now();

    // Reset evaluation when drawing new stroke
    setEvaluation(null);
    setHeatmapSegments([]);
    setFeedback(null);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const p = getCanvasPos(e);
    setCurrentStroke((prev) => [...prev, p]);

    // Audio friction feedback based on pointer speed
    const now = performance.now();
    if (lastPosRef.current) {
      const dx = p.x - lastPosRef.current.x;
      const dy = p.y - lastPosRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const dt = Math.max(1, now - lastTimeRef.current);
      const speed = dist / dt; // pixels per ms
      sound.playBrushScratch(speed);
    }
    lastPosRef.current = p;
    lastTimeRef.current = now;
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentStroke.length > 0) {
      setUserStrokes((prev) => [...prev, currentStroke]);
      setCurrentStroke([]);
    }
    lastPosRef.current = null;
  };

  // Undo last stroke (multi-stroke convenience)
  const handleUndo = () => {
    sound.playClickSound();
    setUserStrokes((prev) => prev.slice(0, -1));
    setEvaluation(null);
    setHeatmapSegments([]);
    setFeedback(null);
  };

  // Clear all strokes
  const handleClear = () => {
    sound.playClickSound();
    setUserStrokes([]);
    setCurrentStroke([]);
    setEvaluation(null);
    setHeatmapSegments([]);
    setFeedback(null);
  };

  // Trigger celebration particles
  const triggerCelebration = () => {
    sound.playEthnicSuccessChime();

    const pCanvas = particleCanvasRef.current;
    if (!pCanvas) return;
    const ctx = pCanvas.getContext('2d');
    if (!ctx) return;

    const colors = ['#FFD700', '#DC143C', '#FF1A4A', '#F5F0E8', '#10B981'];
    const newParticles: Particle[] = [];
    const count = 90;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      newParticles.push({
        x: pCanvas.width / 2,
        y: pCanvas.height / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        alpha: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 4.5,
      });
    }

    particlesRef.current = newParticles;

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    const animate = () => {
      ctx.clearRect(0, 0, pCanvas.width, pCanvas.height);
      const alive: Particle[] = [];

      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12; // Gravity
        p.alpha -= 0.015;

        if (p.alpha > 0) {
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          alive.push(p);
        }
      }

      particlesRef.current = alive;
      if (alive.length > 0) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, pCanvas.width, pCanvas.height);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  };

  // Evaluate strokes with high-precision gesture recognition
  const handleValidate = async () => {
    sound.playClickSound();

    if (userStrokes.length === 0 && currentStroke.length === 0) {
      setFeedback('Silakan buat goresan aksara di atas kanvas terlebih dahulu.');
      return;
    }

    const allStrokes = [...userStrokes];
    if (currentStroke.length > 0) allStrokes.push(currentStroke);

    const result = evaluateUserStrokes(allStrokes, referencePoints, 360, 360);
    setEvaluation(result);
    setHeatmapSegments(result.heatmap);

    if (result.isPassed) {
      setFeedback(
        `Luar biasa! Skor ${result.score}% (Akurasi: ${result.accuracy}%, Arah: ${result.directionSimilarity}%). Standar kelulusan tercapai!`
      );
      triggerCelebration();
      onSuccess?.();
    } else {
      setFeedback(
        `Skor ${result.score}% (Akurasi: ${result.accuracy}%, Arah: ${result.directionSimilarity}%). Minimal 75% untuk lulus. Periksa segmen merah/oranye!`
      );
    }

    // Submit progress to backend
    setSubmitting(true);
    try {
      await api.submitProgress({
        session_id: sessionId,
        lesson_id: lessonId,
        accuracy: result.score,
      });
    } catch (err) {
      console.warn('Gagal sinkronisasi progres ke backend:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center rounded-2xl border border-charcoal-border bg-[#141416] p-6 shadow-2xl">
      {/* Title & Info */}
      <div className="mb-4 flex w-full items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-crimson">
            Evaluasi Gestur Presisi 64-Titik
          </span>
          <h3 className="text-lg font-bold text-bone">
            {glyphTitle || `Aksara ${latinSound.toUpperCase()} (${targetGlyph})`}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="batak-text text-3xl text-gold glyph-glow">{targetGlyph}</span>
          <span className="rounded-lg bg-charcoal px-2.5 py-1 text-xs font-mono text-bone-muted">
            {latinSound}
          </span>
        </div>
      </div>

      {/* Tracing Canvas Container */}
      <div className="relative overflow-hidden rounded-xl border-2 border-charcoal-border bg-[#0D0D0E] shadow-inner">
        <canvas
          ref={canvasRef}
          width={360}
          height={360}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="touch-none cursor-crosshair select-none"
          style={{ width: '360px', height: '360px' }}
        />

        {/* Celebration Particles Canvas */}
        <canvas
          ref={particleCanvasRef}
          width={360}
          height={360}
          className="pointer-events-none absolute inset-0"
        />

        {/* Canvas Stroke Count Indicator */}
        <div className="pointer-events-none absolute top-3 left-3 flex items-center gap-1.5 rounded-lg bg-charcoal/80 px-2.5 py-1 text-[11px] text-bone-dim backdrop-blur-sm">
          <Layers size={12} className="text-crimson" />
          <span>{userStrokes.length} Tarikan</span>
        </div>

        {/* Canvas floating hint */}
        {userStrokes.length === 0 && currentStroke.length === 0 && (
          <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-charcoal/80 px-3 py-1 text-xs text-bone-dim backdrop-blur-sm">
            Tuliskan goresan mengikuti siluet kuning (Multi-stroke didukung)
          </div>
        )}
      </div>

      {/* Heatmap Legend */}
      {evaluation && (
        <div className="mt-3 flex w-full items-center justify-between rounded-xl border border-charcoal-border/50 bg-charcoal/50 px-3 py-1.5 text-[11px]">
          <span className="font-semibold text-bone-dim">Visual Heatmap:</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> Presisi
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <span className="h-2 w-2 rounded-full bg-amber-400" /> Deviasi
            </span>
            <span className="flex items-center gap-1 text-rose-500">
              <span className="h-2 w-2 rounded-full bg-rose-500" /> Melenceng
            </span>
          </div>
        </div>
      )}

      {/* Actions & Controls */}
      <div className="mt-4 flex w-full flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleUndo}
            disabled={userStrokes.length === 0}
            className="flex items-center gap-1 rounded-xl border border-charcoal-border bg-charcoal px-3 py-2 text-xs font-medium text-bone-muted hover:border-crimson hover:text-bone disabled:opacity-40 transition-all"
            title="Batalkan tarikan terakhir"
          >
            <Undo2 size={14} />
            Undo
          </button>

          <button
            onClick={handleClear}
            className="flex items-center gap-1 rounded-xl border border-charcoal-border bg-charcoal px-3 py-2 text-xs font-medium text-bone-muted hover:border-crimson hover:text-bone transition-all"
            title="Bersihkan seluruh kanvas"
          >
            <RotateCcw size={14} />
            Hapus
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleValidate}
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-crimson px-5 py-2 text-sm font-bold text-bone shadow-lg shadow-crimson/30 hover:bg-crimson-glow active:scale-95 transition-all disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle2 size={16} />
            )}
            Validasi Presisi
          </button>

          {evaluation && evaluation.isPassed && hasNextLesson && onNextLesson && (
            <button
              onClick={() => {
                sound.playClickSound();
                onNextLesson();
              }}
              className="flex items-center gap-1.5 rounded-xl bg-gold px-4 py-2 text-sm font-bold text-charcoal shadow-lg shadow-gold/20 hover:bg-gold-dim transition-all"
            >
              Lanjut
              <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Evaluation Results Banner & Detailed Telemetry */}
      {evaluation && (
        <div
          className={cn(
            'mt-4 flex w-full flex-col gap-2 rounded-xl border p-4 transition-all',
            evaluation.isPassed
              ? 'border-gold/40 bg-gold/10 text-gold'
              : 'border-crimson/40 bg-crimson/10 text-bone',
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {evaluation.isPassed ? (
                <Trophy size={24} className="text-gold" />
              ) : (
                <AlertCircle size={24} className="text-crimson" />
              )}
              <span className="text-xs font-bold uppercase tracking-wider">
                {evaluation.isPassed ? 'Lulus Validasi!' : 'Evaluasi Belum Lulus'}
              </span>
            </div>
            <span className="text-2xl font-black font-mono">
              {evaluation.score}%
            </span>
          </div>

          {/* Telemetry metrics bar */}
          <div className="grid grid-cols-3 gap-2 border-t border-charcoal-border/40 pt-2 text-[11px] text-bone-muted">
            <div>
              <span className="text-bone-dim">Akurasi Bentuk:</span>{' '}
              <span className="font-mono font-bold text-bone">{evaluation.accuracy}%</span>
            </div>
            <div>
              <span className="text-bone-dim">Arah Vektor:</span>{' '}
              <span className="font-mono font-bold text-bone">{evaluation.directionSimilarity}%</span>
            </div>
            <div>
              <span className="text-bone-dim">Deviasi Rata-rata:</span>{' '}
              <span className="font-mono font-bold text-bone">{evaluation.dAvg}px</span>
            </div>
          </div>

          <p className="mt-1 text-xs text-bone-muted">{feedback}</p>
        </div>
      )}

      {/* Warning/hint when drawing too short */}
      {feedback && !evaluation && (
        <div className="mt-4 flex w-full items-center gap-2 rounded-xl border border-charcoal-border bg-charcoal p-3 text-xs text-bone-dim">
          <Sparkles size={14} className="text-gold shrink-0" />
          <span>{feedback}</span>
        </div>
      )}
    </div>
  );
}
