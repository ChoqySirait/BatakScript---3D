'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  OrbitControls,
  Environment,
  ContactShadows,
  Sparkles,
} from '@react-three/drei';
import { PustahaBook } from './PustahaBook';

interface PustahaCanvasProps {
  pageIndex: number;
  foldProgress?: number;
  sourceCanvas?: HTMLCanvasElement | null;
  onNext: () => void;
  onPrev: () => void;
}

export default function PustahaCanvas({
  pageIndex,
  foldProgress = 0.15,
  sourceCanvas,
  onNext,
  onPrev,
}: PustahaCanvasProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 7.2], fov: 42 }}
      shadows
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ background: 'transparent' }}
    >
      {/* ── Lighting Studio ── */}
      <ambientLight intensity={0.65} color="#FFF5DC" />

      {/* Cinematic directional key light with warm golden tone */}
      <directionalLight
        position={[5, 7, 5]}
        intensity={1.6}
        color="#FFF2D6"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
      />

      {/* Batak crimson rim accent light */}
      <directionalLight position={[-5, 3, -3]} intensity={0.8} color="#FF2A4D" />

      {/* Warm amber center glow */}
      <pointLight position={[0, 1, 6]} intensity={2.2} color="#FFD700" distance={15} decay={2} />

      {/* ── Mystical Gold Embers / Dust Particles ── */}
      <Sparkles
        count={50}
        scale={[7, 5, 4]}
        size={3.2}
        speed={0.35}
        opacity={0.65}
        color="#FFD700"
      />

      {/* ── Environment reflections ── */}
      <Environment preset="studio" />

      {/* ── Pustaha Book 3D Model ── */}
      <Suspense fallback={null}>
        <PustahaBook
          pageIndex={pageIndex}
          foldProgress={foldProgress}
          sourceCanvas={sourceCanvas}
          onNext={onNext}
          onPrev={onPrev}
        />
      </Suspense>

      {/* ── Soft Cinematic Ground Shadow ── */}
      <ContactShadows
        position={[0, -2.1, 0]}
        opacity={0.55}
        scale={9}
        blur={2.4}
        far={6}
      />

      {/* ── Camera Orbit Controls ── */}
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={3.8}
        maxDistance={12}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 1.7}
        dampingFactor={0.06}
        enableDamping
      />
    </Canvas>
  );
}
