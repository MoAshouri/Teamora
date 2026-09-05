'use client';

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { damp, lerp, samplePath } from '../path';
import { progressStore } from '../progress-store';

const CREAM = new THREE.Color('#ebe3d4');
const NIGHT = new THREE.Color('#0b0e0f');

/**
 * Camera follows the scroll path with exponential damping, adds a touch of pointer parallax,
 * and keeps a constant *horizontal* field of view so portrait phones still see a whole niche.
 */
export function CameraRig({ rtl, compact }: { rtl: boolean; compact: boolean }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const pos = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  const targetPos = useMemo(() => new THREE.Vector3(), []);
  const targetLook = useMemo(() => new THREE.Vector3(), []);
  const parallax = useRef({ x: 0, y: 0 });
  const pointer = useRef({ x: 0, y: 0 });

  /* The canvas has pointer-events: none (the HTML overlay must stay clickable), so track the pointer on window. */
  useEffect(() => {
    if (compact) return undefined;
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    const onLeave = () => {
      pointer.current.x = 0;
      pointer.current.y = 0;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
    };
  }, [compact]);

  useLayoutEffect(() => {
    const s = samplePath(progressStore.value, rtl, compact);
    pos.set(...s.cam);
    look.set(...s.look);
    camera.position.copy(pos);
    camera.lookAt(look);
  }, [camera, rtl, compact, pos, look]);

  useFrame((state, dt) => {
    const step = Math.min(dt, 1 / 30);
    const s = samplePath(progressStore.value, rtl, compact);
    targetPos.set(...s.cam);
    targetLook.set(...s.look);

    const k = 1 - Math.exp(-6.5 * step);
    pos.lerp(targetPos, k);
    look.lerp(targetLook, k);

    const px = compact ? 0 : pointer.current.x * 0.28;
    const py = compact ? 0 : pointer.current.y * 0.14;
    parallax.current.x = damp(parallax.current.x, px, 3.5, step);
    parallax.current.y = damp(parallax.current.y, py, 3.5, step);

    camera.position.set(pos.x + parallax.current.x, pos.y + parallax.current.y, pos.z);
    camera.lookAt(look);

    const aspect = state.size.width / Math.max(1, state.size.height);
    const hFov = THREE.MathUtils.degToRad(62);
    const vFov = THREE.MathUtils.clamp(THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(hFov / 2) / aspect)), 34, 82);
    if (Math.abs(camera.fov - vFov) > 0.05) {
      camera.fov = vFov;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}

/**
 * Daylight → basalt dusk. Background, fog and the key/fill lights all follow the `dark` value of the path.
 * The shadow-casting key light tracks the camera's look target so shadows stay sharp along the whole walk.
 */
export function Atmosphere({ rtl, compact, shadows }: { rtl: boolean; compact: boolean; shadows: boolean }) {
  const scene = useThree((s) => s.scene);
  const key = useRef<THREE.DirectionalLight>(null);
  const fill = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const bg = useMemo(() => new THREE.Color(), []);
  const fogRef = useRef<THREE.Fog>(null);

  useLayoutEffect(() => {
    if (key.current) key.current.target = target;
  }, [target]);

  useFrame(() => {
    const s = samplePath(progressStore.value, rtl, compact);
    const d = s.dark;

    bg.copy(CREAM).lerp(NIGHT, d);
    scene.background = bg;
    if (fogRef.current) {
      fogRef.current.color.copy(bg);
      fogRef.current.near = lerp(14, 5, d);
      fogRef.current.far = lerp(46, 20, d);
    }

    if (key.current) {
      key.current.intensity = lerp(1.9, 0.35, d);
      target.position.set(s.look[0], 1.6, s.look[2]);
      target.updateMatrixWorld();
      key.current.position.set(s.look[0] + 4.5, 9.5, s.look[2] + 6);
    }
    if (fill.current) fill.current.intensity = lerp(0.45, 0.2, d);
    if (hemi.current) hemi.current.intensity = lerp(0.8, 0.22, d);
  });

  return (
    <>
      <fog ref={fogRef} attach="fog" args={['#ebe3d4', 14, 46]} />
      <hemisphereLight ref={hemi} args={['#fff6ea', '#a5947f', 0.8]} />
      <ambientLight intensity={0.22} />
      <directionalLight
        ref={key}
        color="#ffdcbd"
        intensity={1.9}
        position={[4.5, 9.5, 6]}
        castShadow={shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.00035}
        shadow-normalBias={0.02}
        shadow-camera-near={1}
        shadow-camera-far={40}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
      />
      <directionalLight ref={fill} color="#7fb3ab" intensity={0.45} position={[-6, 4, -3]} />
      <primitive object={target} />
    </>
  );
}
