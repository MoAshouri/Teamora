'use client';

import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { WORLD, clamp01, damp, lerp, local } from '../path';
import { progressStore } from '../progress-store';
import { weekColumns } from '../week';
import { liveEmployees, type LiveEmployee } from '../live-employees';
import { ASPECT } from '../assets';
import { Cutout, FloorBrick, Slab, Surface, type BrandTextures } from './kit';

const PLASTER_SIDE = '#d9cfbf';
const INK = '#1a2b2a';
const TERRACOTTA = '#e07a3a';

const SLAB_FACE = 0.15; // half depth of a slab

function easeOutCubic(t: number) {
  const x = clamp01(t);
  return 1 - Math.pow(1 - x, 3);
}

/** Scene caption — paints with the page font so fa/hy/en glyphs stay correct. */
function SceneLabel({
  label,
  hot = false,
  position,
  rtl,
  light = false,
  width = 0.34,
  height = 0.17,
}: {
  label: string;
  hot?: boolean;
  position: [number, number, number];
  rtl: boolean;
  light?: boolean;
  width?: number;
  height?: number;
}) {
  const [map, setMap] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    let cancelled = false;
    let tex: THREE.CanvasTexture | null = null;

    const paint = () => {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 160;
      const ctx = c.getContext('2d')!;
      ctx.clearRect(0, 0, 512, 160);
      ctx.fillStyle = hot ? TERRACOTTA : light ? '#f4efe6' : INK;
      ctx.font = `650 72px ${getComputedStyle(document.body).fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 256, 84);
      tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      if (!cancelled) setMap(tex);
    };

    document.fonts.ready.then(paint).catch(paint);
    return () => {
      cancelled = true;
      tex?.dispose();
    };
  }, [label, hot, light]);

  if (!map) return null;

  return (
    <mesh position={position} scale={rtl ? [-1, 1, 1] : 1} renderOrder={2}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={map} transparent depthWrite={false} />
    </mesh>
  );
}

/** Day name under a brick column. */
function DayLabel(props: { label: string; hot: boolean; position: [number, number, number]; rtl: boolean }) {
  return <SceneLabel {...props} width={0.34} height={0.17} />;
}

/** Multi-line “live employees” board painted into the Gavit light iwan. */
const LiveEmployeeBoard = forwardRef<
  THREE.Mesh,
  {
    title: string;
    rows: LiveEmployee[];
    rtl: boolean;
    position: [number, number, number];
  }
>(function LiveEmployeeBoard({ title, rows, rtl, position }, ref) {
  const [map, setMap] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    let cancelled = false;
    let tex: THREE.CanvasTexture | null = null;

    const paint = () => {
      const W = 768;
      const H = 900;
      const c = document.createElement('canvas');
      c.width = W;
      c.height = H;
      const ctx = c.getContext('2d')!;
      ctx.clearRect(0, 0, W, H);

      const family = getComputedStyle(document.body).fontFamily;
      ctx.direction = rtl ? 'rtl' : 'ltr';

      const contentH = 120 + rows.length * 130;
      const startY = (H - contentH) / 2;

      ctx.fillStyle = 'rgba(247, 242, 233, 0.88)';
      roundRect(ctx, 48, startY - 48, W - 96, contentH + 96, 36);
      ctx.fill();
      ctx.strokeStyle = 'rgba(26, 43, 42, 0.12)';
      ctx.lineWidth = 3;
      ctx.stroke();

      const padX = rtl ? W - 88 : 88;
      const align: CanvasTextAlign = rtl ? 'right' : 'left';

      ctx.fillStyle = INK;
      ctx.font = `700 52px ${family}`;
      ctx.textAlign = align;
      ctx.textBaseline = 'top';
      ctx.fillText(title, padX, startY);

      ctx.strokeStyle = TERRACOTTA;
      ctx.lineWidth = 4;
      const ruleY = startY + 72;
      ctx.beginPath();
      if (rtl) {
        ctx.moveTo(W - 88, ruleY);
        ctx.lineTo(W - 320, ruleY);
      } else {
        ctx.moveTo(88, ruleY);
        ctx.lineTo(320, ruleY);
      }
      ctx.stroke();

      rows.forEach((row, i) => {
        const y = startY + 110 + i * 130;
        ctx.fillStyle = TERRACOTTA;
        const bx = rtl ? W - 108 : 108;
        ctx.beginPath();
        ctx.arc(bx, y + 28, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = INK;
        ctx.font = `600 44px ${family}`;
        ctx.textAlign = align;
        const nameX = rtl ? W - 140 : 140;
        ctx.fillText(row.name, nameX, y);

        ctx.fillStyle = '#5c6b68';
        ctx.font = `500 38px ${family}`;
        ctx.fillText(row.time, nameX, y + 56);
      });

      tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      if (!cancelled) setMap(tex);
    };

    document.fonts.ready.then(paint).catch(paint);
    return () => {
      cancelled = true;
      tex?.dispose();
    };
  }, [title, rows, rtl]);

  if (!map) return null;

  return (
    <mesh ref={ref} position={position} scale={rtl ? [-1, 1, 1] : 1} renderOrder={3}>
      <planeGeometry args={[1.85, 2.15]} />
      <meshBasicMaterial map={map} transparent depthWrite={false} />
    </mesh>
  );
});

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
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
      {/* arcade wall — bottom edge flush with the floor (no plinth gap) */}
      <Surface
        tex={tex.plasterLight}
        aspectKey="plasterLight"
        width={44}
        height={9}
        tileWidth={3.6}
        color="#efe7da"
        position={[10, 4.5, -0.02]}
      />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Chapter 1 — threshold                                               */
/* ------------------------------------------------------------------ */

export function Hero({ tex }: { tex: BrandTextures }) {
  const mark = useRef<THREE.Mesh>(null);
  const markY = WORLD.nicheY + 0.15;

  useFrame(({ clock }, dt) => {
    const m = mark.current;
    if (!m) return;
    const t = clock.elapsedTime;
    m.rotation.z = damp(m.rotation.z, Math.sin(t * 0.35) * 0.35, 3, dt);
    m.position.y = markY + Math.sin(t * 0.9) * 0.06;
    const p = progressStore.value;
    const s = lerp(1, 0.86, local(p, 0.12, 0.24));
    m.scale.setScalar(s);
  });

  return (
    <group>
      <Slab
        face={tex.nicheLight}
        sideColor={PLASTER_SIDE}
        size={WORLD.nicheSize}
        position={[WORLD.heroX, WORLD.nicheY, 0]}
      />
      <Cutout ref={mark} tex={tex.tatilLight} aspectKey="tatilLight" width={1.55} position={[0, markY, 0.62]} soft />
      <pointLight position={[0, WORLD.nicheY + 0.35, 1.3]} color="#ffd2ae" intensity={3.2} distance={5.5} decay={2} />

      <FloorBrick tex={tex.brickBeige} aspectKey="brickBeige" length={0.9} position={[-1.3, 0, 3.1]} rotationY={0.35} />
      <FloorBrick tex={tex.brickTerracotta} aspectKey="brickTerracotta" length={0.9} position={[-0.55, 0, 3.7]} rotationY={-0.5} />
      <FloorBrick tex={tex.brickBeige} aspectKey="brickBeige" length={0.9} position={[1.55, 0, 2.6]} rotationY={1.2} />
      <FloorBrick tex={tex.brickSlate} aspectKey="brickSlate" length={0.9} position={[2.25, 0, 3.4]} rotationY={-0.15} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Chapter 2 — arcade: hours / leave / calendar / company              */
/* ------------------------------------------------------------------ */

const BRICK_W = 0.33;
const BRICK_PITCH_X = 0.345;
const BRICK_PITCH_Y = 0.19;
/** Demo hour-stack heights Mon…Sun (or locale week order) — only the “today” column is terracotta. */
const WEEK_HEIGHTS = [3, 5, 4, 6, 5, 2, 1];

export function HoursNiche({
  tex,
  locale,
  rtl,
}: {
  tex: BrandTextures;
  locale: string;
  rtl: boolean;
}) {
  const x = WORLD.arcadeX[0];
  const group = useRef<THREE.Group>(null);
  const { labels, todayCol } = useMemo(() => weekColumns(locale), [locale]);

  const bricks = useMemo(() => {
    const list: { x: number; y: number; hot: boolean; order: number }[] = [];
    let order = 0;
    const maxRow = Math.max(...WEEK_HEIGHTS);
    for (let row = 0; row < maxRow; row += 1) {
      WEEK_HEIGHTS.forEach((h, col) => {
        if (row < h) {
          list.push({
            x: (col - 3) * BRICK_PITCH_X,
            y: 1.35 + row * BRICK_PITCH_Y,
            hot: col === todayCol,
            order: order++,
          });
        }
      });
    }
    return list;
  }, [todayCol]);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const L = local(progressStore.value, 0.215, 0.31);
    g.children.forEach((child, i) => {
      const b = bricks[i];
      if (!b) return;
      const t = easeOutCubic((L - (b.order / bricks.length) * 0.65) / 0.35);
      const targetY = b.y + (1 - t) * 2.6;
      child.position.y = damp(child.position.y, targetY, 14, dt);
      child.visible = t > 0.001;
    });
  });

  const labelY = 1.08;
  const labelZ = SLAB_FACE + 0.4;

  return (
    <group>
      <Slab face={tex.nicheLight} sideColor={PLASTER_SIDE} size={WORLD.nicheSize} position={[x, WORLD.nicheY, 0]} />
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
      {labels.map((label, col) => (
        <DayLabel
          key={`${label}-${col}`}
          label={label}
          hot={col === todayCol}
          position={[x + (col - 3) * BRICK_PITCH_X, labelY, labelZ]}
          rtl={rtl}
        />
      ))}
      <pointLight position={[x, WORLD.nicheY + 1.0, 1.2]} color="#ffd9bb" intensity={1.8} distance={4.5} decay={2} />
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
      <Slab face={tex.nicheLight} sideColor={PLASTER_SIDE} size={WORLD.nicheSize} position={[x, WORLD.nicheY, 0]} />
      <Cutout tex={tex.brickSlate} aspectKey="brickSlate" width={1.9} position={[x, WORLD.nicheY + 0.2, SLAB_FACE + 0.3]} rotation={[0, 0, 0.03]} />
      <Cutout ref={seal} tex={tex.waxHourglass} aspectKey="waxHourglass" width={1.3} position={[x + 0.15, WORLD.nicheY + 0.45, 2.6]} soft roughness={0.55} metalness={0.05} />
      <pointLight position={[x, WORLD.nicheY + 1.0, 1.2]} color="#ffd9bb" intensity={1.8} distance={4.5} decay={2} />
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
      mark.current.position.y = WORLD.nicheY + 0.6 + Math.sin(clock.elapsedTime * 0.8) * 0.04;
    }
  });

  return (
    <group>
      <Slab face={tex.nicheLight} sideColor={PLASTER_SIDE} size={WORLD.nicheSize} position={[x, WORLD.nicheY, 0]} />
      <Cutout ref={mark} tex={tex.tatilLight} aspectKey="tatilLight" width={1.05} position={[x, WORLD.nicheY + 0.6, SLAB_FACE + 0.35]} soft />
      <group ref={row} position={[x, WORLD.nicheY - 0.05, SLAB_FACE + 0.42]}>
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
      <Cutout ref={rest} tex={tex.tatilDark} aspectKey="tatilDark" width={0.36} position={[x + 3 * 0.34, WORLD.nicheY + 0.32, SLAB_FACE + 0.5]} soft castShadow={false} />
      <pointLight position={[x, WORLD.nicheY + 1.0, 1.2]} color="#ffd9bb" intensity={1.8} distance={4.5} decay={2} />
    </group>
  );
}

export function CompanyNiche({
  tex,
  locale,
  rtl,
}: {
  tex: BrandTextures;
  locale: string;
  rtl: boolean;
}) {
  const x = WORLD.arcadeX[3];
  const archW = WORLD.companyArchWidth;
  const archH = archW / ASPECT.archLight;
  const archY = archH / 2;
  const board = useRef<THREE.Mesh>(null);
  const { title, rows } = useMemo(() => liveEmployees(locale), [locale]);

  useFrame((_, dt) => {
    const L = local(progressStore.value, 0.5, 0.56);
    if (board.current) {
      const t = easeOutCubic(L);
      board.current.scale.setScalar(damp(board.current.scale.x, Math.max(0.001, t), 9, dt));
      // Stay on the vertical centre of the iwan; only fade/scale in
      board.current.position.y = archY;
    }
  });

  return (
    <group>
      <Cutout
        tex={tex.archLight}
        aspectKey="archLight"
        width={archW}
        position={[x, archY, SLAB_FACE + 0.05]}
        soft
        receiveShadow
      />
      <LiveEmployeeBoard
        ref={board}
        title={title}
        rows={rows}
        rtl={rtl}
        position={[x, archY, SLAB_FACE + 0.28]}
      />
      <pointLight position={[x, archY + 0.2, 1.2]} color="#ffd9bb" intensity={2.2} distance={5} decay={2} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Hall portal — no Hayat niches; only a centred opening into the Gavit */
/* ------------------------------------------------------------------ */

export function Doorways({ tex }: { tex: BrandTextures }) {
  const z = WORLD.doorWallZ;
  const x = WORLD.hallX;
  const archW = WORLD.hallArchWidth;
  const archY = archW / (2 * ASPECT.archDark);
  const wallW = 14;
  const gap = archW * 0.92;

  return (
    <group>
      {/* plaster wall split left / right of the centred Gavit opening */}
      <Surface
        tex={tex.plasterLight}
        aspectKey="plasterLight"
        width={wallW}
        height={10}
        tileWidth={3.6}
        color="#e4dacb"
        position={[x - gap / 2 - wallW / 2, 5, z]}
      />
      <Surface
        tex={tex.plasterLight}
        aspectKey="plasterLight"
        width={wallW}
        height={10}
        tileWidth={3.6}
        color="#e4dacb"
        position={[x + gap / 2 + wallW / 2, 5, z]}
      />
      <Surface
        tex={tex.plasterLight}
        aspectKey="plasterLight"
        width={gap}
        height={2.2}
        tileWidth={3.6}
        color="#e4dacb"
        position={[x, archY * 2 + 0.4, z]}
      />

      {/* Gavit arch on the same centre line as the company light iwan */}
      <Cutout
        tex={tex.archLight}
        aspectKey="archLight"
        width={archW}
        position={[x, archY, z + 0.05]}
        soft
        receiveShadow
      />
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
  const archW = WORLD.hallArchWidth;
  const archH = archW / ASPECT.archDark;
  const archY = archH / 2;

  const eternity = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (eternity.current) eternity.current.rotation.z = clock.elapsedTime * 0.18;
  });

  return (
    <group>
      <Surface tex={tex.basaltDark} aspectKey="basaltDark" width={hw * 2} height={len} tileWidth={2.4} color="#8d8d90" position={[x, 0.012, zc]} rotation={[-Math.PI / 2, 0, 0]} roughness={0.85} />
      <Surface tex={tex.basaltDark} aspectKey="basaltDark" width={len} height={10} tileWidth={3.2} color="#9a9a9c" position={[x - hw, 5, zc]} rotation={[0, Math.PI / 2, 0]} />
      <Surface tex={tex.basaltDark} aspectKey="basaltDark" width={len} height={10} tileWidth={3.2} color="#9a9a9c" position={[x + hw, 5, zc]} rotation={[0, -Math.PI / 2, 0]} />
      <Surface tex={tex.basaltDark} aspectKey="basaltDark" width={hw * 2 + 0.2} height={10} tileWidth={3.2} color="#a4a4a6" position={[x, 5, z1]} />

      {WORLD.hallArchZ.map((az, i) => (
        <group key={az}>
          <Cutout
            tex={i % 2 ? tex.archDark : tex.archLight}
            aspectKey="archDark"
            width={archW}
            position={[x, archY, az]}
            soft
            receiveShadow
          />
          <pointLight position={[x, archY + 0.8, az + 0.4]} color="#e8935a" intensity={6.5} distance={8} decay={2} />
        </group>
      ))}

      <Cutout ref={eternity} tex={tex.eternityLight} aspectKey="eternityLight" width={0.9} position={[x, 1.25, -15.2]} soft castShadow={false} />
      <Cutout tex={tex.plaqueDark} aspectKey="plaqueDark" width={2.6} position={[x, 3.8, -18.7]} soft />
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
    const L = local(progressStore.value, 0.9, 0.96);
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
