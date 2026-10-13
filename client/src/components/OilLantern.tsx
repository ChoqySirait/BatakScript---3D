'use client';

import React, { useRef, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { sound } from '@/lib/audio';

interface OilLanternProps {
  position: [number, number, number];
  onPositionChange?: (pos: [number, number, number]) => void;
}

export default function OilLantern({
  position: initialPos,
  onPositionChange,
}: OilLanternProps) {
  const groupRef = useRef<THREE.Group>(null);
  const flameRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  const [pos, setPos] = useState<[number, number, number]>(initialPos);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Flame flicker animation and light modulation
  useFrame(() => {
    const t = performance.now() * 0.001;

    // Organic flame flicker
    const flicker =
      Math.sin(t * 16.0) * 0.12 +
      Math.sin(t * 27.0) * 0.08 +
      Math.cos(t * 41.0) * 0.06;

    if (lightRef.current) {
      lightRef.current.intensity = 2.8 + flicker * 0.9;
      lightRef.current.distance = 14 + flicker * 2;
    }

    if (flameRef.current) {
      const scaleY = 1.0 + flicker * 0.35;
      const scaleXZ = 1.0 - flicker * 0.18;
      flameRef.current.scale.set(scaleXZ, scaleY, scaleXZ);
    }
  });

  // Dragging interaction across the ritual desk plane
  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsDragging(true);
    sound.playSpatialBrushScratch(pos, 1.5);
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsDragging(false);
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!isDragging || !e.point) return;
    e.stopPropagation();

    // Constrain lantern movement to desk area
    const newX = Math.max(-4.2, Math.min(4.2, e.point.x));
    const newZ = Math.max(-2.5, Math.min(3.5, e.point.z));
    const newPos: [number, number, number] = [newX, pos[1], newZ];

    setPos(newPos);
    onPositionChange?.(newPos);
    sound.updateLanternPosition(newPos);
  };

  return (
    <group
      ref={groupRef}
      position={pos}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
      onPointerOver={() => setIsHovered(true)}
      onPointerOut={() => {
        setIsHovered(false);
        setIsDragging(false);
      }}
    >
      {/* ── 1. Lantern Ceramic / Brass Base ── */}
      {/* Saucer / Basin */}
      <mesh castShadow receiveShadow position={[0, -0.15, 0]}>
        <cylinderGeometry args={[0.55, 0.42, 0.14, 24]} />
        <meshStandardMaterial
          color={isHovered ? '#B37D38' : '#734A21'}
          roughness={0.7}
          metalness={0.4}
        />
      </mesh>

      {/* Oil reservoir bowl */}
      <mesh castShadow position={[0, 0.04, 0]}>
        <sphereGeometry args={[0.34, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.65]} />
        <meshStandardMaterial
          color="#4A2F17"
          roughness={0.8}
          metalness={0.3}
        />
      </mesh>

      {/* Wick holder spout */}
      <mesh castShadow position={[0.22, 0.16, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <cylinderGeometry args={[0.06, 0.09, 0.28, 12]} />
        <meshStandardMaterial color="#2B1A0E" roughness={0.9} />
      </mesh>

      {/* Glass / protective brass cage arches */}
      <mesh position={[0, 0.38, 0]}>
        <torusGeometry args={[0.3, 0.02, 8, 20]} />
        <meshStandardMaterial color="#B5883C" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.72, 0]}>
        <torusGeometry args={[0.22, 0.02, 8, 20]} />
        <meshStandardMaterial color="#B5883C" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Top cap & ring handle */}
      <mesh castShadow position={[0, 0.88, 0]}>
        <coneGeometry args={[0.26, 0.22, 16]} />
        <meshStandardMaterial color="#6B4520" roughness={0.6} metalness={0.5} />
      </mesh>
      <mesh position={[0, 1.08, 0]}>
        <torusGeometry args={[0.12, 0.02, 8, 16]} />
        <meshStandardMaterial color="#D4AF37" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* ── 2. Flickering Oil Flame ── */}
      <mesh ref={flameRef} position={[0.18, 0.32, 0]}>
        <coneGeometry args={[0.09, 0.28, 12]} />
        <meshBasicMaterial color="#FFB03B" />
      </mesh>

      {/* Flame Inner Core (hot white-yellow) */}
      <mesh position={[0.18, 0.28, 0]} scale={0.55}>
        <sphereGeometry args={[0.08, 10, 10]} />
        <meshBasicMaterial color="#FFF5DD" />
      </mesh>

      {/* ── 3. Dynamic Lantern Point Light ── */}
      <pointLight
        ref={lightRef}
        position={[0.18, 0.38, 0]}
        color="#FFA834"
        intensity={3.2}
        distance={15}
        decay={1.8}
        castShadow
        shadow-bias={-0.001}
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
      />
    </group>
  );
}
