'use client';

import { forwardRef, useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { ASPECT, BRAND, type BrandKey } from '../assets';

export type BrandTextures = Record<BrandKey, THREE.Texture>;

/** Loads the whole brand kit once and configures colour space / filtering. */
export function useBrandTextures(): BrandTextures {
  const textures = useTexture(BRAND) as BrandTextures;
  const gl = useThree((s) => s.gl);

  useLayoutEffect(() => {
    const aniso = Math.min(8, gl.capabilities.getMaxAnisotropy());
    (Object.keys(textures) as BrandKey[]).forEach((key) => {
      const t = textures[key];
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = aniso;
      t.generateMipmaps = true;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.needsUpdate = true;
    });
  }, [textures, gl]);

  return textures;
}

/** Clone a banner texture and tile it across a surface while keeping the artwork's aspect. */
export function useTiled(source: THREE.Texture, key: BrandKey, width: number, height: number, tileWidth: number) {
  return useMemo(() => {
    const t = source.clone();
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    const tileHeight = tileWidth / ASPECT[key];
    t.repeat.set(width / tileWidth, height / tileHeight);
    t.needsUpdate = true;
    return t;
  }, [source, key, width, height, tileWidth]);
}

type CutoutProps = {
  tex: THREE.Texture;
  aspectKey: BrandKey;
  width: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  /** Soft (blended) edges for seals and marks; crisp alpha test for bricks. */
  soft?: boolean;
  roughness?: number;
  metalness?: number;
  emissive?: string;
  emissiveIntensity?: number;
  castShadow?: boolean;
  receiveShadow?: boolean;
  renderOrder?: number;
  side?: THREE.Side;
};

/**
 * A single brand artwork mounted on a plane with alpha cut-out.
 * The pre-rendered artwork carries its own shading; scene lights only tint it.
 */
export const Cutout = forwardRef<THREE.Mesh, CutoutProps>(function Cutout(
  {
    tex,
    aspectKey,
    width,
    position,
    rotation,
    soft = false,
    roughness = 0.82,
    metalness = 0,
    emissive,
    emissiveIntensity = 0,
    castShadow = true,
    receiveShadow = false,
    renderOrder,
    side,
  },
  ref,
) {
  const height = width / ASPECT[aspectKey];
  return (
    <mesh
      ref={ref}
      position={position}
      rotation={rotation}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      renderOrder={renderOrder}
    >
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial
        map={tex}
        transparent={soft}
        alphaTest={soft ? 0.04 : 0.5}
        depthWrite
        roughness={roughness}
        metalness={metalness}
        emissive={emissive ?? '#000000'}
        emissiveMap={emissive ? tex : undefined}
        emissiveIntensity={emissiveIntensity}
        side={side ?? THREE.FrontSide}
      />
    </mesh>
  );
});

/** A thick plaster/basalt slab whose face is a Hayat niche tile. */
export function Slab({
  face,
  sideColor,
  size,
  depth = 0.3,
  position,
  rotation,
}: {
  face: THREE.Texture;
  sideColor: string;
  size: number;
  depth?: number;
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={[size, size, depth]} />
      <meshStandardMaterial attach="material-0" color={sideColor} roughness={0.95} />
      <meshStandardMaterial attach="material-1" color={sideColor} roughness={0.95} />
      <meshStandardMaterial attach="material-2" color={sideColor} roughness={0.95} />
      <meshStandardMaterial attach="material-3" color={sideColor} roughness={0.95} />
      <meshStandardMaterial attach="material-4" map={face} roughness={0.9} />
      <meshStandardMaterial attach="material-5" color={sideColor} roughness={0.95} />
    </mesh>
  );
}

/** Side colours that match each brand brick face. */
const BRICK_SIDE: Partial<Record<BrandKey, string>> = {
  brickBeige: '#d2c4ae',
  brickTerracotta: '#c45c26',
  brickSlate: '#3a4044',
  stoneBeige: '#cbb89a',
  stoneRed: '#b04a2a',
  stoneSlate: '#3a4044',
};

/** Uniform brick block height — same for every floor brick. */
const BRICK_HEIGHT = 0.15;

/**
 * A real brick on the floor: solid body (same height/depth family) + brand face on top
 * so the silhouette and colour match the artwork instead of a stretched weird box.
 */
export function FloorBrick({
  tex,
  aspectKey,
  length = 0.88,
  position,
  rotationY = 0,
}: {
  tex: THREE.Texture;
  aspectKey: BrandKey;
  length?: number;
  position: [number, number, number];
  rotationY?: number;
}) {
  const depth = length / ASPECT[aspectKey];
  const side = BRICK_SIDE[aspectKey] ?? '#c4b6a2';
  const bodyScale = 0.9;

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, BRICK_HEIGHT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[length * bodyScale, BRICK_HEIGHT, depth * bodyScale]} />
        <meshStandardMaterial color={side} roughness={0.88} />
      </mesh>
      <Cutout
        tex={tex}
        aspectKey={aspectKey}
        width={length}
        position={[0, BRICK_HEIGHT + 0.002, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        soft
        castShadow={false}
        receiveShadow
        roughness={0.82}
      />
    </group>
  );
}

/** Flat wall or floor with a tiled banner material. */
export function Surface({
  tex,
  aspectKey,
  width,
  height,
  tileWidth = 3.2,
  color = '#ffffff',
  position,
  rotation,
  roughness = 0.96,
}: {
  tex: THREE.Texture;
  aspectKey: BrandKey;
  width: number;
  height: number;
  tileWidth?: number;
  color?: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  roughness?: number;
}) {
  const tiled = useTiled(tex, aspectKey, width, height, tileWidth);
  return (
    <mesh position={position} rotation={rotation} receiveShadow>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial map={tiled} color={color} roughness={roughness} metalness={0} />
    </mesh>
  );
}
