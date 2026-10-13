'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { InkType } from './StoneInkpot';
import { Point } from '@/lib/strokeEvaluator';

const PustahaCanvas = dynamic(() => import('./PustahaCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-screen items-center justify-center bg-[#070709]">
      <div className="text-center space-y-4">
        <div className="batak-text text-7xl text-gold animate-pulse">ᯅ</div>
        <p className="text-sm font-semibold tracking-wider text-bone-muted uppercase">
          Menyiapkan Bilik Ritual Datu Bolon…
        </p>
      </div>
    </div>
  ),
});

interface PustahaSceneProps {
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

export default function PustahaScene(props: PustahaSceneProps) {
  return (
    <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-[#070709] select-none">
      <PustahaCanvas {...props} />
    </div>
  );
}
