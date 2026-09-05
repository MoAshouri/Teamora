'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { WORLD, clamp01, damp, lerp, local } from '../path';
import { progressStore } from '../progress-store';
import { Cutout, Slab, Surface, type BrandTextures } from './kit';

const PLASTER_SIDE = '#d9cfbf';
const BASALT_SIDE = '#15171a';
const INK = '#1a2b2a';
const TERRACOTTA = '#e07a3a';

const SLAB_FACE = 0.15; // half depth of a slab

function easeOutCubic(t: number) {
  const x = clamp01(t);
  return 1 - Math.pow(1 - x, 3);
}

/* ------------------------------------------------------------------ */
/* Courtyard ground + long arcade wall                                 */
/* ------------------------------------------------------------------ */

export function Courtyard({ tex }: { tex: BrandTextures }) {
  return (
    <group>
      {/* plaster floor */}
      <Surface
        tex={tex.plasterLight}
        aspectKey="plasterLight"
        width={90}
        height={48}
        tileWidth={4}
        color="#d6cbb9"
        position={[12, 0, 4]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      {/* arcade wall */}
      <Surface
        tex={tex.plasterLight}
        aspectKey="plasterLight"
        width={44}
        height={9}
        tileWidth={3.6}
        color="#efe7da"
        position={[10, 4.5, -0.02]}
      />
      {/* low teal plinth running under the niches */}
      <mesh position={[10, 0.16, 0.12]} receiveShadow castShadow>
        <boxGeometry args={[44, 0.32, 0.5]} />
        <meshStandardMaterial color="#1f3d3a" roughness={0.8} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Chapter 1 — threshold                                               */
/* ------------------------------------------------------------------ */

export function Hero({ tex }: { tex: BrandTextures }) {
  const mark = useRef<THREE.Mesh>(null);

  useFrame(({ clock }, dt) => {
    const m = mark.current;
    if (!m) return;
    const t = clock.elapsedTime;
    m.rotation.z = damp(m.rotation.z, Math.sin(t * 0.35) * 0.35, 3, dt);
    m.position.y = 3.0 + Math.sin(t * 0.9) * 0.06;
    const p = progressStore.value;
    const s = lerp(1, 0.86, local(p, 0.12, 0.24));
    m.scale.setScalar(s);
  });

  return (
    <group>
      <Slab face={tex.nicheLight} sideColor={PLASTER_SIDE} size={5.4} position={[WORLD.heroX, 2.85, 0]} />
      <Cutout ref={mark} tex={tex.tatilLight} aspectKey="tatilLight" width={1.55} position={[0, 3.0, 0.62]} soft />
      <pointLight position={[0, 3.2, 1.3]} color="#ffd2ae" intensity={3.2} distance={5.5} decay={2} />

      {/* a few bricks resting on the ground */}
      <Cutout tex={tex.brickBeige} aspectKey="brickBeige" width={0.8} position={[-1.3, 0.015, 3.1]} rotation={[-Math.PI / 2, 0, 0.35]} />
      <Cutout tex={tex.brickTerracotta} aspectKey="brickTerracotta" width={0.8} position={[-0.6, 0.015, 3.7]} rotation={[-Math.PI / 2, 0, -0.5]} />
      <Cutout tex={tex.brickBeige} aspectKey="brickBeige" width={0.8} position={[1.6, 0.015, 2.6]} rotation={[-Math.PI / 2, 0, 1.2]} />
      <Cutout tex={tex.brickSlate} aspectKey="brickSlate" width={0.8} position={[2.3, 0.015, 3.4]} rotation={[-Math.PI / 2, 0, -0.15]} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Chapter 2 — arcade: hours / leave / calendar / company              */
/* ------------------------------------------------------------------ */

const BRICK_W = 0.33;
const BRICK_PITCH_X = 0.345;
const BRICK_PITCH_Y = 0.19;
const WEEK = [3, 5, 4, 6, 5, 2, 1];

export function HoursNiche({ tex }: { tex: BrandTextures }) {
  const x = WORLD.arcadeX[0];
  const group = useRef<THREE.Group>(null);

  const bricks = useMemo(() => {
    const list: { x: number; y: number; hot: boolean; order: number }[] = [];
    let order = 0;
    const maxRow = Math.max(...WEEK);
    for (let row = 0; row < maxRow; row += 1) {
      WEEK.forEach((h, col) => {
        if (row < h) list.push({ x: (col - 3) * BRICK_PITCH_X, y: 1.72 + row * BRICK_PITCH_Y, hot: col === 3, order: order++ });
      });
    }
    return list;
  }, []);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const L = local(progressStore.value, 0.215, 0.31);
    g.children.forEach((child, i) => {
      const b = bricks[i];
      const t = easeOutCubic((L - (b.order / bricks.length) * 0.65) / 0.35);
      const targetY = b.y + (1 - t) * 2.6;
      child.position.y = damp(child.position.y, targetY, 14, dt);
      child.visible = t > 0.001;
    });
  });

  return (
    <group>
      <Slab face={tex.nicheLight} sideColor={PLASTER_SIDE} size={4.2} position={[x, 2.45, 0]} />
      <group ref={group} position={[x, 0, SLAB_FACE + 0.36]}>
        {bricks.map((b) => (
          <Cutout
            key={b.order}
            tex={b.hot ? tex.brickTerracotta : tex.brickBeige}
            aspectKey={b.hot ? 'brickTerracotta' : 'brickBeige'}
            width={BRICK_W}
            position={[b.x, b.y + 2.6, 0]}
          />
        ))}
      </group>
      <pointLight position={[x, 3.4, 1.2]} color="#ffd9bb" intensity={1.8} distance={4.5} decay={2} />
    </group>
  );
}

export function LeaveNiche({ tex }: { tex: BrandTextures }) {
  const x = WORLD.arcadeX[1];
  const seal = useRef<THREE.Mesh>(null);

  useFrame((_, dt) => {
    const m = seal.current;
    if (!m) return;
    const L = local(progressStore.value, 0.31, 0.375);
    const s = lerp(1.7, 1, L);
    m.scale.setScalar(damp(m.scale.x, s, 10, dt));
    m.position.z = damp(m.position.z, lerp(2.6, SLAB_FACE + 0.52, L), 10, dt);
    m.rotation.z = damp(m.rotation.z, lerp(0.45, -0.08, L), 10, dt);
  });

  return (
    <group>
      <Slab face={tex.nicheLight} sideColor={PLASTER_SIDE} size={4.2} position={[x, 2.45, 0]} />
      {/* the leave request: a slate tablet */}
      <Cutout tex={tex.brickSlate} aspectKey="brickSlate" width={1.9} position={[x, 2.3, SLAB_FACE + 0.3]} rotation={[0, 0, 0.03]} />
      {/* the approval: a terracotta wax seal with the hourglass */}
      <Cutout ref={seal} tex={tex.waxHourglass} aspectKey="waxHourglass" width={1.3} position={[x + 0.15, 2.55, 2.6]} soft roughness={0.55} metalness={0.05} />
      <pointLight position={[x, 3.4, 1.2]} color="#ffd9bb" intensity={1.8} distance={4.5} decay={2} />
    </group>
  );
}

export function CalendarNiche({ tex }: { tex: BrandTextures }) {
  const x = WORLD.arcadeX[2];
  const row = useRef<THREE.Group>(null);
  const rest = useRef<THREE.Mesh>(null);
  const mark = useRef<THREE.Mesh>(null);

  useFrame(({ clock }, dt) => {
    const L = local(progressStore.value, 0.40, 0.47);
    row.current?.children.forEach((child, i) => {
      const t = easeOutCubic((L - i * 0.08) / 0.45);
      child.position.x = damp(child.position.x, (i - 3) * 0.34 - (1 - t) * 1.6, 12, dt);
      child.visible = t > 0.001;
    });
    if (rest.current) {
      rest.current.rotation.z = clock.elapsedTime * 0.5;
      const s = easeOutCubic((L - 0.55) / 0.45);
      rest.current.scale.setScalar(damp(rest.current.scale.x, Math.max(0.001, s), 10, dt));
    }
    if (mark.current) {
      mark.current.rotation.z = -clock.elapsedTime * 0.12;
      mark.current.position.y = 3.05 + Math.sin(clock.elapsedTime * 0.8) * 0.04;
    }
  });

  return (
    <group>
      <Slab face={tex.nicheLight} sideColor={PLASTER_SIDE} size={4.2} position={[x, 2.45, 0]} />
      <Cutout ref={mark} tex={tex.tatilLight} aspectKey="tatilLight" width={1.05} position={[x, 3.05, SLAB_FACE + 0.35]} soft />
      <group ref={row} position={[x, 2.05, SLAB_FACE + 0.42]}>
        {Array.from({ length: 7 }).map((_, i) => (
          <Cutout
            key={i}
            tex={i === 6 ? tex.brickTerracotta : tex.brickBeige}
            aspectKey={i === 6 ? 'brickTerracotta' : 'brickBeige'}
            width={0.31}
            position={[(i - 3) * 0.34 - 1.6, 0, 0]}
          />
        ))}
      </group>
      {/* rest mark above the weekend tile */}
      <Cutout ref={rest} tex={tex.tatilDark} aspectKey="tatilDark" width={0.36} position={[x + 3 * 0.34, 2.42, SLAB_FACE + 0.5]} soft castShadow={false} />
      <pointLight position={[x, 3.4, 1.2]} color="#ffd9bb" intensity={1.8} distance={4.5} decay={2} />
    </group>
  );
}

export function CompanyNiche({ tex }: { tex: BrandTextures }) {
  const x = WORLD.arcadeX[3];
  const plaque = useRef<THREE.Mesh>(null);
  const token = useRef<THREE.Group>(null);

  useFrame((_, dt) => {
    const L = local(progressStore.value, 0.49, 0.56);
    if (plaque.current) {
      plaque.current.position.y = damp(plaque.current.position.y, lerp(1.9, 2.85, easeOutCubic(L)), 9, dt);
      plaque.current.scale.setScalar(damp(plaque.current.scale.x, Math.max(0.001, easeOutCubic(L)), 9, dt));
    }
    token.current?.children.forEach((child, i) => {
      const t = easeOutCubic((L - 0.35 - i * 0.07) / 0.4);
      child.rotation.y = damp(child.rotation.y, (1 - t) * Math.PI, 10, dt);
      child.scale.setScalar(damp(child.scale.x, Math.max(0.001, t), 10, dt));
    });
  });

  return (
    <group>
      <Slab face={tex.nicheLight} sideColor={PLASTER_SIDE} size={4.2} position={[x, 2.45, 0]} />
      <Cutout ref={plaque} tex={tex.plaqueLight} aspectKey="plaqueLight" width={2.35} position={[x, 1.9, SLAB_FACE + 0.4]} soft />
      {/* six-digit invite token as six small tiles */}
      <group ref={token} position={[x, 1.7, SLAB_FACE + 0.5]}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Cutout
            key={i}
            tex={i % 2 ? tex.brickTerracotta : tex.brickSlate}
            aspectKey={i % 2 ? 'brickTerracotta' : 'brickSlate'}
            width={0.3}
            position={[(i - 2.5) * 0.36, 0, 0]}
          />
        ))}
      </group>
      <pointLight position={[x, 3.4, 1.2]} color="#ffd9bb" intensity={1.8} distance={4.5} decay={2} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Chapter 3 — two doorways + hall entrance                            */
/* ------------------------------------------------------------------ */

export function Doorways({ tex }: { tex: BrandTextures }) {
  const z = WORLD.doorWallZ;
  const seals = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const ringMat = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    seals.current?.children.forEach((child, i) => {
      child.position.y = Math.sin(t * 1.1 + i * 1.7) * 0.05;
      child.rotation.z = Math.sin(t * 0.6 + i) * 0.12;
    });
    if (ringMat.current) ringMat.current.emissiveIntensity = 1.2 + Math.sin(t * 1.6) * 0.5;
    if (ring.current) ring.current.rotation.z = t * 0.25;
  });

  return (
    <group>
      {/* wall segments left / right of the arch, and the lintel above it */}
      <Surface tex={tex.plasterLight} aspectKey="plasterLight" width={11.8} height={8.5} tileWidth={3.6} color="#e4dacb" position={[13.7, 4.25, z]} />
      <Surface tex={tex.plasterLight} aspectKey="plasterLight" width={11.8} height={8.5} tileWidth={3.6} color="#e4dacb" position={[29.1, 4.25, z]} />
      <Surface tex={tex.plasterLight} aspectKey="plasterLight" width={3.6} height={2.6} tileWidth={3.6} color="#e4dacb" position={[WORLD.hallX, 7.2, z]} />

      {/* admin doorway — dark niche with pending approvals */}
      <Slab face={tex.nicheDark} sideColor={BASALT_SIDE} size={3.3} position={[WORLD.adminDoorX, 2.15, z + SLAB_FACE]} />
      <group ref={seals} position={[WORLD.adminDoorX, 2.35, z + SLAB_FACE + 0.55]}>
        {[-0.62, 0, 0.62].map((dx, i) => (
          <Cutout key={i} tex={tex.waxEternitySilver} aspectKey="waxEternitySilver" width={0.52} position={[dx, 0, 0]} soft roughness={0.4} metalness={0.5} />
        ))}
      </group>
      <pointLight position={[WORLD.adminDoorX, 3.0, z + 1.4]} color="#9fd9d0" intensity={2.2} distance={4.5} decay={2} />

      {/* employee doorway — light niche with the clock ring */}
      <Slab face={tex.nicheLight} sideColor={PLASTER_SIDE} size={3.3} position={[WORLD.employeeDoorX, 2.15, z + SLAB_FACE]} />
      <group position={[WORLD.employeeDoorX, 2.3, z + SLAB_FACE + 0.55]}>
        <mesh ref={ring} castShadow>
          <torusGeometry args={[0.55, 0.045, 14, 64]} />
          <meshStandardMaterial ref={ringMat} color={TERRACOTTA} emissive={TERRACOTTA} emissiveIntensity={1.4} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0, -0.02]}>
          <circleGeometry args={[0.46, 48]} />
          <meshStandardMaterial color={INK} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.22, 0.01]}>
          <boxGeometry args={[0.035, 0.42, 0.02]} />
          <meshStandardMaterial color="#f4efe6" />
        </mesh>
        <mesh position={[0.12, 0.06, 0.01]} rotation={[0, 0, -Math.PI / 3]}>
          <boxGeometry args={[0.03, 0.3, 0.02]} />
          <meshStandardMaterial color={TERRACOTTA} emissive={TERRACOTTA} emissiveIntensity={0.6} />
        </mesh>
      </group>
      <pointLight position={[WORLD.employeeDoorX, 3.0, z + 1.4]} color="#ffc8a0" intensity={2.4} distance={4.5} decay={2} />

      {/* Gavit arch — the entrance to the inner hall */}
      <Cutout tex={tex.archDark} aspectKey="archDark" width={3.7} position={[WORLD.hallX, 3.05, z + 0.05]} soft receiveShadow />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Chapter 4 — inner Gavit hall                                        */
/* ------------------------------------------------------------------ */

export function Hall({ tex }: { tex: BrandTextures }) {
  const x = WORLD.hallX;
  const hw = WORLD.hallHalfWidth;
  const z0 = WORLD.doorWallZ;
  const z1 = WORLD.hallEndZ;
  const len = z0 - z1;
  const zc = (z0 + z1) / 2;

  const stones = useRef<THREE.Group>(null);
  const eternity = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    stones.current?.children.forEach((child, i) => {
      child.position.y = 2.25 + Math.sin(t * 0.9 + i * 2.1) * 0.09;
      child.rotation.z = Math.sin(t * 0.5 + i) * 0.06;
    });
    if (eternity.current) eternity.current.rotation.z = t * 0.18;
  });

  return (
    <group>
      {/* basalt floor, walls and end wall */}
      <Surface tex={tex.basaltDark} aspectKey="basaltDark" width={hw * 2} height={len} tileWidth={2.4} color="#8d8d90" position={[x, 0.012, zc]} rotation={[-Math.PI / 2, 0, 0]} roughness={0.85} />
      <Surface tex={tex.basaltDark} aspectKey="basaltDark" width={len} height={8} tileWidth={3.2} color="#9a9a9c" position={[x - hw, 4, zc]} rotation={[0, Math.PI / 2, 0]} />
      <Surface tex={tex.basaltDark} aspectKey="basaltDark" width={len} height={8} tileWidth={3.2} color="#9a9a9c" position={[x + hw, 4, zc]} rotation={[0, -Math.PI / 2, 0]} />
      <Surface tex={tex.basaltDark} aspectKey="basaltDark" width={hw * 2 + 0.2} height={8} tileWidth={3.2} color="#a4a4a6" position={[x, 4, z1]} />

      {/* rhythm of round arches */}
      {WORLD.hallArchZ.map((az, i) => (
        <group key={az}>
          <Cutout tex={i % 2 ? tex.archDark : tex.archLight} aspectKey="archDark" width={3.7} position={[x, 3.05, az]} soft receiveShadow />
          <pointLight position={[x, 4.1, az + 0.4]} color="#e8935a" intensity={5.5} distance={7} decay={2} />
        </group>
      ))}

      {/* three languages: three stones */}
      <group ref={stones} position={[0, 0, -12.6]}>
        <Cutout tex={tex.stoneBeige} aspectKey="stoneBeige" width={0.95} position={[x - 1.1, 2.25, 0]} />
        <Cutout tex={tex.stoneRed} aspectKey="stoneRed" width={0.95} position={[x, 2.25, 0]} />
        <Cutout tex={tex.stoneSlate} aspectKey="stoneSlate" width={0.95} position={[x + 1.1, 2.25, 0]} />
      </group>

      {/* eternity mark and the company plaque deeper in */}
      <Cutout ref={eternity} tex={tex.eternityLight} aspectKey="eternityLight" width={0.9} position={[x, 1.25, -15.2]} soft castShadow={false} />
      <Cutout tex={tex.plaqueDark} aspectKey="plaqueDark" width={2.6} position={[x, 3.6, -18.7]} soft />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Chapter 5 — the seal                                                */
/* ------------------------------------------------------------------ */

export function FinalSeal({ tex }: { tex: BrandTextures }) {
  const x = WORLD.hallX;
  const z = WORLD.hallEndZ;
  const seal = useRef<THREE.Mesh>(null);
  const glow = useRef<THREE.PointLight>(null);

  useFrame(({ clock }, dt) => {
    const L = local(progressStore.value, 0.85, 0.93);
    if (seal.current) {
      seal.current.scale.setScalar(damp(seal.current.scale.x, lerp(1.9, 1, L), 9, dt));
      seal.current.position.z = damp(seal.current.position.z, lerp(z + 4.2, z + 0.55, L), 9, dt);
      seal.current.rotation.z = damp(seal.current.rotation.z, lerp(0.6, 0, L), 9, dt);
    }
    if (glow.current) glow.current.intensity = lerp(1.5, 10, L) + Math.sin(clock.elapsedTime * 2) * 0.6 * L;
  });

  return (
    <group>
      <Cutout ref={seal} tex={tex.waxEternity} aspectKey="waxEternity" width={2.5} position={[x, 2.35, z + 4.2]} soft roughness={0.45} metalness={0.15} />
      <pointLight ref={glow} position={[x, 2.7, z + 2.2]} color="#ffb37a" intensity={1.5} distance={7} decay={2} />
    </group>
  );
}
