'use client';

import React, { useRef, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { sound } from '@/lib/audio';

interface RitualBellProps {
  position: [number, number, number];
  onValidate: () => void;
  onClear?: () => void;
  isValidating?: boolean;
}

export default function RitualBell({
  position,
  onValidate,
  onClear,
  isValidating = false,
}: RitualBellProps) {
  const bellGroupRef = useRef<THREE.Group>(null);
  const auraRef = useRef<THREE.Mesh>(null);

  const [isSwinging, setIsSwinging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const swingStartTimeRef = useRef(0);

  useFrame(() => {
    const t = performance.now() * 0.001;

    // Bell swing physics decay
    if (isSwinging && bellGroupRef.current) {
      const elapsed = t - swingStartTimeRef.current;
      if (elapsed < 1.8) {
        const decay = Math.exp(-elapsed * 2.2);
        bellGroupRef.current.rotation.z = Math.sin(elapsed * 18.0) * 0.35 * decay;
        bellGroupRef.current.rotation.x = Math.cos(elapsed * 12.0) * 0.15 * decay;
      } else {
        bellGroupRef.current.rotation.z = 0;
        bellGroupRef.current.rotation.x = 0;
        setIsSwinging(false);
      }
    }

    // Aura pulse when validating
    if (auraRef.current) {
      if (isValidating || isHovered) {
        auraRef.current.scale.setScalar(1.0 + Math.sin(t * 8.0) * 0.12);
        (auraRef.current.material as THREE.MeshBasicMaterial).opacity =
          0.35 + Math.sin(t * 8.0) * 0.2;
      } else {
        auraRef.current.scale.setScalar(0.001);
        (auraRef.current.material as THREE.MeshBasicMaterial).opacity = 0;
      }
    }
  });

  const handleClick = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    swingStartTimeRef.current = performance.now() * 0.001;
    setIsSwinging(true);
    sound.playSpatialBellChime(position);
    onValidate();
  };

  return (
    <group position={position}>
      {/* ── 1. Sacred Wooden Stand ── */}
      {/* Base Pedestal */}
      <mesh castShadow receiveShadow position={[0, -0.22, 0]}>
        <cylinderGeometry args={[0.55, 0.65, 0.16, 20]} />
        <meshStandardMaterial
          color="#332014"
          roughness={0.88}
          metalness={0.15}
        />
      </mesh>

      {/* Upright Stanchion Pillars */}
      <mesh castShadow position={[-0.32, 0.45, 0]}>
        <cylinderGeometry args={[0.035, 0.045, 1.2, 12]} />
        <meshStandardMaterial color="#4A2E19" roughness={0.75} />
      </mesh>
      <mesh castShadow position={[0.32, 0.45, 0]}>
        <cylinderGeometry args={[0.035, 0.045, 1.2, 12]} />
        <meshStandardMaterial color="#4A2E19" roughness={0.75} />
      </mesh>

      {/* Top Crossbar beam */}
      <mesh castShadow position={[0, 1.05, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.78, 12]} />
        <meshStandardMaterial color="#4A2E19" roughness={0.75} />
      </mesh>

      {/* Decorative Gorga finials */}
      <mesh position={[-0.36, 1.05, 0]}>
        <sphereGeometry args={[0.07, 10, 10]} />
        <meshStandardMaterial color="#D4AF37" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0.36, 1.05, 0]}>
        <sphereGeometry args={[0.07, 10, 10]} />
        <meshStandardMaterial color="#D4AF37" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* ── 2. Swinging Bronze Ritual Bell (Genta Datu) ── */}
      <group
        ref={bellGroupRef}
        position={[0, 0.98, 0]}
        onClick={handleClick}
        onPointerOver={() => setIsHovered(true)}
        onPointerOut={() => setIsHovered(false)}
      >
        {/* Suspension loop ring */}
        <mesh position={[0, 0.02, 0]}>
          <torusGeometry args={[0.06, 0.015, 8, 16]} />
          <meshStandardMaterial color="#C59B27" metalness={0.85} roughness={0.25} />
        </mesh>

        {/* Bell Body Dome */}
        <mesh castShadow position={[0, -0.32, 0]}>
          <cylinderGeometry args={[0.14, 0.36, 0.58, 24, 1, true]} />
          <meshStandardMaterial
            color={isHovered ? '#DFB748' : '#B8860B'}
            roughness={0.32}
            metalness={0.88}
          />
        </mesh>

        {/* Bell Top Cap */}
        <mesh position={[0, -0.04, 0]}>
          <sphereGeometry args={[0.14, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <meshStandardMaterial color="#B8860B" roughness={0.32} metalness={0.88} />
        </mesh>

        {/* Bell Flanged Rim Lip */}
        <mesh position={[0, -0.61, 0]}>
          <torusGeometry args={[0.36, 0.035, 10, 24]} />
          <meshStandardMaterial color="#E0B644" roughness={0.28} metalness={0.92} />
        </mesh>

        {/* Inner Clapper */}
        <mesh position={[0, -0.42, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.42, 8]} />
          <meshStandardMaterial color="#4A3416" roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.64, 0]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial color="#A07818" metalness={0.9} roughness={0.3} />
        </mesh>

        {/* Mystical validation aura */}
        <mesh ref={auraRef} position={[0, -0.35, 0]}>
          <sphereGeometry args={[0.62, 16, 16]} />
          <meshBasicMaterial color="#FFD700" transparent opacity={0} wireframe />
        </mesh>
      </group>

      {/* ── 3. Small Water Wiper Bowl for Resetting Canvas (Pangurason) ── */}
      {onClear && (
        <group
          position={[0, -0.06, 0.48]}
          onClick={(e) => {
            e.stopPropagation();
            sound.playSpatialBrushScratch(position, 2.5);
            onClear();
          }}
        >
          <mesh castShadow position={[0, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.14, 0.14, 16]} />
            <meshStandardMaterial color="#2B362F" roughness={0.6} metalness={0.3} />
          </mesh>
          <mesh position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.02, 16]} />
            <meshStandardMaterial
              color="#5CA595"
              roughness={0.2}
              metalness={0.4}
              transparent
              opacity={0.85}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}
