'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  OrbitControls,
  Environment,
  ContactShadows,
} from '@react-three/drei';
import { PustahaBook } from './PustahaBook';

// Dynamic point light following mouse is inside PustahaBook.tsx via useFrame

interface Props {
  pageIndex: number;
  onNext: () => void;
  onPrev: () => void;
}

export default function PustahaCanvas({ pageIndex, onNext, onPrev }: Props) {
  return (
    <Canvas
      camera={{ position: [0, 0, 6.5], fov: 45 }}
      shadows
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      {/* ── Lighting ── */}
      {/* Soft ambient fill */}
      <ambientLight intensity={0.55} color="#FFF8E7" />

      {/* Studio key light */}
      <directionalLight
        position={[4, 6, 4]}
        intensity={1.4}
        color="#FFFBE0"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      {/* Rim / fill light */}
      <directionalLight position={[-4, 2, -2]} intensity={0.5} color="#FFD700" />

      {/* Dynamic mouse point light (handled inside book via useFrame) */}
      <pointLight position={[0, 0, 8]} intensity={1.8} color="#FFE080" distance={18} decay={2} />

      {/* ── Environment (PBR reflections) ── */}
      <Environment preset="studio" />

      {/* ── Pustaha book ── */}
      <Suspense fallback={null}>
        <PustahaBook
          pageIndex={pageIndex}
          onNext={onNext}
          onPrev={onPrev}
        />
      </Suspense>

      {/* ── Ground shadow ── */}
      <ContactShadows
        position={[0, -2.4, 0]}
        opacity={0.45}
        scale={8}
        blur={2.5}
        far={5}
      />

      {/* ── Controls ── */}
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={3.5}
        maxDistance={12}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 1.6}
        autoRotate={false}
        dampingFactor={0.08}
        enableDamping
      />
    </Canvas>
  );
}

