'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

// ── 19 Ina ni Surat data ─────────────────────────────────────────────────────
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

// ── Organic Bark Texture Generator (Laklak Alim Batak) ──────────────────────
function useBarkTexture() {
  return useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 700;
    const ctx = canvas.getContext('2d')!;

    // Rich earthy bark base
    ctx.fillStyle = '#422817';
    ctx.fillRect(0, 0, 512, 700);

    // Natural wood bark fibers
    for (let i = 0; i < 240; i++) {
      const y = Math.random() * 700;
      const alpha = 0.04 + Math.random() * 0.12;
      ctx.strokeStyle = `rgba(210, 160, 100, ${alpha})`;
      ctx.lineWidth = 1 + Math.random() * 2.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= 512; x += 20) {
        ctx.lineTo(x, y + Math.sin(x * 0.02 + i) * 8);
      }
      ctx.stroke();
    }

    // Gorga-inspired geometric border engraving
    ctx.strokeStyle = '#8B5A2B';
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

// ── Per-glyph parchment texture generator ────────────────────────────────────
function usePageTexture(idx: number) {
  const [tex, setTex] = useState<THREE.CanvasTexture | null>(null);
  const { glyph, latin, sound, unicode } = INA_NI_SURAT[idx];

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const build = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 700;
      const ctx = canvas.getContext('2d')!;

      // Aged laklak bark paper background
      ctx.fillStyle = '#F5EED9';
      ctx.fillRect(0, 0, 512, 700);

      // Fiber speckles
      for (let i = 0; i < 1500; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 700;
        ctx.fillStyle = `rgba(100, 70, 40, ${Math.random() * 0.08})`;
        ctx.fillRect(x, y, 2, 2);
      }

      // Traditional border
      ctx.strokeStyle = '#B38B59';
      ctx.lineWidth = 4;
      ctx.strokeRect(14, 14, 484, 672);

      // Header
      ctx.font = 'bold 15px Arial, sans-serif';
      ctx.fillStyle = '#6E4728';
      ctx.textAlign = 'center';
      ctx.fillText(`Pustaha Laklak · Bab ${idx + 1} / ${INA_NI_SURAT.length}`, 256, 50);

      ctx.strokeStyle = '#C8A060';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(80, 65);
      ctx.lineTo(432, 65);
      ctx.stroke();

      // Glyphs with golden glow
      ctx.save();
      ctx.font = '220px "Noto Sans Batak", serif';
      ctx.shadowColor = '#D4AF37';
      ctx.shadowBlur = 32;
      ctx.fillStyle = '#D4AF37';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(glyph, 256, 300);
      ctx.restore();

      // Latin Name
      ctx.font = 'bold 44px Arial, sans-serif';
      ctx.fillStyle = '#3D2010';
      ctx.textAlign = 'center';
      ctx.fillText(latin, 256, 490);

      // IPA & Unicode
      ctx.font = '24px Arial, sans-serif';
      ctx.fillStyle = '#7A5230';
      ctx.fillText(sound, 256, 530);

      ctx.font = '16px "Courier New", monospace';
      ctx.fillStyle = '#A07040';
      ctx.fillText(unicode, 256, 640);

      const t = new THREE.CanvasTexture(canvas);
      setTex(t);
    };

    if (document.fonts) {
      document.fonts.ready.then(build);
    } else {
      build();
    }
  }, [idx, glyph, latin, sound, unicode]);

  return tex;
}

// ── Props ────────────────────────────────────────────────────────────────────
interface PustahaBookProps {
  pageIndex: number;
  foldProgress?: number; // 0.0 (fully open flat/accordion) to 1.0 (folded stack)
  sourceCanvas?: HTMLCanvasElement | null; // Live mirrored canvas
  onNext: () => void;
  onPrev: () => void;
}

export function PustahaBook({
  pageIndex,
  foldProgress = 0.15,
  sourceCanvas,
  onNext,
  onPrev,
}: PustahaBookProps) {
  const rootGroupRef = useRef<THREE.Group>(null);
  const leftPivotRef = useRef<THREE.Group>(null);
  const rightPivotRef = useRef<THREE.Group>(null);

  const barkTex = useBarkTexture();
  const pageTex = usePageTexture(pageIndex);

  // Dynamic CanvasTexture for Real-Time 3D Mirroring
  const mirrorTexRef = useRef<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    if (sourceCanvas) {
      const tex = new THREE.CanvasTexture(sourceCanvas);
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      mirrorTexRef.current = tex;
    } else {
      mirrorTexRef.current = null;
    }
  }, [sourceCanvas]);

  // Dimensions of each accordion panel
  const W = 2.2;
  const H = 3.2;
  const D = 0.08;

  // Real-time animation loop: fold lerp + floating bob + mirror updates
  useFrame(() => {
    const t = performance.now() * 0.001;

    // Gentle floating breathing motion
    if (rootGroupRef.current) {
      rootGroupRef.current.position.y = Math.sin(t * 0.7) * 0.06;
      rootGroupRef.current.rotation.x = Math.sin(t * 0.5) * 0.015;
    }

    // Live update mirrored texture per frame
    if (mirrorTexRef.current && sourceCanvas) {
      mirrorTexRef.current.needsUpdate = true;
    }

    // Accordion fold rotation angles
    // foldProgress 0 = flat open (~0.25 rad), 1 = tightly folded accordion (~2.95 rad)
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
          PANEL TENGAH (CENTER PANEL) — BASE DENGAN KANVAS UTAMA & MIRRORING
          ═════════════════════════════════════════════════════════════════════ */}
      <group position={[0, 0, 0]}>
        {/* Core bark panel slab */}
        <mesh castShadow receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={[W, H, D]} />
          <meshStandardMaterial
            map={barkTex || undefined}
            color={barkTex ? '#ffffff' : '#422817'}
            roughness={0.88}
            metalness={0.06}
          />
        </mesh>

        {/* Front surface: Page texture or Real-Time Mirror Canvas */}
        <mesh position={[0, 0, D / 2 + 0.005]}>
          <planeGeometry args={[W - 0.1, H - 0.1]} />
          <meshStandardMaterial
            map={mirrorTexRef.current || pageTex || undefined}
            roughness={0.82}
            metalness={0.02}
            emissive={mirrorTexRef.current ? '#3A2010' : '#1A1208'}
            emissiveIntensity={0.2}
          />
        </mesh>

        {/* Central interactive click zones */}
        <mesh
          position={[-W / 4, 0, D / 2 + 0.08]}
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
        >
          <planeGeometry args={[W / 2, H]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

        <mesh
          position={[W / 4, 0, D / 2 + 0.08]}
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
        >
          <planeGeometry args={[W / 2, H]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      </group>

      {/* ═════════════════════════════════════════════════════════════════════
          ENGSEL KIRI & PANEL KIRI (LEFT HINGED ACCORDION PANEL)
          ═════════════════════════════════════════════════════════════════════ */}
      <group ref={leftPivotRef} position={[-W / 2, 0, 0]}>
        {/* Flexible accordion leather seam connector */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, H + 0.04, 12]} />
          <meshStandardMaterial color="#221208" roughness={0.9} />
        </mesh>

        {/* Panel body extending to the left from the hinge */}
        <mesh position={[-W / 2, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[W, H, D]} />
          <meshStandardMaterial
            map={barkTex || undefined}
            color={barkTex ? '#ffffff' : '#3E2413'}
            roughness={0.85}
          />
        </mesh>

        {/* Engraved Gorga ornament on left inner panel */}
        <mesh position={[-W / 2, 0, D / 2 + 0.005]}>
          <planeGeometry args={[W - 0.15, H - 0.15]} />
          <meshStandardMaterial
            color="#EFE2C6"
            roughness={0.9}
            map={pageTex || undefined}
          />
        </mesh>
      </group>

      {/* ═════════════════════════════════════════════════════════════════════
          ENGSEL KANAN & PANEL KANAN (RIGHT HINGED ACCORDION PANEL)
          ═════════════════════════════════════════════════════════════════════ */}
      <group ref={rightPivotRef} position={[W / 2, 0, 0]}>
        {/* Flexible accordion leather seam connector */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, H + 0.04, 12]} />
          <meshStandardMaterial color="#221208" roughness={0.9} />
        </mesh>

        {/* Panel body extending to the right from the hinge */}
        <mesh position={[W / 2, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[W, H, D]} />
          <meshStandardMaterial
            map={barkTex || undefined}
            color={barkTex ? '#ffffff' : '#3E2413'}
            roughness={0.85}
          />
        </mesh>

        {/* Gorga pattern on right inner panel */}
        <mesh position={[W / 2, 0, D / 2 + 0.005]}>
          <planeGeometry args={[W - 0.15, H - 0.15]} />
          <meshStandardMaterial
            color="#EFE2C6"
            roughness={0.9}
            map={pageTex || undefined}
          />
        </mesh>
      </group>

      {/* Navigation hints floating below center book */}
      <Html position={[0, -H / 2 - 0.35, D / 2]} center>
        <div className="pointer-events-none flex select-none items-center gap-2 rounded-full border border-charcoal-border/50 bg-charcoal/80 px-4 py-1 text-[11px] text-bone-muted backdrop-blur-md">
          <span>← Halaman Lalu</span>
          <span className="text-crimson">•</span>
          <span>Halaman Lanjut →</span>
        </div>
      </Html>
    </group>
  );
}
