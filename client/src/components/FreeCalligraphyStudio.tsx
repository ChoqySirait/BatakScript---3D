'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Download,
  RotateCcw,
  Undo2,
  Paintbrush,
  Sparkles,
  Layers,
  Palette,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { sound } from '@/lib/audio';
import { Point } from '@/lib/strokeEvaluator';

interface FreeCalligraphyStudioProps {
  onCanvasUpdate?: (canvas: HTMLCanvasElement) => void;
}

const BRUSH_COLORS = [
  { name: 'Emas Laklak', value: '#FFD700' },
  { name: 'Merah Batak', value: '#DC143C' },
  { name: 'Putih Tulang', value: '#F5F0E8' },
  { name: 'Tinta Jelaga', value: '#2C1D11' },
];

const BRUSH_SIZES = [
  { label: 'Halus', size: 5 },
  { label: 'Sedang', size: 9 },
  { label: 'Tebal', size: 15 },
];

export default function FreeCalligraphyStudio({
  onCanvasUpdate,
}: FreeCalligraphyStudioProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<{ points: Point[]; color: string; size: number }[]>([]);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [activeColor, setActiveColor] = useState('#FFD700');
  const [activeSize, setActiveSize] = useState(9);
  const [isExporting, setIsExporting] = useState(false);

  const lastPosRef = useRef<Point | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Redraw canvas
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Dark parchment OLED background
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#101012';
    ctx.fillRect(0, 0, w, h);

    // Subtle traditional guidelines
    ctx.strokeStyle = 'rgba(74, 74, 76, 0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);

    // Horizontal guideline
    ctx.beginPath();
    ctx.moveTo(30, h * 0.35);
    ctx.lineTo(w - 30, h * 0.35);
    ctx.moveTo(30, h * 0.65);
    ctx.lineTo(w - 30, h * 0.65);
    ctx.stroke();

    ctx.setLineDash([]); // Reset dash

    // Draw all strokes
    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (stroke.color === '#FFD700') {
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 10;
      } else if (stroke.color === '#DC143C') {
        ctx.shadowColor = '#FF1A4A';
        ctx.shadowBlur = 8;
      }
      ctx.stroke();
      ctx.restore();
    }

    // Draw active stroke in progress
    if (currentPoints.length >= 2) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
      for (let i = 1; i < currentPoints.length; i++) {
        ctx.lineTo(currentPoints[i].x, currentPoints[i].y);
      }
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = activeSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();
    }

    // Mirror to 3D stage
    if (onCanvasUpdate) {
      onCanvasUpdate(canvas);
    }
  }, [strokes, currentPoints, activeColor, activeSize, onCanvasUpdate]);

  useEffect(() => {
    redraw();
  }, [redraw]);

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
    setCurrentPoints([p]);
    lastPosRef.current = p;
    lastTimeRef.current = performance.now();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const p = getCanvasPos(e);
    setCurrentPoints((prev) => [...prev, p]);

    // Audio friction modulated by speed
    const now = performance.now();
    if (lastPosRef.current) {
      const dx = p.x - lastPosRef.current.x;
      const dy = p.y - lastPosRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const dt = Math.max(1, now - lastTimeRef.current);
      const speed = dist / dt;
      sound.playBrushScratch(speed);
    }
    lastPosRef.current = p;
    lastTimeRef.current = now;
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPoints.length > 0) {
      setStrokes((prev) => [
        ...prev,
        { points: currentPoints, color: activeColor, size: activeSize },
      ]);
      setCurrentPoints([]);
    }
    lastPosRef.current = null;
  };

  const handleUndo = () => {
    sound.playClickSound();
    setStrokes((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    sound.playClickSound();
    setStrokes([]);
    setCurrentPoints([]);
  };

  // High-Resolution PNG Artifact Exporter with Authentic Wood Bark & Cap Datu Stamp
  const handleExportArtifact = () => {
    sound.playClickSound();
    setIsExporting(true);

    const outW = 1200;
    const outH = 800;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = outW;
    exportCanvas.height = outH;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) {
      setIsExporting(false);
      return;
    }

    // 1. Natural Wood Bark (Pustaha Laklak) Base
    ctx.fillStyle = '#3A2010';
    ctx.fillRect(0, 0, outW, outH);

    // Natural wood grain lines
    for (let i = 0; i < 300; i++) {
      const y = Math.random() * outH;
      ctx.strokeStyle = `rgba(180, 120, 60, ${0.05 + Math.random() * 0.1})`;
      ctx.lineWidth = 1 + Math.random() * 3;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= outW; x += 40) {
        ctx.lineTo(x, y + Math.sin(x * 0.015 + i) * 6);
      }
      ctx.stroke();
    }

    // 2. Central Parchment Inner Paper Sheet
    const pX = 60, pY = 60, pW = outW - 120, pH = outH - 120;
    ctx.fillStyle = '#F5EED9';
    ctx.fillRect(pX, pY, pW, pH);

    // Parchment fiber grain
    for (let i = 0; i < 4000; i++) {
      ctx.fillStyle = `rgba(120, 90, 50, ${Math.random() * 0.05})`;
      ctx.fillRect(pX + Math.random() * pW, pY + Math.random() * pH, 2, 2);
    }

    // 3. Gorga-inspired Double Border
    ctx.strokeStyle = '#8B5A2B';
    ctx.lineWidth = 8;
    ctx.strokeRect(pX + 10, pY + 10, pW - 20, pH - 20);

    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2;
    ctx.strokeRect(pX + 22, pY + 22, pW - 44, pH - 44);

    // Header Title
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.fillStyle = '#6E4728';
    ctx.textAlign = 'center';
    ctx.fillText('ARTEFAK NASKAH PUSTAHA LAKLAK · SURAT BATAK TOBA', outW / 2, pY + 55);

    ctx.strokeStyle = '#B38B59';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(outW / 2 - 280, pY + 70);
    ctx.lineTo(outW / 2 + 280, pY + 70);
    ctx.stroke();

    // 4. Render User Strokes scaled up from 360x360
    const scale = Math.min((pW - 160) / 360, (pH - 180) / 360);
    const offsetX = pX + (pW - 360 * scale) / 2;
    const offsetY = pY + 95;

    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(offsetX + stroke.points[0].x * scale, offsetY + stroke.points[0].y * scale);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(offsetX + stroke.points[i].x * scale, offsetY + stroke.points[i].y * scale);
      }
      ctx.strokeStyle = stroke.color === '#FFD700' ? '#C49A28' : stroke.color;
      ctx.lineWidth = stroke.size * scale * 1.1;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();
    }

    // 5. Authentic Cap Datu Batak Seal (Bottom-Right Stamp)
    const sealX = pX + pW - 130;
    const sealY = pY + pH - 120;
    const sealR = 55;

    ctx.save();
    ctx.translate(sealX, sealY);
    ctx.rotate(-0.08); // Hand-stamped slight rotation angle

    // Outer double red wax seal circle
    ctx.strokeStyle = '#B91C1C';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, sealR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, sealR - 6, 0, Math.PI * 2);
    ctx.stroke();

    // Gorga Sun Cross Motif in Center
    ctx.fillStyle = '#B91C1C';
    ctx.font = 'bold 12px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('DATU BOLON', 0, -22);

    // Batak Unicode in seal: ᯑᯖᯮ (Datu)
    ctx.font = 'bold 24px "Noto Sans Batak", serif';
    ctx.fillText('ᯑᯖᯮ', 0, 0);

    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.fillText('CAP SAH LAKLAK', 0, 24);
    ctx.restore();

    // 6. Subtitle & Timestamp
    const dateStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    ctx.font = '13px "Courier New", monospace';
    ctx.fillStyle = '#7A5230';
    ctx.textAlign = 'left';
    ctx.fillText(`Direkam pada: ${dateStr}`, pX + 35, pY + pH - 45);
    ctx.fillText('BatakScript 3D Studio Kaligrafi', pX + 35, pY + pH - 25);

    // Trigger download
    setTimeout(() => {
      const dataUrl = exportCanvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `batakscript-artefak-${Date.now()}.png`;
      a.click();
      sound.playEthnicSuccessChime();
      setIsExporting(false);
    }, 150);
  };

  return (
    <div className="flex flex-col items-center rounded-2xl border border-charcoal-border bg-[#141416] p-6 shadow-2xl">
      {/* Title */}
      <div className="mb-4 flex w-full items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-gold">
            Studio Kaligrafi Bebas
          </span>
          <h3 className="text-lg font-bold text-bone">Naskah Terbuka Laklak</h3>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg bg-charcoal px-2.5 py-1 text-xs text-bone-muted">
          <Paintbrush size={13} className="text-crimson" />
          <span>{strokes.length} Goresan</span>
        </div>
      </div>

      {/* Canvas */}
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

        {strokes.length === 0 && currentPoints.length === 0 && (
          <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-charcoal/80 px-3.5 py-1 text-xs text-bone-dim backdrop-blur-sm">
            Tuliskan kata atau aksara Batak secara bebas
          </div>
        )}
      </div>

      {/* Brush Tools Bar: Palette & Thickness */}
      <div className="mt-4 flex w-full flex-wrap items-center justify-between gap-3 border-t border-charcoal-border/50 pt-3">
        {/* Color Palette */}
        <div className="flex items-center gap-1.5">
          <Palette size={14} className="text-bone-dim mr-1" />
          {BRUSH_COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => {
                sound.playClickSound();
                setActiveColor(c.value);
              }}
              className={cn(
                'relative h-6 w-6 rounded-full border-2 transition-transform active:scale-90',
                activeColor === c.value
                  ? 'border-white scale-110 shadow-sm'
                  : 'border-transparent hover:scale-105'
              )}
              style={{ backgroundColor: c.value }}
              title={c.name}
            >
              {activeColor === c.value && (
                <Check
                  size={12}
                  className={c.value === '#F5F0E8' ? 'text-black' : 'text-white'}
                />
              )}
            </button>
          ))}
        </div>

        {/* Thickness selector */}
        <div className="flex items-center gap-1">
          {BRUSH_SIZES.map((s) => (
            <button
              key={s.size}
              onClick={() => {
                sound.playClickSound();
                setActiveSize(s.size);
              }}
              className={cn(
                'rounded-lg px-2.5 py-1 text-xs font-semibold transition-all',
                activeSize === s.size
                  ? 'bg-crimson text-bone'
                  : 'bg-charcoal text-bone-dim hover:text-bone'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Action Controls */}
      <div className="mt-4 flex w-full items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleUndo}
            disabled={strokes.length === 0}
            className="flex items-center gap-1 rounded-xl border border-charcoal-border bg-charcoal px-3 py-2 text-xs font-medium text-bone-muted hover:border-crimson hover:text-bone disabled:opacity-40 transition-all"
            title="Undo tarikan terakhir"
          >
            <Undo2 size={13} />
            Undo
          </button>

          <button
            onClick={handleClear}
            className="flex items-center gap-1 rounded-xl border border-charcoal-border bg-charcoal px-3 py-2 text-xs font-medium text-bone-muted hover:border-crimson hover:text-bone transition-all"
            title="Hapus kanvas"
          >
            <RotateCcw size={13} />
            Hapus
          </button>
        </div>

        {/* Export High-Res PNG Button */}
        <button
          onClick={handleExportArtifact}
          disabled={strokes.length === 0 || isExporting}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold/90 to-gold px-4 py-2 text-xs font-bold text-charcoal shadow-lg shadow-gold/20 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all"
        >
          <Download size={14} />
          {isExporting ? 'Membuat Naskah…' : 'Ekspor Artefak PNG'}
        </button>
      </div>
    </div>
  );
}

