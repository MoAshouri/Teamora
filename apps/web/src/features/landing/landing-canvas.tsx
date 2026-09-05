'use client';

import { Suspense, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { CourtyardScene } from './courtyard-scene';

export function LandingCanvas({
  rtl,
  compact,
  lowGpu,
  ready,
  onReady,
}: {
  rtl: boolean;
  compact: boolean;
  lowGpu: boolean;
  ready: boolean;
  onReady: () => void;
}) {
  const [visible, setVisible] = useState(true);
  const [dpr, setDpr] = useState<number>(1);

  useEffect(() => {
    setDpr(Math.min(lowGpu ? 1.25 : 1.75, window.devicePixelRatio || 1));
    const onVis = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [lowGpu]);

  return (
    <div className="landing-canvas" aria-hidden="true" data-ready={ready}>
      <Canvas
        frameloop={visible ? 'always' : 'never'}
        dpr={dpr}
        shadows={lowGpu ? false : 'soft'}
        gl={{
          antialias: true,
          alpha: false,
          stencil: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.NeutralToneMapping,
          toneMappingExposure: 1.02,
        }}
        camera={{ fov: 36, near: 0.1, far: 70, position: [0, 1.8, 12.6] }}
        style={{ pointerEvents: 'none' }}
      >
        <PerformanceMonitor
          onDecline={() => setDpr((d) => Math.max(1, d - 0.25))}
          onIncline={() => setDpr((d) => Math.min(lowGpu ? 1.25 : 1.75, d + 0.25))}
          flipflops={3}
        />
        <Suspense fallback={null}>
          <CourtyardScene rtl={rtl} compact={compact} shadows={!lowGpu} onReady={onReady} />
        </Suspense>
      </Canvas>
    </div>
  );
}
