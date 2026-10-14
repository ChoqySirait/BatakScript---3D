'use client';

import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { sound } from '@/lib/audio';

// 12 Batak Lunar Months
export const BATAK_MONTHS = [
  { name: 'Sipaha Sada', sign: 'ᯘᯪᯇᯂ ᯘᯑ', constellation: 'Bintang Porhalaan (Scorpio)' },
  { name: 'Sipaha Dua', sign: 'ᯘᯪᯇᯂ ᯑᯮᯀ', constellation: 'Bintang Sisinga (Leo)' },
  { name: 'Sipaha Tolu', sign: 'ᯘᯪᯇᯂ ᯖᯬᯞᯮ', constellation: 'Bintang Parhorbo (Taurus)' },
  { name: 'Sipaha Opat', sign: 'ᯘᯪᯇᯂ ᯀᯬᯇᯖ᯲', constellation: 'Bintang Poti (Pleiades)' },
  { name: 'Sipaha Lima', sign: 'ᯘᯪᯇᯂ ᯞᯪᯔ', constellation: 'Bintang Tolu (Orion)' },
  { name: 'Sipaha Onom', sign: 'ᯘᯪᯇᯂ ᯀᯬᯉᯬᯔ᯲', constellation: 'Bintang Rangkea' },
  { name: 'Sipaha Pitu', sign: 'ᯘᯪᯇᯂ ᯇᯪᯖᯮ', constellation: 'Bintang Gumba' },
  { name: 'Sipaha Ualu', sign: 'ᯘᯪᯇᯂ ᯥᯀᯞᯮ', constellation: 'Bintang Pandurungan' },
  { name: 'Sipaha Sia', sign: 'ᯘᯪᯇᯂ ᯘᯪᯀ', constellation: 'Bintang Panangga' },
  { name: 'Sipaha Sampulu', sign: 'ᯘᯪᯇᯂ ᯘᯔ᯲ᯇᯮᯞᯮ', constellation: 'Bintang Silo' },
  { name: 'Li (Sampulu Sada)', sign: 'ᯞᯪ', constellation: 'Bintang Parompuan' },
  { name: 'Hurung (Sampulu Dua)', sign: 'ᯂᯮᯒᯮᯰ', constellation: 'Bintang Sangkalan' },
];

// 8 Sacred Cosmic Wind Directions (Desa Na Ualu)
export const DESA_NA_UALU = [
  { name: 'Purba (Timur)', sign: 'ᯇᯮᯒ᯲ᯅ' },
  { name: 'Anggara (Tenggara)', sign: 'ᯀᯰᯎᯒ' },
  { name: 'Dangsina (Selatan)', sign: 'ᯑᯰᯘᯪᯉ' },
  { name: 'Nariti (Barat Daya)', sign: 'ᯉᯒᯪᯖᯪ' },
  { name: 'Pastima (Barat)', sign: 'ᯇᯘ᯲ᯖᯪᯔ' },
  { name: 'Manabia (Barat Laut)', sign: 'ᯔᯉᯅᯪᯀ' },
  { name: 'Otara (Utara)', sign: 'ᯀᯬᯖᯒ' },
  { name: 'Mangabia (Timur Laut)', sign: 'ᯔᯝᯅᯪᯀ' },
];

interface PorhalaanWheelProps {
  position?: [number, number, number];
  onSolved?: () => void;
  isUnlocked?: boolean;
}

export default function PorhalaanWheel({
  position = [0, 0, 0],
  onSolved,
  isUnlocked = false,
}: PorhalaanWheelProps) {
  const outerRingRef = useRef<THREE.Group>(null);
  const innerRingRef = useRef<THREE.Group>(null);

  // Rotation states in radians
  const [outerAngle, setOuterAngle] = useState(0);
  const [innerAngle, setInnerAngle] = useState(0);
  const [activeDrag, setActiveDrag] = useState<'outer' | 'inner' | null>(null);
  const [solved, setSolved] = useState(isUnlocked);

  const prevPointerAngleRef = useRef(0);
  const lastPluckStepRef = useRef(0);

  // Target riddle: Outer month 0 (Sipaha Sada) aligned with Inner direction 0 (Purba)
  // Check alignment
  useEffect(() => {
    if (solved) return;
    const normOuter = ((outerAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const normInner = ((innerAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const diff = Math.abs(normOuter - normInner);

    // If within 0.15 radians (~8.5 degrees)
    if (diff < 0.15 || Math.abs(diff - Math.PI * 2) < 0.15) {
      setSolved(true);
      sound.playEthnicSuccessChime();
      sound.playHasapiPluck(5, [position[0], position[1], position[2]]);
      onSolved?.();
    }
  }, [outerAngle, innerAngle, solved, onSolved, position]);

  // Texture generator for Outer Ring (12 Batak Months)
  const outerTex = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 1024, 1024);

    // Parchment/wood circle base
    ctx.beginPath();
    ctx.arc(512, 512, 500, 0, Math.PI * 2);
    ctx.fillStyle = '#EBD5AF';
    ctx.fill();

    // Dark wood outer border
    ctx.strokeStyle = '#5E381A';
    ctx.lineWidth = 14;
    ctx.stroke();

    // Inner gold rim
    ctx.strokeStyle = '#C99D3E';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(512, 512, 360, 0, Math.PI * 2);
    ctx.stroke();

    // 12 Sector Dividers & Batak Month Glyphs
    const numSectors = 12;
    for (let i = 0; i < numSectors; i++) {
      const angle = (i * 2 * Math.PI) / numSectors;

      // Divider line
      ctx.beginPath();
      ctx.moveTo(512 + Math.cos(angle) * 360, 512 + Math.sin(angle) * 360);
      ctx.lineTo(512 + Math.cos(angle) * 492, 512 + Math.sin(angle) * 492);
      ctx.strokeStyle = '#8B5A2B';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Month Text & Inscription
      ctx.save();
      ctx.translate(512, 512);
      ctx.rotate(angle + Math.PI / numSectors);

      ctx.fillStyle = '#3E2413';
      ctx.font = 'bold 26px "Noto Sans Batak", serif';
      ctx.textAlign = 'center';
      ctx.fillText(BATAK_MONTHS[i].sign, 430, 8);

      ctx.font = 'bold 15px Arial, sans-serif';
      ctx.fillStyle = '#6E4522';
      ctx.fillText(`M${i + 1}`, 380, 5);

      ctx.restore();
    }

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, []);

  // Texture generator for Inner Ring (8 Cosmic Wind Directions)
  const innerTex = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 1024, 1024);

    ctx.beginPath();
    ctx.arc(512, 512, 480, 0, Math.PI * 2);
    ctx.fillStyle = '#D9B884';
    ctx.fill();

    ctx.strokeStyle = '#7A4B20';
    ctx.lineWidth = 12;
    ctx.stroke();

    // 8 Wind Directions (Desa Na Ualu)
    const numDirs = 8;
    for (let i = 0; i < numDirs; i++) {
      const angle = (i * 2 * Math.PI) / numDirs;

      ctx.beginPath();
      ctx.moveTo(512 + Math.cos(angle) * 180, 512 + Math.sin(angle) * 180);
      ctx.lineTo(512 + Math.cos(angle) * 470, 512 + Math.sin(angle) * 470);
      ctx.strokeStyle = '#5E381A';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.save();
      ctx.translate(512, 512);
      ctx.rotate(angle + Math.PI / numDirs);

      ctx.fillStyle = '#2B160A';
      ctx.font = 'bold 32px "Noto Sans Batak", serif';
      ctx.textAlign = 'center';
      ctx.fillText(DESA_NA_UALU[i].sign, 340, 10);

      ctx.font = 'bold 17px Arial, sans-serif';
      ctx.fillStyle = '#5A3314';
      ctx.fillText(DESA_NA_UALU[i].name.split(' ')[0], 250, 6);

      ctx.restore();
    }

    // Sacred center circle
    ctx.beginPath();
    ctx.arc(512, 512, 180, 0, Math.PI * 2);
    ctx.fillStyle = '#3E2413';
    ctx.fill();
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Sacred Scorpio (Hala) constellation glyph in center
    ctx.font = 'bold 72px "Noto Sans Batak", serif';
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ᯇᯬᯒ᯲ᯂᯞ', 512, 512);

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, []);

  // Compute pointer angle relative to center of wheel
  const getPointerAngle = (e: ThreeEvent<PointerEvent>) => {
    if (!e.uv) return 0;
    // Map UV [0, 1] to [-1, 1]
    const x = e.uv.x - 0.5;
    const y = e.uv.y - 0.5;
    return Math.atan2(y, x);
  };

  const handlePointerDown = (ring: 'outer' | 'inner', e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setActiveDrag(ring);
    prevPointerAngleRef.current = getPointerAngle(e);
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!activeDrag) return;
    e.stopPropagation();
    const currentAngle = getPointerAngle(e);
    const delta = currentAngle - prevPointerAngleRef.current;
    prevPointerAngleRef.current = currentAngle;

    if (activeDrag === 'outer') {
      setOuterAngle((prev) => {
        const next = prev + delta;
        // Audio tick on discrete rotation step
        const step = Math.floor((next / (Math.PI * 2)) * 12);
        if (step !== lastPluckStepRef.current) {
          lastPluckStepRef.current = step;
          sound.playHasapiPluck(Math.abs(step) % 8, position);
        }
        return next;
      });
    } else {
      setInnerAngle((prev) => {
        const next = prev + delta;
        const step = Math.floor((next / (Math.PI * 2)) * 8);
        if (step !== lastPluckStepRef.current) {
          lastPluckStepRef.current = step;
          sound.playHasapiPluck(Math.abs(step) % 8, position);
        }
        return next;
      });
    }
  };

  const handlePointerUp = () => {
    setActiveDrag(null);
  };

  useFrame(() => {
    if (outerRingRef.current) {
      outerRingRef.current.rotation.z = outerAngle;
    }
    if (innerRingRef.current) {
      innerRingRef.current.rotation.z = innerAngle;
    }
  });

  return (
    <group
      position={position}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Base Mount Plate */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.05, 1.05, 0.04, 32]} />
        <meshStandardMaterial color="#2B1A0E" roughness={0.88} metalness={0.2} />
      </mesh>

      {/* ── 1. Outer Ring: 12 Batak Lunar Months ── */}
      <group
        ref={outerRingRef}
        position={[0, 0, 0.025]}
        onPointerDown={(e) => handlePointerDown('outer', e)}
      >
        <mesh>
          <ringGeometry args={[0.62, 0.98, 36]} />
          <meshStandardMaterial
            map={outerTex || undefined}
            roughness={0.65}
            metalness={0.25}
          />
        </mesh>
        <mesh position={[0, 0, -0.01]}>
          <cylinderGeometry args={[0.99, 0.99, 0.02, 36]} />
          <meshStandardMaterial color="#8B5A2B" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>

      {/* ── 2. Inner Ring: 8 Cosmic Wind Directions (Desa Na Ualu) ── */}
      <group
        ref={innerRingRef}
        position={[0, 0, 0.045]}
        onPointerDown={(e) => handlePointerDown('inner', e)}
      >
        <mesh>
          <circleGeometry args={[0.6, 32]} />
          <meshStandardMaterial
            map={innerTex || undefined}
            roughness={0.6}
            metalness={0.35}
            emissive={solved ? '#FFD700' : '#000000'}
            emissiveIntensity={solved ? 0.45 : 0}
          />
        </mesh>
      </group>

      {/* ── 3. Central Pivot Hub & Cosmic Alignment Jewel ── */}
      <mesh position={[0, 0, 0.08]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial
          color={solved ? '#FFD700' : '#8B5A2B'}
          metalness={0.9}
          roughness={0.15}
          emissive={solved ? '#FF9900' : '#331100'}
          emissiveIntensity={solved ? 0.8 : 0.2}
        />
      </mesh>

      {/* Cosmic Radiance Aura on Solved */}
      {solved && (
        <mesh position={[0, 0, 0.05]}>
          <ringGeometry args={[0.08, 1.05, 32]} />
          <meshBasicMaterial color="#FFD700" transparent opacity={0.28} />
        </mesh>
      )}
    </group>
  );
}

