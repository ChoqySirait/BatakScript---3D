'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, Text, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

// ── 19 Ina ni Surat data ─────────────────────────────────────────────────────
const INA_NI_SURAT = [
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

// ── Dynamic point light that follows mouse ────────────────────────────────────
function DynamicLight() {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ mouse, viewport }) => {
    if (lightRef.current) {
      lightRef.current.position.x = (mouse.x * viewport.width) / 2;
      lightRef.current.position.y = (mouse.y * viewport.height) / 2;
    }
  });

  return (
    <pointLight
      ref={lightRef}
      position={[0, 0, 6]}
      intensity={3}
      color="#FFD700"
      distance={20}
      decay={2}
    />
  );
}

// ── Wood grain cover texture ──────────────────────────────────────────────────
function useCoverTexture() {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 700;
    const ctx = canvas.getContext('2d')!;

    // Base wood colour
    ctx.fillStyle = '#5C3A1E';
    ctx.fillRect(0, 0, 512, 700);

    // Wood grain lines
    const rng = (() => { let s = 42; return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; }; })();
    for (let i = 0; i < 100; i++) {
      const y = rng() * 700;
      const alpha = 0.05 + rng() * 0.15;
      ctx.strokeStyle = `rgba(255,200,120,${alpha})`;
      ctx.lineWidth = 1 + rng() * 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= 512; x += 16) {
        ctx.lineTo(x, y + Math.sin(x * 0.03 + rng()) * 6);
      }
      ctx.stroke();
    }

    // Outer border
    ctx.strokeStyle = '#3D2010';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, 502, 690);
    ctx.strokeStyle = '#A0724A';
    ctx.lineWidth = 2;
    ctx.strokeRect(18, 18, 476, 664);

    // Title
    ctx.font = 'bold 34px Arial, sans-serif';
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 16;
    ctx.textAlign = 'center';
    ctx.fillText('PUSTAHA', 256, 90);
    ctx.fillText('LAKLAK', 256, 132);
    ctx.shadowBlur = 0;

    // Divider
    ctx.strokeStyle = '#A0724A';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, 155); ctx.lineTo(452, 155);
    ctx.stroke();

    // Subtitle
    ctx.font = '18px Arial, sans-serif';
    ctx.fillStyle = '#C8A060';
    ctx.fillText('Surat Batak Toba', 256, 178);

    return new THREE.CanvasTexture(canvas);
  }, []);
}

// ── Per-glyph page texture ────────────────────────────────────────────────────
function usePageTexture(idx: number) {
  const [tex, setTex] = useState<THREE.CanvasTexture | null>(null);
  const { glyph, latin, sound, unicode } = INA_NI_SURAT[idx];

  useEffect(() => {
    const build = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 700;
      const ctx = canvas.getContext('2d')!;

      // Parchment background
      ctx.fillStyle = '#F5F0E8';
      ctx.fillRect(0, 0, 512, 700);

      // Subtle grain
      for (let i = 0; i < 2000; i++) {
        const x = Math.random() * 512, y = Math.random() * 700;
        ctx.fillStyle = `rgba(120,90,50,${Math.random() * 0.07})`;
        ctx.fillRect(x, y, 2, 2);
      }

      // Border
      ctx.strokeStyle = '#C8A060';
      ctx.lineWidth = 6;
      ctx.strokeRect(14, 14, 484, 672);

      // Chapter label
      ctx.font = 'bold 16px Arial, sans-serif';
      ctx.fillStyle = '#8B6040';
      ctx.textAlign = 'center';
      ctx.fillText(`Ina ni Surat · ${idx + 1} / ${INA_NI_SURAT.length}`, 256, 52);

      // Divider
      ctx.strokeStyle = '#C8A060';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(80, 66); ctx.lineTo(432, 66);
      ctx.stroke();

      // Glyph (gold glow)
      ctx.save();
      ctx.font = '240px "Noto Sans Batak", serif';
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 40;
      ctx.fillStyle = '#FFD700';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(glyph, 256, 310);
      ctx.restore();

      // Latin name
      ctx.font = 'bold 48px Arial, sans-serif';
      ctx.fillStyle = '#3D2010';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(latin, 256, 510);

      // IPA sound
      ctx.font = '26px Arial, sans-serif';
      ctx.fillStyle = '#8B6040';
      ctx.fillText(sound, 256, 548);

      // Unicode
      ctx.font = '18px "Courier New", monospace';
      ctx.fillStyle = '#C8A060';
      ctx.fillText(unicode, 256, 650);

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

// ── Main Pustaha book mesh ────────────────────────────────────────────────────
interface BookProps {
  pageIndex: number;
  onNext: () => void;
  onPrev: () => void;
}

export function PustahaBook({ pageIndex, onNext, onPrev }: BookProps) {
  const groupRef = useRef<THREE.Group>(null);
  const coverTex = useCoverTexture();
  const pageTex  = usePageTexture(pageIndex);

  // Gentle floating + subtle yaw
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;
    groupRef.current.position.y  = Math.sin(t * 0.6) * 0.08;
    groupRef.current.rotation.z  = Math.sin(t * 0.4) * 0.015;
  });

  const W = 2.6, H = 3.6, D = 0.22;

  return (
    <group ref={groupRef}>
      {/* ── Back cover ── */}
      <mesh position={[0, 0, -(D / 2 + 0.06)]} castShadow>
        <boxGeometry args={[W + 0.12, H + 0.12, 0.1]} />
        <meshStandardMaterial color="#3D2010" roughness={0.9} metalness={0.05} />
      </mesh>

      {/* ── Pages block ── */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[W - 0.08, H - 0.06, D]} />
        <meshStandardMaterial color="#EDE5CC" roughness={1} />
      </mesh>

      {/* ── Front cover (wood texture) ── */}
      <mesh position={[0, 0, D / 2 + 0.06]} castShadow>
        <boxGeometry args={[W + 0.12, H + 0.12, 0.1]} />
        <meshStandardMaterial map={coverTex} roughness={0.85} metalness={0.08} />
      </mesh>

      {/* ── Current glyph page (front face of pages block) ── */}
      {pageTex && (
        <mesh position={[0, 0, D / 2 + 0.01]}>
          <planeGeometry args={[W - 0.1, H - 0.08]} />
          <meshStandardMaterial
            map={pageTex}
            roughness={0.9}
            metalness={0}
            transparent={false}
          />
        </mesh>
      )}

      {/* ── Spine detail ── */}
      <mesh position={[-(W / 2 + 0.05), 0, 0]}>
        <boxGeometry args={[0.04, H + 0.12, D + 0.14]} />
        <meshStandardMaterial color="#2A1508" roughness={0.95} />
      </mesh>

      {/* ── Click zones (invisible planes) ── */}
      {/* Previous — left half */}
      <mesh
        position={[-(W / 4), 0, D / 2 + 0.15]}
        onClick={e => { e.stopPropagation(); onPrev(); }}
      >
        <planeGeometry args={[W / 2, H]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Next — right half */}
      <mesh
        position={[W / 4, 0, D / 2 + 0.15]}
        onClick={e => { e.stopPropagation(); onNext(); }}
      >
        <planeGeometry args={[W / 2, H]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* ── Hover labels ── */}
      <Html position={[-(W / 4), -(H / 2 + 0.3), D / 2 + 0.1]} center>
        <div className="pointer-events-none select-none rounded-full bg-charcoal/80 px-3 py-1 text-xs text-bone-dim">
          ← Sebelumnya
        </div>
      </Html>
      <Html position={[W / 4, -(H / 2 + 0.3), D / 2 + 0.1]} center>
        <div className="pointer-events-none select-none rounded-full bg-charcoal/80 px-3 py-1 text-xs text-bone-dim">
          Berikutnya →
        </div>
      </Html>
    </group>
  );
}

export { INA_NI_SURAT };

