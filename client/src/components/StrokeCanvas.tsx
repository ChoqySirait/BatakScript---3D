'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Trophy,
  AlertCircle,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Point {
  x: number;
  y: number;
}

interface StrokeCanvasProps {
  lessonId: number;
  targetGlyph: string;
  latinSound: string;
  glyphTitle?: string;
  onSuccess?: () => void;
  onNextLesson?: () => void;
  hasNextLesson?: boolean;
}

// Particle for celebration animation
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
}: StrokeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [userStrokes, setUserStrokes] = useState<Point[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [referencePoints, setReferencePoints] = useState<Point[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>('guest-session');

  // Particle animation loop ref
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);

  // Initialize or fetch session ID from localStorage
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

  // Redraw canvas with ghost glyph and user strokes
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Dark charcoal background
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#1C1C1E';
    ctx.fillRect(0, 0, w, h);

    // Grid guide lines (subtle)
    ctx.strokeStyle = 'rgba(74, 74, 76, 0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    ctx.setLineDash([]); // Reset dash

    // Ghost glyph (transparent gold/bone silhouette)
    ctx.save();
    ctx.font = 'bold 220px "Noto Sans Batak", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255, 215, 0, 0.18)'; // Translucent gold
    ctx.fillText(targetGlyph, w / 2, h / 2 + 10);

    // Faint outline for the ghost glyph
    ctx.strokeStyle = 'rgba(245, 240, 232, 0.1)';
    ctx.lineWidth = 2;
    ctx.strokeText(targetGlyph, w / 2, h / 2 + 10);
    ctx.restore();

    // Render completed user strokes
    const allStrokesToDraw = [...userStrokes];
    if (currentStroke.length > 0) {
      allStrokesToDraw.push(currentStroke);
    }

    for (const stroke of allStrokesToDraw) {
      if (stroke.length < 2) continue;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }
      ctx.strokeStyle = '#DC143C'; // Batak crimson brush stroke
      ctx.lineWidth = 9;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = '#FF1A4A';
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.restore();
    }
  }, [targetGlyph, userStrokes, currentStroke]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  // Pointer event handlers for cross-platform drawing
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
    setScore(null);
    setFeedback(null);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const p = getCanvasPos(e);
    setCurrentStroke((prev) => [...prev, p]);
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentStroke.length > 0) {
      setUserStrokes((prev) => [...prev, currentStroke]);
      setCurrentStroke([]);
    }
  };

  const handleClear = () => {
    setUserStrokes([]);
    setCurrentStroke([]);
    setScore(null);
    setFeedback(null);
  };

  // Trigger celebration particles
  const triggerCelebration = () => {
    const pCanvas = particleCanvasRef.current;
    if (!pCanvas) return;
    const ctx = pCanvas.getContext('2d');
    if (!ctx) return;

    const colors = ['#FFD700', '#DC143C', '#FF1A4A', '#F5F0E8', '#FFA500'];
    const newParticles: Particle[] = [];
    const count = 75;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      newParticles.push({
        x: pCanvas.width / 2,
        y: pCanvas.height / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        alpha: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 4,
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
        p.alpha -= 0.016; // Fade

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

  // Euclidean deviation calculation as defined in PRD Section 6.2
  // D_avg = (1/N) * sum_{i=1}^N min_j sqrt((x_i - x_ref,j)^2 + (y_i - y_ref,j)^2)
  // Score = max(0, 100 - (D_avg * 1.2))
  const handleValidate = async () => {
    const allPoints = userStrokes.flat();
    if (allPoints.length < 15) {
      setFeedback('Goresan terlalu sedikit! Silakan telusuri aksara lebih lengkap.');
      return;
    }

    if (referencePoints.length === 0) {
      setFeedback('Menunggu inisialisasi aksara target...');
      return;
    }

    let totalMinDist = 0;
    const N = allPoints.length;

    for (let i = 0; i < N; i++) {
      const pt = allPoints[i];
      let minDistSq = Infinity;

      for (let j = 0; j < referencePoints.length; j++) {
        const ref = referencePoints[j];
        const dx = pt.x - ref.x;
        const dy = pt.y - ref.y;
        const dSq = dx * dx + dy * dy;
        if (dSq < minDistSq) {
          minDistSq = dSq;
        }
      }
      totalMinDist += Math.sqrt(minDistSq);
    }

    const dAvg = totalMinDist / N;
    const calculatedScore = Math.max(0, Math.min(100, Math.round(100 - dAvg * 1.2)));
    setScore(calculatedScore);

    const isPassed = calculatedScore >= 75;

    if (isPassed) {
      setFeedback(`Luar biasa! Akurasi ${calculatedScore}% memenuhi standar kelulusan (>= 75%).`);
      triggerCelebration();
      onSuccess?.();
    } else {
      setFeedback(`Akurasi ${calculatedScore}%. Perlu minimal 75% untuk lulus. Coba ikuti siluet lebih presisi!`);
    }

    // Submit progress to backend
    setSubmitting(true);
    try {
      await api.submitProgress({
        session_id: sessionId,
        lesson_id: lessonId,
        accuracy: calculatedScore,
      });
    } catch (err) {
      console.warn('Gagal menyimpan progres ke backend:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center rounded-2xl border border-charcoal-border bg-charcoal-light p-6 shadow-2xl">
      {/* Title & Info */}
      <div className="mb-4 flex w-full items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-crimson">
            Modul Tracing Deviasi Euclidean
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
      <div className="relative overflow-hidden rounded-xl border-2 border-charcoal-border bg-charcoal shadow-inner">
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

        {/* Canvas floating hint */}
        {userStrokes.length === 0 && currentStroke.length === 0 && (
          <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-charcoal/80 px-3 py-1 text-xs text-bone-dim backdrop-blur-sm">
            Tuliskan goresan mengikuti siluet kuning
          </div>
        )}
      </div>

      {/* Actions & Controls */}
      <div className="mt-5 flex w-full flex-wrap items-center justify-between gap-3">
        <button
          onClick={handleClear}
          className="flex items-center gap-1.5 rounded-xl border border-charcoal-border bg-charcoal px-4 py-2 text-sm font-medium text-bone-muted hover:border-crimson hover:text-bone transition-all"
        >
          <RotateCcw size={15} />
          Ulangi
        </button>

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
            Validasi Goresan
          </button>

          {score !== null && score >= 75 && hasNextLesson && onNextLesson && (
            <button
              onClick={onNextLesson}
              className="flex items-center gap-1.5 rounded-xl bg-gold px-4 py-2 text-sm font-bold text-charcoal shadow-lg shadow-gold/20 hover:bg-gold-dim transition-all"
            >
              Lanjut
              <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Score and Evaluation Feedback Banner */}
      {score !== null && (
        <div
          className={cn(
            'mt-5 flex w-full items-center gap-3 rounded-xl border p-4 transition-all',
            score >= 75
              ? 'border-gold/40 bg-gold/10 text-gold'
              : 'border-crimson/40 bg-crimson/10 text-bone',
          )}
        >
          {score >= 75 ? (
            <Trophy size={28} className="shrink-0 text-gold" />
          ) : (
            <AlertCircle size={28} className="shrink-0 text-crimson" />
          )}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider">
                {score >= 75 ? 'Lulus Tantangan!' : 'Akurasi Kurang'}
              </span>
              <span className="text-lg font-black font-mono">
                {score}%
              </span>
            </div>
            <p className="mt-0.5 text-xs text-bone-muted">{feedback}</p>
          </div>
        </div>
      )}

      {/* Warning/hint when drawing too short */}
      {feedback && score === null && (
        <div className="mt-4 flex w-full items-center gap-2 rounded-xl border border-charcoal-border bg-charcoal p-3 text-xs text-bone-dim">
          <Sparkles size={14} className="text-gold shrink-0" />
          <span>{feedback}</span>
        </div>
      )}
    </div>
  );
}
