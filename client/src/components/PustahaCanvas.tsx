'use client';

import React, { Suspense, useState, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  ContactShadows,
  Sparkles,
} from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { PustahaBook } from './PustahaBook';
import OilLantern from './OilLantern';
import StoneInkpot, { InkType } from './StoneInkpot';
import RitualBell from './RitualBell';
import { Point } from '@/lib/strokeEvaluator';
import { sound } from '@/lib/audio';

// Subcomponent to synchronize 3D camera with Web Audio listener and scene fog
function RitualChamberEnvironment() {
  const { camera, scene } = useThree();

  // Set scene fog
  React.useEffect(() => {
    scene.fog = new THREE.FogExp2('#070709', 0.045);
  }, [scene]);

  // Update audio listener position and direction per frame
  useFrame(() => {
    const camPos: [number, number, number] = [
      camera.position.x,
      camera.position.y,
      camera.position.z,
    ];
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
    sound.updateListener(
      camPos,
      [forward.x, forward.y, forward.z],
      [up.x, up.y, up.z]
    );
  });

  return null;
}

interface PustahaCanvasProps {
  pageIndex: number;
  foldProgress?: number;
  activeInk: InkType;
  onSelectInk: (ink: InkType) => void;
  onValidate: () => void;
  onClear: () => void;
  isValidating?: boolean;
  onStrokesChange: (strokes: Point[][]) => void;
  onPorhalaanSolved?: () => void;
  isPorhalaanUnlocked?: boolean;
}

export default function PustahaCanvas({
  pageIndex,
  foldProgress = 0.15,
  activeInk,
  onSelectInk,
  onValidate,
  onClear,
  isValidating = false,
  onStrokesChange,
  onPorhalaanSolved,
  isPorhalaanUnlocked = false,
}: PustahaCanvasProps) {
  const [lanternPos, setLanternPos] = useState<[number, number, number]>([
    -2.9, 1.4, 1.1,
  ]);
  const [isPainting, setIsPainting] = useState(false);
  const orbitRef = useRef<OrbitControlsImpl>(null);

  return (
    <Canvas
      camera={{ position: [0, 0.4, 6.2], fov: 42 }}
      shadows
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ background: '#070709' }}
    >
      <RitualChamberEnvironment />

      {/* ── Ritual Chamber Lighting ── */}
      {/* Dim room ambiance */}
      <ambientLight intensity={0.42} color="#FCEBD2" />

      {/* Warm top celestial fill */}
      <directionalLight
        position={[4, 9, 4]}
        intensity={0.9}
        color="#F8E2C2"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0001}
      />

      {/* Subtle Batak crimson back glow */}
      <directionalLight position={[-6, 4, -5]} intensity={0.5} color="#E63946" />

      {/* ── Mystical Ritual Dust & Incense Smoke Embers ── */}
      <Sparkles
        count={65}
        scale={[10, 6, 6]}
        size={2.8}
        speed={0.25}
        opacity={0.55}
        color="#FFD700"
      />

      {/* ── Ritual Altar Desk (Ancient Dark Ironwood Table Slab) ── */}
      <mesh
        receiveShadow
        position={[0, -2.1, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[18, 14]} />
        <meshStandardMaterial
          color="#151210"
          roughness={0.94}
          metalness={0.08}
        />
      </mesh>

      {/* ── 3D Diegetic Interactive Objects Around the Book ── */}
      <Suspense fallback={null}>
        {/* 1. Movable Oil Lantern (Left side of altar) */}
        <OilLantern
          position={lanternPos}
          onPositionChange={setLanternPos}
        />

        {/* 2. Stone Inkpot & Bamboo Stylus (Left foreground) */}
        <StoneInkpot
          position={[-2.7, -1.82, 1.8]}
          activeInk={activeInk}
          onSelectInk={onSelectInk}
        />

        {/* 3. Bronze Ritual Bell & Pangurason Water Bowl (Right foreground) */}
        <RitualBell
          position={[2.8, -1.82, 1.4]}
          onValidate={onValidate}
          onClear={onClear}
          isValidating={isValidating}
        />

        {/* 4. Centerpiece: Pustaha Laklak Accordion Book */}
        <PustahaBook
          pageIndex={pageIndex}
          foldProgress={foldProgress}
          lanternPos={lanternPos}
          activeInk={activeInk}
          onStrokesChange={onStrokesChange}
          onPaintingStateChange={(painting) => {
            setIsPainting(painting);
            if (orbitRef.current) {
              orbitRef.current.enabled = !painting;
            }
          }}
          onPorhalaanSolved={onPorhalaanSolved}
          isPorhalaanUnlocked={isPorhalaanUnlocked}
        />
      </Suspense>

      {/* ── Cinematic Soft Ground Shadows ── */}
      <ContactShadows
        position={[0, -2.05, 0]}
        opacity={0.65}
        scale={10}
        blur={2.6}
        far={6}
      />

      {/* ── Camera Orbit Controls (Disabled while drawing) ── */}
      <OrbitControls
        ref={orbitRef}
        enablePan={false}
        enableZoom={!isPainting}
        minDistance={3.2}
        maxDistance={11}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 1.8}
        dampingFactor={0.06}
        enableDamping
      />
    </Canvas>
  );
}
