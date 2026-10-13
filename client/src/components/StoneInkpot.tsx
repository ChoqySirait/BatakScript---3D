'use client';

import React, { useRef, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { sound } from '@/lib/audio';

export type InkType = 'charcoal' | 'gold';

interface StoneInkpotProps {
  position: [number, number, number];
  activeInk: InkType;
  onSelectInk: (type: InkType) => void;
}

export default function StoneInkpot({
  position,
  activeInk,
  onSelectInk,
}: StoneInkpotProps) {
  const groupRef = useRef<THREE.Group>(null);
  const goldInkRef = useRef<THREE.Mesh>(null);
  const stylusRef = useRef<THREE.Group>(null);

  const [hoveredWell, setHoveredWell] = useState<InkType | null>(null);

  // Subtle liquid shimmer on gold ink
  useFrame(() => {
    const t = performance.now() * 0.001;
    if (goldInkRef.current) {
      const mat = goldInkRef.current.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.emissiveIntensity = 0.35 + Math.sin(t * 3.5) * 0.18;
      }
    }
  });

  const handleSelect = (type: InkType, e?: ThreeEvent<MouseEvent | PointerEvent>) => {
    e?.stopPropagation();
    sound.playSpatialInkDip(position);
    sound.playHasapiPluck(type === 'gold' ? 4 : 1, position);
    onSelectInk(type);

    // Stylus dipping dip tilt animation
    if (stylusRef.current) {
      stylusRef.current.rotation.x = -Math.PI / 3;
      setTimeout(() => {
        if (stylusRef.current) {
          stylusRef.current.rotation.x = -Math.PI / 4.5;
        }
      }, 250);
    }
  };

  return (
    <group ref={groupRef} position={position}>
      {/* ── 1. Carved Volcanic Stone Mortar Dish ── */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[1.5, 0.28, 1.0]} />
        <meshStandardMaterial
          color="#2B2827"
          roughness={0.92}
          metalness={0.1}
        />
      </mesh>

      {/* Decorative Stone Bevel Rims */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[1.54, 0.04, 1.04]} />
        <meshStandardMaterial color="#1E1C1B" roughness={0.95} />
      </mesh>

      {/* ── 2. Well A: Charcoal Black Ink (Left Well) ── */}
      <group position={[-0.38, 0.12, 0]}>
        {/* Stone cavity depression */}
        <mesh position={[0, 0.01, 0]}>
          <cylinderGeometry args={[0.28, 0.24, 0.06, 20]} />
          <meshStandardMaterial color="#161515" roughness={0.96} />
        </mesh>

        {/* Viscous black liquid surface (interactive) */}
        <mesh
          position={[0, 0.035, 0]}
          onClick={(e) => handleSelect('charcoal', e)}
          onPointerOver={() => setHoveredWell('charcoal')}
          onPointerOut={() => setHoveredWell(null)}
        >
          <cylinderGeometry args={[0.26, 0.26, 0.02, 20]} />
          <meshStandardMaterial
            color="#080809"
            roughness={0.2}
            metalness={0.15}
            emissive={activeInk === 'charcoal' ? '#333338' : '#000000'}
            emissiveIntensity={0.2}
          />
        </mesh>

        {/* Active Ring Indicator */}
        {activeInk === 'charcoal' && (
          <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.27, 0.3, 24]} />
            <meshBasicMaterial color="#737373" />
          </mesh>
        )}
      </group>

      {/* ── 3. Well B: Mystic Gold Dust Ink (Right Well) ── */}
      <group position={[0.38, 0.12, 0]}>
        {/* Stone cavity depression */}
        <mesh position={[0, 0.01, 0]}>
          <cylinderGeometry args={[0.28, 0.24, 0.06, 20]} />
          <meshStandardMaterial color="#1E1C1A" roughness={0.94} />
        </mesh>

        {/* Shimmering liquid gold surface (interactive) */}
        <mesh
          ref={goldInkRef}
          position={[0, 0.035, 0]}
          onClick={(e) => handleSelect('gold', e)}
          onPointerOver={() => setHoveredWell('gold')}
          onPointerOut={() => setHoveredWell(null)}
        >
          <cylinderGeometry args={[0.26, 0.26, 0.02, 20]} />
          <meshStandardMaterial
            color="#E5C158"
            roughness={0.25}
            metalness={0.85}
            emissive="#D4AF37"
            emissiveIntensity={0.4}
          />
        </mesh>

        {/* Active Ring Indicator */}
        {activeInk === 'gold' && (
          <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.27, 0.31, 24]} />
            <meshBasicMaterial color="#FFD700" />
          </mesh>
        )}
      </group>

      {/* ── 4. Traditional Bamboo Stylus (Kalam Bambu / Tulan Datu) ── */}
      <group
        ref={stylusRef}
        position={[0.72, 0.18, 0.15]}
        rotation={[-Math.PI / 4.5, 0.25, 0.15]}
      >
        {/* Bamboo shaft */}
        <mesh castShadow position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.022, 0.026, 0.9, 12]} />
          <meshStandardMaterial
            color="#8A6739"
            roughness={0.65}
            metalness={0.1}
          />
        </mesh>

        {/* Bamboo segment joints */}
        <mesh position={[0, 0.32, 0]}>
          <cylinderGeometry args={[0.028, 0.028, 0.03, 12]} />
          <meshStandardMaterial color="#5C4222" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.62, 0]}>
          <cylinderGeometry args={[0.027, 0.027, 0.03, 12]} />
          <meshStandardMaterial color="#5C4222" roughness={0.8} />
        </mesh>

        {/* Stylus dipped nib tip */}
        <mesh position={[0, -0.05, 0]}>
          <coneGeometry args={[0.022, 0.14, 10]} />
          <meshStandardMaterial
            color={activeInk === 'gold' ? '#FFD700' : '#111113'}
            roughness={0.3}
            metalness={activeInk === 'gold' ? 0.9 : 0.1}
          />
        </mesh>
      </group>
    </group>
  );
}
