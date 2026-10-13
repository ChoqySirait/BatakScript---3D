'use client';

import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { InkBleedShader } from '@/shaders/InkBleedMaterial';
import PorhalaanWheel from './PorhalaanWheel';
import { sound } from '@/lib/audio';
import { Point } from '@/lib/strokeEvaluator';

// ── 19 Ina ni Surat canonical dataset ────────────────────────────────────────
export const INA_NI_SURAT = [
  { glyph: '\u1BC0', latin: 'A',   sound: '/a/',    unicode: 'U+1BC0' },
  { glyph: '\u1BC2', latin: 'HA',  sound: '/ha/',   unicode: 'U+1BC2' },
  { glyph: '\u1BC5', latin: 'BA',  sound: '/ba/',   unicode: 'U+1BC5' },
  { glyph: '\u1BC7', latin: 'PA',  sound: '/pa/',   unicode: 'U+1BC7' },
  { glyph: '\u1BC9', latin: 'NA',  sound: '/na/',   unicode: 'U+1BC9' },
  { glyph: '\u1BCE', latin: 'GA',  sound: '/ga/',   unicode: 'U+1BCE' },
  { glyph: '\u1BD0', latin: 'JA',  sound: '/ja/',   unicode: 'U+1BD0' },
  { glyph: '\u1BD1', latin: 'DA',  sound: '/da/',   unicode: 'U+1BD1' },
  { glyph: '\u1BD2', latin: 'RA',  sound: '/ra/',   unicode: 'U+1BD2' },
  { glyph: '\u1BD4', latin: 'MA',  sound: '/ma/',   unicode: 'U+1BD4' },
  { glyph: '\u1BD6', latin: 'TA',  sound: '/ta/',   unicode: 'U+1BD6' },
  { glyph: '\u1BD8', latin: 'SA',  sound: '/sa/',   unicode: 'U+1BD8' },
  { glyph: '\u1BDE', latin: 'WA',  sound: '/wa/',   unicode: 'U+1BDE' },
  { glyph: '\u1BDB', latin: 'YA',  sound: '/ya/',   unicode: 'U+1BDB' },
  { glyph: '\u1BDD', latin: 'NGA', sound: '/nga/',  unicode: 'U+1BDD' },
  { glyph: '\u1BE0', latin: 'NYA', sound: '/nya/',  unicode: 'U+1BE0' },
  { glyph: '\u1BE1', latin: 'CA',  sound: '/ca/',   unicode: 'U+1BE1' },
  { glyph: '\u1BE4', latin: 'I',   sound: '/i/',    unicode: 'U+1BE4' },
  { glyph: '\u1BE5', latin: 'U',   sound: '/u/',    unicode: 'U+1BE5' },
];

// ── Organic Bark Texture (Laklak Alim Batak) ─────────────────────────────────
function useBarkTexture() {
  return useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 700;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#3A2012';
    ctx.fillRect(0, 0, 512, 700);

    // Natural wood bark horizontal fibers
    for (let i = 0; i < 280; i++) {
      const y = Math.random() * 700;
      const alpha = 0.05 + Math.random() * 0.12;
      ctx.strokeStyle = `rgba(205, 155, 95, ${alpha})`;
      ctx.lineWidth = 1 + Math.random() * 2.2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= 512; x += 25) {
        ctx.lineTo(x, y + Math.sin(x * 0.02 + i) * 7);
      }
      ctx.stroke();
    }

    // Gorga border engraving
    ctx.strokeStyle = '#7A4D22';
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, 492, 680);
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2;
    ctx.strokeRect(18, 18, 476, 664);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }, []);
}

// ── Parchment Texture with Etched Watermark Glyph ────────────────────────────
function usePageTexture(idx: number) {
  const [tex, setTex] = useState<THREE.CanvasTexture | null>(null);
  const { glyph, latin, sound: phoneme, unicode } = INA_NI_SURAT[idx];

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const build = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d')!;

      // Aged laklak bark tone
      ctx.fillStyle = '#EFE4CD';
      ctx.fillRect(0, 0, 1024, 1024);

      // Bark fiber specks
      for (let i = 0; i < 3000; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        ctx.fillStyle = `rgba(110, 75, 45, ${Math.random() * 0.08})`;
        ctx.fillRect(x, y, 2, 2);
      }

      // Traditional Gorga Border Frame
      ctx.strokeStyle = '#996C3D';
      ctx.lineWidth = 10;
      ctx.strokeRect(32, 32, 960, 960);
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 3;
      ctx.strokeRect(48, 48, 928, 928);

      // Header Banner
      ctx.font = 'bold 26px Arial, sans-serif';
      ctx.fillStyle = '#6E4728';
      ctx.textAlign = 'center';
      ctx.fillText(`PUSTAHA LAKLAK · BAB ${idx + 1} / ${INA_NI_SURAT.length}`, 512, 105);

      ctx.strokeStyle = '#C8A060';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(180, 125);
      ctx.lineTo(844, 125);
      ctx.stroke();

      // Watermark Canonical Glyph (Ghost guide for user painting)
      ctx.save();
      ctx.font = '360px "Noto Sans Batak", serif';
      ctx.fillStyle = 'rgba(180, 140, 90, 0.22)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(glyph, 512, 500);

      // Golden watermark outline
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 8]);
      ctx.strokeText(glyph, 512, 500);
      ctx.restore();

      // Latin Name
      ctx.font = 'bold 58px Arial, sans-serif';
      ctx.fillStyle = '#381E0E';
      ctx.textAlign = 'center';
      ctx.fillText(`Surat ${latin}`, 512, 790);

      // Phoneme & Unicode
      ctx.font = '32px Arial, sans-serif';
      ctx.fillStyle = '#7A5230';
      ctx.fillText(`${phoneme} · ${unicode}`, 512, 850);

      ctx.font = 'italic 20px Georgia, serif';
      ctx.fillStyle = '#9C6F42';
      ctx.fillText('Goreskan pena langsung di atas lembaran ini', 512, 915);

      const t = new THREE.CanvasTexture(canvas);
      t.needsUpdate = true;
      setTex(t);
    };

    if (document.fonts) {
      document.fonts.ready.then(build);
    } else {
      build();
    }
  }, [idx, glyph, latin, phoneme, unicode]);

  return tex;
}

// ── Props ────────────────────────────────────────────────────────────────────
interface PustahaBookProps {
  pageIndex: number;
  foldProgress?: number;
  lanternPos?: [number, number, number];
  activeInk?: 'charcoal' | 'gold';
  onStrokesChange?: (strokes: Point[][]) => void;
  onPaintingStateChange?: (isPainting: boolean) => void;
  onPorhalaanSolved?: () => void;
  isPorhalaanUnlocked?: boolean;
}

export function PustahaBook({
  pageIndex,
  foldProgress = 0.15,
  lanternPos = [-2.8, 1.6, 1.2],
  activeInk = 'charcoal',
  onStrokesChange,
  onPaintingStateChange,
  onPorhalaanSolved,
  isPorhalaanUnlocked = false,
}: PustahaBookProps) {
  const rootGroupRef = useRef<THREE.Group>(null);
  const leftPivotRef = useRef<THREE.Group>(null);
  const rightPivotRef = useRef<THREE.Group>(null);
  const inkShaderMatRef = useRef<THREE.ShaderMaterial | null>(null);

  const barkTex = useBarkTexture();
  const pageTex = usePageTexture(pageIndex);

  // Dynamic Drawing Canvas & Texture for Real-Time Raycasting UV Painting
  const [drawingCanvas, setDrawingCanvas] = useState<HTMLCanvasElement | null>(null);
  const drawingTexRef = useRef<THREE.CanvasTexture | null>(null);

  // User strokes state
  const strokesRef = useRef<Point[][]>([]);
  const currentStrokeRef = useRef<Point[]>([]);
  const isPaintingRef = useRef(false);
  const lastUVRef = useRef<Point | null>(null);

  // Dimensions of each accordion panel
  const W = 2.4;
  const H = 3.3;
  const D = 0.08;

  // Initialize offscreen drawing canvas (1024x1024)
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, 1024, 1024);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;

    drawingTexRef.current = tex;
    setDrawingCanvas(canvas);
  }, []);

  // Clear canvas whenever page index changes
  useEffect(() => {
    if (!drawingCanvas) return;
    const ctx = drawingCanvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, 1024, 1024);
    }
    if (drawingTexRef.current) {
      drawingTexRef.current.needsUpdate = true;
    }
    strokesRef.current = [];
    currentStrokeRef.current = [];
    onStrokesChange?.([]);
  }, [pageIndex, drawingCanvas, onStrokesChange]);

  // Create & configure the custom Ink Bleed Shader Material
  const inkBleedMaterial = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(InkBleedShader.uniforms),
      vertexShader: InkBleedShader.vertexShader,
      fragmentShader: InkBleedShader.fragmentShader,
    });
    inkShaderMatRef.current = mat;
    return mat;
  }, []);

  // Synchronize uniforms
  useEffect(() => {
    if (!inkBleedMaterial) return;
    if (drawingTexRef.current) {
      inkBleedMaterial.uniforms.uInkMap.value = drawingTexRef.current;
    }
    if (pageTex) {
      inkBleedMaterial.uniforms.uParchmentMap.value = pageTex;
    }
    inkBleedMaterial.uniforms.uLanternPos.value.set(...lanternPos);
    inkBleedMaterial.uniforms.uIsGoldInk.value = activeInk === 'gold' ? 1.0 : 0.0;
    inkBleedMaterial.uniforms.uInkColor.value.set(
      activeInk === 'gold' ? '#F5C542' : '#141416'
    );
  }, [inkBleedMaterial, pageTex, lanternPos, activeInk, drawingCanvas]);

  // ── Raycasting UV Painting Handlers ─────────────────────────────────────────
  const drawLineOnCanvas = useCallback(
    (p1: Point, p2: Point) => {
      if (!drawingCanvas) return;
      const ctx = drawingCanvas.getContext('2d');
      if (!ctx) return;

      const cW = drawingCanvas.width;
      const cH = drawingCanvas.height;

      // Map UV to Canvas pixels (invert Y for Three.js UV orientation)
      const x1 = p1.x * cW;
      const y1 = (1.0 - p1.y) * cH;
      const x2 = p2.x * cW;
      const y2 = (1.0 - p2.y) * cH;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = activeInk === 'gold' ? 22 : 26;

      // Solid alpha mask for shader processing
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();
      ctx.restore();

      if (drawingTexRef.current) {
        drawingTexRef.current.needsUpdate = true;
      }
    },
    [drawingCanvas, activeInk]
  );

  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!e.uv) return;
      e.stopPropagation();

      isPaintingRef.current = true;
      onPaintingStateChange?.(true);

      const uvPoint: Point = {
        x: e.uv.x,
        y: e.uv.y,
        t: performance.now(),
      };

      currentStrokeRef.current = [uvPoint];
      lastUVRef.current = uvPoint;

      // Draw dot
      drawLineOnCanvas(uvPoint, uvPoint);

      if (e.point) {
        sound.playSpatialBrushScratch([e.point.x, e.point.y, e.point.z], 1.2);
      }
    },
    [drawLineOnCanvas, onPaintingStateChange]
  );

  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!isPaintingRef.current || !e.uv) return;
      e.stopPropagation();

      const currentUV: Point = {
        x: e.uv.x,
        y: e.uv.y,
        t: performance.now(),
      };

      if (lastUVRef.current) {
        drawLineOnCanvas(lastUVRef.current, currentUV);

        // Speed calculation for dynamic spatial audio modulation
        const dt = Math.max(1, (currentUV.t || 0) - (lastUVRef.current.t || 0));
        const dx = (currentUV.x - lastUVRef.current.x) * 1024;
        const dy = (currentUV.y - lastUVRef.current.y) * 1024;
        const speed = Math.sqrt(dx * dx + dy * dy) / dt;

        if (e.point) {
          sound.playSpatialBrushScratch([e.point.x, e.point.y, e.point.z], speed * 15);
        }
      }

      currentStrokeRef.current.push(currentUV);
      lastUVRef.current = currentUV;
    },
    [drawLineOnCanvas]
  );

  const handlePointerUp = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!isPaintingRef.current) return;
      e.stopPropagation();

      isPaintingRef.current = false;
      onPaintingStateChange?.(false);

      if (currentStrokeRef.current.length > 0) {
        strokesRef.current.push([...currentStrokeRef.current]);
        onStrokesChange?.([...strokesRef.current]);
        currentStrokeRef.current = [];
      }
      lastUVRef.current = null;
    },
    [onPaintingStateChange, onStrokesChange]
  );

  // Real-time animation loop: fold lerp, floating breathing, shader time
  useFrame(() => {
    const t = performance.now() * 0.001;

    // Shader time update
    if (inkBleedMaterial) {
      inkBleedMaterial.uniforms.uTime.value = t;
    }

    // Gentle breathing motion
    if (rootGroupRef.current) {
      rootGroupRef.current.position.y = Math.sin(t * 0.7) * 0.05;
      rootGroupRef.current.rotation.x = Math.sin(t * 0.5) * 0.012;
    }

    // Accordion fold rotation angles
    const targetLeftAngle = THREE.MathUtils.lerp(0.35, 2.95, foldProgress);
    const targetRightAngle = THREE.MathUtils.lerp(-0.35, -2.95, foldProgress);

    if (leftPivotRef.current) {
      leftPivotRef.current.rotation.y = THREE.MathUtils.lerp(
        leftPivotRef.current.rotation.y,
        targetLeftAngle,
        0.08
      );
    }
    if (rightPivotRef.current) {
      rightPivotRef.current.rotation.y = THREE.MathUtils.lerp(
        rightPivotRef.current.rotation.y,
        targetRightAngle,
        0.08
      );
    }
  });

  return (
    <group ref={rootGroupRef} position={[0, 0, 0]}>
      {/* ═════════════════════════════════════════════════════════════════════
          PANEL TENGAH (CENTER PANEL) — DIRECT RAYCASTING UV PAINTING MESH
          ═════════════════════════════════════════════════════════════════════ */}
      <group position={[0, 0, 0]}>
        {/* Core bark panel slab */}
        <mesh castShadow receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={[W, H, D]} />
          <meshStandardMaterial
            map={barkTex || undefined}
            color={barkTex ? '#ffffff' : '#3E2413'}
            roughness={0.9}
            metalness={0.06}
          />
        </mesh>

        {/* ── Active Raycasting Painting Surface (Ink Bleed Shader) ── */}
        <mesh
          position={[0, 0, D / 2 + 0.005]}
          material={inkBleedMaterial}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <planeGeometry args={[W - 0.12, H - 0.12]} />
        </mesh>
      </group>

      {/* ═════════════════════════════════════════════════════════════════════
          ENGSEL KIRI & PANEL KIRI (LEFT HINGED ACCORDION PANEL)
          ═════════════════════════════════════════════════════════════════════ */}
      <group ref={leftPivotRef} position={[-W / 2, 0, 0]}>
        {/* Leather hinge */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, H + 0.04, 12]} />
          <meshStandardMaterial color="#221208" roughness={0.9} />
        </mesh>

        {/* Left slab */}
        <mesh position={[-W / 2, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[W, H, D]} />
          <meshStandardMaterial
            map={barkTex || undefined}
            color={barkTex ? '#ffffff' : '#3E2413'}
            roughness={0.88}
          />
        </mesh>

        {/* Left inner page decorative parchment */}
        <mesh position={[-W / 2, 0, D / 2 + 0.005]}>
          <planeGeometry args={[W - 0.15, H - 0.15]} />
          <meshStandardMaterial
            color="#EFE2C6"
            roughness={0.88}
            map={pageTex || undefined}
          />
        </mesh>
      </group>

      {/* ═════════════════════════════════════════════════════════════════════
          ENGSEL KANAN & PANEL KANAN (PANEL 3: BABAD PORHALAAN KALENDER KOSMIS)
          ═════════════════════════════════════════════════════════════════════ */}
      <group ref={rightPivotRef} position={[W / 2, 0, 0]}>
        {/* Leather hinge */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, H + 0.04, 12]} />
          <meshStandardMaterial color="#221208" roughness={0.9} />
        </mesh>

        {/* Right slab */}
        <mesh position={[W / 2, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[W, H, D]} />
          <meshStandardMaterial
            map={barkTex || undefined}
            color={barkTex ? '#ffffff' : '#3E2413'}
            roughness={0.88}
          />
        </mesh>

        {/* Right inner page base */}
        <mesh position={[W / 2, 0, D / 2 + 0.005]}>
          <planeGeometry args={[W - 0.15, H - 0.15]} />
          <meshStandardMaterial
            color="#E8DAC0"
            roughness={0.86}
          />
        </mesh>

        {/* ── Embedded Interactive Porhalaan Cosmic Wheel on Panel 3 ── */}
        <PorhalaanWheel
          position={[W / 2, 0, D / 2 + 0.03]}
          onSolved={onPorhalaanSolved}
          isUnlocked={isPorhalaanUnlocked}
        />
      </group>
    </group>
  );
}
