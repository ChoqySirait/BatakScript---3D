'use client';

import React, { useState, useCallback } from 'react';
import PustahaScene from '@/components/PustahaScene';
import StrokeCanvas from '@/components/StrokeCanvas';
import FreeCalligraphyStudio from '@/components/FreeCalligraphyStudio';
import PustahaQuestMode from '@/components/PustahaQuestMode';
import TransliterationSandbox from '@/components/TransliterationSandbox';
import BottomIslandDock, { StudioMode } from '@/components/BottomIslandDock';
import RightDrawer from '@/components/RightDrawer';
import { INA_NI_SURAT } from '@/components/PustahaBook';

export default function HomePage() {
  // Active page & 3D book state
  const [activeIdx, setActiveIdx] = useState(0);
  const [foldProgress, setFoldProgress] = useState(0.18);
  const [mirrorCanvas, setMirrorCanvas] = useState<HTMLCanvasElement | null>(null);

  // Active studio mode
  const [activeMode, setActiveMode] = useState<StudioMode>('tracing');
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);

  // Telemetry
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [streakCount, setStreakCount] = useState(0);

  const active = INA_NI_SURAT[activeIdx];

  const handleNextPage = () => {
    setActiveIdx((prev) => (prev + 1) % INA_NI_SURAT.length);
  };

  const handlePrevPage = () => {
    setActiveIdx((prev) => (prev - 1 + INA_NI_SURAT.length) % INA_NI_SURAT.length);
  };

  const handleToggleFold = () => {
    setFoldProgress((prev) => (prev > 0.5 ? 0.15 : 0.85));
  };

  const handleCanvasUpdate = useCallback((canvas: HTMLCanvasElement) => {
    setMirrorCanvas(canvas);
  }, []);

  const handleLessonSuccess = () => {
    setLastScore((prev) => (prev !== null ? Math.max(prev, 85) : 88));
    setStreakCount((prev) => {
      const next = prev + 1;
      if (typeof window !== 'undefined') {
        localStorage.setItem('batakscript_streak', next.toString());
      }
      return next;
    });
  };

  const getDrawerMeta = () => {
    switch (activeMode) {
      case 'quest':
        return { title: 'Babad Pustaha Quest', badge: 'Mode Petualangan' };
      case 'calligraphy':
        return { title: 'Studio Kaligrafi Bebas', badge: 'Ekspor PNG' };
      case 'sandbox':
        return { title: 'Sandbox Transliterasi', badge: 'X-Ray Anatomi' };
      case 'tracing':
      default:
        return { title: `Panduan Tracing Aksara ${active.latin}`, badge: 'Presisi 64-Titik' };
    }
  };

  const drawerMeta = getDrawerMeta();

  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full overflow-hidden select-none">
      {/* ── 1. Full-Screen 3D Immersion Background Stage ── */}
      <PustahaScene
        isFullScreen={true}
        pageIndex={activeIdx}
        onGlyphChange={setActiveIdx}
        sourceCanvas={mirrorCanvas}
        foldProgress={foldProgress}
        onFoldChange={setFoldProgress}
      />

      {/* ── 2. Floating Glass Drawer (Right Side) ── */}
      <RightDrawer
        isOpen={isDrawerOpen}
        onToggle={() => setIsDrawerOpen((v) => !v)}
        title={drawerMeta.title}
        badge={drawerMeta.badge}
      >
        {activeMode === 'tracing' && (
          <StrokeCanvas
            lessonId={activeIdx + 1}
            targetGlyph={active.glyph}
            latinSound={active.latin}
            glyphTitle={`Modul ${activeIdx + 1}: Aksara ${active.latin} (${active.glyph})`}
            onSuccess={handleLessonSuccess}
            onNextLesson={handleNextPage}
            hasNextLesson={activeIdx < INA_NI_SURAT.length - 1}
            onCanvasUpdate={handleCanvasUpdate}
          />
        )}

        {activeMode === 'quest' && (
          <PustahaQuestMode onCanvasUpdate={handleCanvasUpdate} />
        )}

        {activeMode === 'calligraphy' && (
          <FreeCalligraphyStudio onCanvasUpdate={handleCanvasUpdate} />
        )}

        {activeMode === 'sandbox' && (
          <TransliterationSandbox />
        )}
      </RightDrawer>

      {/* ── 3. Bottom Island Dock (Clean Minimalist Island) ── */}
      <BottomIslandDock
        currentPage={activeIdx + 1}
        totalPages={INA_NI_SURAT.length}
        currentGlyph={active.glyph}
        currentLatin={active.latin}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
        foldProgress={foldProgress}
        onToggleFold={handleToggleFold}
        activeMode={activeMode}
        onSelectMode={(mode) => {
          setActiveMode(mode);
          setIsDrawerOpen(true);
        }}
        lastScore={lastScore}
        streakCount={streakCount}
        isDrawerOpen={isDrawerOpen}
        onToggleDrawer={() => setIsDrawerOpen((v) => !v)}
      />
    </div>
  );
}
