# DRIFT 시스템 상세 개발 명세서 (Technical Design Spec)

> 원본: Notion 문서 "[DRIFT] Next.js App Router 기반 시스템 상세 개발 명세서"를 이 저장소용으로 정리.
> **이 프로젝트는 원본 스펙의 Vite 대신 Next.js App Router를 그대로 사용한다** (이미 결정됨, [../README.md](../README.md) 참고).
> 아래 예시 코드의 파일 경로(`app/`, `components/`, `store/` 등)는 Next.js 기준으로 그대로 적용 가능.
>
> **2026-08-19 아키텍처 개정 (5가지)** — 착수 전 재조정한 사항. 이하 본문/체크리스트는 이 개정을 반영해 갱신됨.
> 1. **API 통합**: 별도 백엔드 대신 Next.js Route Handlers(`app/api/galaxy`, `app/api/sectors`, `app/api/twin`)로 흡수.
> 2. **라우팅**: 단일 캔버스 모드 스위칭(`ViewMode`) 폐기 → `/galaxy`(개인 우주) · `/explore`(탐험 우주, 미구현) · `/twin`(Taste Twin 단독 우주, 미구현) 독립 라우트로 분리.
> 3. **조작계**: 키보드(WASD) 항해 완전 제거. 마우스 전용 `CameraControls` 일원화 — 드래그/휠/클릭 시 Fly-To 포커스만 지원.
> 4. **Taste Twin**: 1:1 오버레이 방식 폐기 → Twin 유저 우주를 `TwinScene.tsx`로 단독 렌더링, Gap Node는 `#FF0055` + `TARGET DISCOVERY` 라벨로 표기.
> 5. **개인 우주 모션**: 최초 진입은 시간축 기반 무작위 산란(RedshiftEngine으로 충분). `ClusterAnimationEngine.ts`로 섹터 지정된 트랙이 자기 섹터 박스 위치로 프레임 단위 lerp 집결하는 모션 추가.

R3F(React Three Fiber) + Three.js + Web Audio API 기반 3D 공간형 취향 탐색 엔진 구현 명세.

## 1. 아키텍처 & 디렉토리 구조

### 1.1 Client Component Boundary

WebGL(Three.js/R3F)과 Web Audio API는 브라우저 전용 API(`window`, `HTMLCanvasElement`, `AudioContext`)에 의존하므로 SSR 시 에러 발생 → 경계 분리 필수.

1. **Server Components** (`app/page.tsx`, `app/api/...`): 초기 메타데이터, DB 조회, Vector DB 프록시 연동.
2. **Dynamic Entry** (`components/3d/CanvasContainer.tsx`): `next/dynamic`의 `{ ssr: false }`로 브라우저에서만 Canvas 렌더링.
3. **Client Components** (`components/3d/...`, `components/ui/...`): 파일 최상단 `'use client'`.

### 1.2 디렉토리 구조

```
frontend/
├── app/
│   ├── layout.tsx                     # Root Layout
│   ├── page.tsx                       # 메인 엔트리 (Dynamic Canvas Import)
│   ├── globals.css
│   └── api/                           # Route Handlers (BFF)
│       ├── galaxy/route.ts            # GET: 80D → 3D 변환 좌표 및 트랙 데이터
│       ├── sectors/route.ts           # POST/GET: 3D 바운딩박스 아카이브 저장/조회
│       └── twin/gap-nodes/route.ts    # GET: 1:1 취향 쌍둥이 및 Gap Node 조회
├── components/
│   ├── 3d/                            # ['use client'] WebGL 3D 그래픽 모듈
│   │   ├── CanvasContainer.tsx        # Canvas 래퍼 (ssr: false)
│   │   ├── scenes/
│   │   │   ├── GalaxyScene.tsx        # [Mode 1] 메인 우주 씬
│   │   │   ├── SectorScene.tsx        # [Mode 2] 공간 구역화 씬
│   │   │   └── TwinOverlayScene.tsx   # [Mode 3] 1:1 쌍둥이 오버레이 씬
│   │   ├── objects/
│   │   │   ├── InstancedStars.tsx     # InstancedMesh (BVH 가속 노드)
│   │   │   ├── SectorVolumeBox.tsx    # 3D 바운딩박스 볼륨 캡슐
│   │   │   ├── SerendipityComet.tsx   # 세렌디피티 혜성 애니메이션
│   │   │   ├── BlackholeWarp.tsx      # 대척점 워프 왜곡 영역
│   │   │   └── TacticalRadarGrid.tsx  # XYZ 전술 가이드 그리드
│   │   └── postprocessing/
│   │       └── TacticalEffects.tsx    # Bloom, DepthOfField, ColorInvert
│   └── ui/                            # ['use client'] 2D Tactical HUD 오버레이
│       ├── HeaderNav.tsx              # 모드 전환 (GALAXY / SECTOR / TWIN)
│       ├── TrackDetailHUD.tsx         # 호버/선택 트랙 메타데이터
│       ├── SectorCreatorToolbar.tsx   # 3D 볼륨 지정 및 저장 도구
│       └── WarpOverlay.tsx            # 워프 트랜지션 시각 연출
├── engine/                            # 브라우저 연산 모듈 (Core Logic)
│   ├── SpatialAudioEngine.ts          # Web Audio API HRTF Spatializer
│   ├── RedshiftEngine.ts              # 시간 감쇠(Redshift) 위치/색상 연산
│   ├── VolumeIntersection.ts          # Box3 Spatial Collision 연산
│   └── CometTrajectory.ts             # 혜성 3차원 스플라인 궤도 연산
├── store/                             # Zustand 상태 관리
│   ├── useGalaxyStore.ts              # 공간 좌표, 노드 선택, 모드 상태
│   ├── useSectorStore.ts              # saved_sectors 볼륨 데이터
│   ├── useTwinStore.ts                # Twin 매핑 데이터 및 Gap Node 상태
│   └── useAudioStore.ts               # Spatial Audio 재생 및 FFT 분석 데이터
├── lib/
│   ├── db.ts                          # PostgreSQL / Prisma 연결
│   ├── vectorDb.ts                    # Vector DB SDK
│   └── math/
│       ├── pca.ts                     # 브라우저 백업용 PCA/Matrix 계산기
│       └── color.ts                   # Hex/RGB Interpolation
└── types/index.ts
```

이 저장소에서는 `components/3d/`를 이미 `frontend/components/3d/`로 시작했다 ([InstancedStars.tsx](../frontend/components/3d/objects/InstancedStars.tsx) — Galaxy 실사용 컴포넌트). `/prototype` 검증용 별개 파일(`frontend/components/3d/InstancedStars.tsx`)은 Galaxy/Explore/Twin 3뷰가 자리잡은 뒤 용도가 끝나 라우트째 삭제했다 (2026-08-20).

**라우트 배치 (개정됨)**: `ViewMode` 단일 캔버스 스위칭은 폐기. `/galaxy`(구현됨) · `/explore`(스텁) · `/twin`(스텁) 독립 라우트로 분리 구축한다.
기존 `frontend/app/page.tsx`(`/`)의 DRIFT v4 목업은 그대로 유지.

**engine/ 폴더 실제 구성**: `RedshiftEngine.ts`, `VolumeIntersection.ts`, `SpatialAudioEngine.ts` 외에 원본 스펙에 없던 `ClusterAnimationEngine.ts`를 추가했다 (섹터 지정 트랙을 자기 섹터 박스로 lerp 집결시키는 모션, 아키텍처 개정 5번 항목).

## 2. 데이터베이스 & API 데이터 구조

### 2.1 참고용 원본 스펙 스키마 (PostgreSQL)

> 이 저장소의 실제 스키마는 [backend/prisma/schema.prisma](../backend/prisma/schema.prisma)가 기준이다. 아래는 원본 스펙 문서의 참고 스키마로, 실제 구현 시 기존 스키마와 병합/매핑이 필요하다.

```sql
CREATE TABLE users (
    user_id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tracks (
    track_id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255) NOT NULL,
    album_art_url TEXT,
    audio_url TEXT NOT NULL,
    duration_ms INT NOT NULL,
    genre VARCHAR(50) NOT NULL
);

CREATE TABLE user_track_history (
    history_id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(user_id) ON DELETE CASCADE,
    track_id VARCHAR(64) REFERENCES tracks(track_id) ON DELETE CASCADE,
    play_count INT DEFAULT 1,
    last_played_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_track UNIQUE (user_id, track_id)
);

CREATE TABLE saved_sectors (
    sector_id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(user_id) ON DELETE CASCADE,
    sector_name VARCHAR(100) NOT NULL,
    min_x FLOAT NOT NULL, min_y FLOAT NOT NULL, min_z FLOAT NOT NULL,
    max_x FLOAT NOT NULL, max_y FLOAT NOT NULL, max_z FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sector_tracks (
    sector_id VARCHAR(64) REFERENCES saved_sectors(sector_id) ON DELETE CASCADE,
    track_id VARCHAR(64) REFERENCES tracks(track_id) ON DELETE CASCADE,
    PRIMARY KEY (sector_id, track_id)
);
```

### 2.2 Vector DB (참고, 이 저장소는 아직 미도입)

- Collection: `music_embeddings_80d`
- Dimension: 80 (Acousticness, Danceability, Energy, Valence, Spectrum MFCCs 등)
- Metric: `COSINE`

> 현재 backend는 75차원 `song_vector`/`taste_vector`(Float[])를 Postgres에 직접 저장하고 PCA는 Python 스크립트(`backend/umap/`)로 오프라인 계산한다. Vector DB 별도 도입 여부는 스펙과 별개로 추후 결정.

### 2.3 API Route Handler 예시 — `app/api/galaxy/route.ts`

```ts
import { NextResponse } from 'next/server';
import { TrackNode } from '@/types';

export async function GET(request: Request) {
  const mockNodes: TrackNode[] = Array.from({ length: 800 }).map((_, index) => ({
    trackId: `trk_${index + 1}`,
    title: `Track Alpha ${index + 1}`,
    artist: `Artist Node ${index % 20}`,
    position3D: [
      (Math.random() - 0.5) * 160,
      (Math.random() - 0.5) * 160,
      (Math.random() - 0.5) * 160,
    ],
    similarity: Math.random() * 2 - 1,
    lastPlayedAt: new Date(Date.now() - Math.random() * 1000 * 3600 * 24 * 90).toISOString(),
    audioUrl: `/audio/sample.mp3`,
    genre: index % 2 === 0 ? 'Synthwave' : 'Ambient',
  }));

  return NextResponse.json({
    userId: 'usr_incheon_01',
    totalCount: mockNodes.length,
    nodes: mockNodes,
    antipodeCentroid: [-75.4, 62.1, -80.9],
  });
}
```

> 실제 구현에서는 이 저장소의 NestJS 백엔드(`backend/src/universe`)가 이 역할을 담당하므로, Next.js Route Handler로 새로 만들지 NestJS 엔드포인트를 호출할지는 기능 착수 시 결정.

## 3. 기능별 상세 개발 명세

### 3.1 SSR 회피 Canvas 및 레이아웃 구축

`app/page.tsx`:

```tsx
import dynamic from 'next/dynamic';

const CanvasContainer = dynamic(() => import('@/components/3d/CanvasContainer'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#E0F2E9] font-mono text-black">
      <div className="animate-pulse text-xl font-bold">[ DRIFT SYSTEM INITIALIZING ]</div>
      <div className="mt-2 text-xs opacity-60">CALIBRATING 80D TO 3D TOPOLOGY...</div>
    </div>
  ),
});

export default function HomePage() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#E0F2E9]">
      <CanvasContainer />
    </main>
  );
}
```

`components/3d/CanvasContainer.tsx`:

```tsx
'use client';

import { Canvas } from '@react-three/fiber';
import { Bvh, CameraControls } from '@react-three/drei';
import GalaxyScene from './scenes/GalaxyScene';
import SectorScene from './scenes/SectorScene';
import TwinOverlayScene from './scenes/TwinOverlayScene';
import HeaderNav from '../ui/HeaderNav';
import TrackDetailHUD from '../ui/TrackDetailHUD';
import TacticalEffects from './postprocessing/TacticalEffects';
import { useGalaxyStore } from '@/store/useGalaxyStore';

export default function CanvasContainer() {
  const viewMode = useGalaxyStore((state) => state.viewMode);

  return (
    <div className="relative h-full w-full">
      <HeaderNav />
      <TrackDetailHUD />

      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 120], fov: 55 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => gl.setClearColor('#E0F2E9')}
      >
        <CameraControls makeDefault maxDistance={250} minDistance={5} />
        <Bvh firstHitOnly>
          {viewMode === 'GALAXY' && <GalaxyScene />}
          {viewMode === 'SECTOR' && <SectorScene />}
          {viewMode === 'TWIN' && <TwinOverlayScene />}
        </Bvh>
        <TacticalEffects />
      </Canvas>
    </div>
  );
}
```

> ⚠️ (구) `frontend/app/prototype/page.tsx` 프로토타입은 이 스펙보다 앞서 `<Bvh>`를 뺀 상태였다 (drei 10.7.8 + InstancedMesh 조합에서 화면 멈춤 이슈 확인됨). Galaxy 실사용 컴포넌트(`objects/InstancedStars.tsx`)도 같은 이유로 `Bvh` 없이 유지 중 — 본 기능 확장 시 `Bvh` 재도입 여부는 노드 수 규모를 보고 별도 검증 필요.

### 3.2 [Mode 1] Galaxy View & InstancedMesh 가속 렌더링

`components/3d/objects/InstancedStars.tsx`:

```tsx
'use client';

import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useGalaxyStore } from '@/store/useGalaxyStore';
import { calculateRedshiftColorAndPosition } from '@/engine/RedshiftEngine';

const tempObject = new THREE.Object3D();

export default function InstancedStars() {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const nodes = useGalaxyStore((state) => state.nodes);
  const setHoveredTrackId = useGalaxyStore((state) => state.setHoveredTrackId);
  const setSelectedTrackId = useGalaxyStore((state) => state.setSelectedTrackId);

  useEffect(() => {
    if (!meshRef.current || nodes.length === 0) return;
    nodes.forEach((node, i) => {
      const basePos = new THREE.Vector3(...node.position3D);
      const { position, color, scale } = calculateRedshiftColorAndPosition(basePos, node.lastPlayedAt);
      tempObject.position.copy(position);
      tempObject.scale.set(scale, scale, scale);
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
      meshRef.current.setColorAt(i, color);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  }, [nodes]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, nodes.length]}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (e.instanceId !== undefined && nodes[e.instanceId]) setHoveredTrackId(nodes[e.instanceId].trackId);
      }}
      onPointerOut={() => setHoveredTrackId(null)}
      onClick={(e) => {
        e.stopPropagation();
        if (e.instanceId !== undefined && nodes[e.instanceId]) setSelectedTrackId(nodes[e.instanceId].trackId);
      }}
    >
      <octahedronGeometry args={[0.8, 0]} />
      <meshBasicMaterial wireframe color="#000000" />
    </instancedMesh>
  );
}
```

### 3.3 시간축 적색편이 엔진 (Time-Decay Redshift)

`engine/RedshiftEngine.ts`:

```ts
import * as THREE from 'three';

const HALF_LIFE_DAYS = 30;
const LAMBDA = Math.LN2 / HALF_LIFE_DAYS;

export interface RedshiftResult {
  position: THREE.Vector3;
  color: THREE.Color;
  scale: number;
}

export function calculateRedshiftColorAndPosition(
  basePosition: THREE.Vector3,
  lastPlayedAtIso: string,
  nowDate: Date = new Date()
): RedshiftResult {
  const lastPlayed = new Date(lastPlayedAtIso);
  const diffDays = Math.max(0, (nowDate.getTime() - lastPlayed.getTime()) / (1000 * 3600 * 24));
  const decayFactor = Math.exp(-LAMBDA * diffDays); // 1.0(방금) → 0.0(오래됨)

  const activeColor = new THREE.Color('#00F0FF');
  const agedColor = new THREE.Color('#FF2200');
  const finalColor = agedColor.clone().lerp(activeColor, decayFactor);

  const driftFactor = 1 + (1 - decayFactor) * 0.4; // 오래될수록 외곽으로 1.4배 밀려남
  const finalPosition = basePosition.clone().multiplyScalar(driftFactor);

  const finalScale = 0.6 + decayFactor * 0.6;

  return { position: finalPosition, color: finalColor, scale: finalScale };
}
```

### 3.4 3D 공간 구역화(Sector Volume Capsule) 엔진

`engine/VolumeIntersection.ts`:

```ts
import * as THREE from 'three';
import { TrackNode } from '@/types';

export function getTracksIn3DVolume(
  nodes: TrackNode[],
  minBounds: [number, number, number],
  maxBounds: [number, number, number]
): TrackNode[] {
  const boundingBox = new THREE.Box3(new THREE.Vector3(...minBounds), new THREE.Vector3(...maxBounds));
  return nodes.filter((node) => boundingBox.containsPoint(new THREE.Vector3(...node.position3D)));
}
```

`components/3d/objects/SectorVolumeBox.tsx`:

```tsx
'use client';

import { Html } from '@react-three/drei';
import { SavedSector } from '@/types';

interface Props {
  sector: SavedSector;
  trackCount: number;
}

export default function SectorVolumeBox({ sector, trackCount }: Props) {
  const { min, max } = sector.bounds;
  const size: [number, number, number] = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
  const center: [number, number, number] = [
    (min[0] + max[0]) / 2,
    (min[1] + max[1]) / 2,
    (min[2] + max[2]) / 2,
  ];

  return (
    <group position={center}>
      <mesh>
        <boxGeometry args={size} />
        <meshBasicMaterial color="#000000" wireframe transparent opacity={0.3} />
      </mesh>
      <Html position={[0, size[1] / 2 + 2, 0]} center>
        <div className="rounded border border-black bg-[#E0F2E9]/90 px-2 py-1 font-mono text-[10px] tracking-wider text-black shadow-md backdrop-blur-sm">
          [{sector.name.toUpperCase()}] : {trackCount} TRACKS
        </div>
      </Html>
    </group>
  );
}
```

### 3.5 Web Audio API 3D Positional Audio & FFT 엔진

`engine/SpatialAudioEngine.ts`:

```ts
export class SpatialAudioEngine {
  private ctx: AudioContext | null = null;
  private pannerNodes: Map<string, PannerNode> = new Map();
  private audioElements: Map<string, HTMLAudioElement> = new Map();
  private analyser: AnalyserNode | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
    }
  }

  public registerAndPlay(trackId: string, url: string, position: [number, number, number]) {
    this.init();
    if (!this.ctx || !this.analyser) return;
    if (this.audioElements.has(trackId)) {
      this.audioElements.get(trackId)?.play();
      return;
    }

    const audio = new Audio(url);
    audio.crossOrigin = 'anonymous';
    audio.loop = true;

    const source = this.ctx.createMediaElementSource(audio);
    const panner = this.ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'exponential';
    panner.refDistance = 10;
    panner.maxDistance = 120;
    panner.positionX.setValueAtTime(position[0], this.ctx.currentTime);
    panner.positionY.setValueAtTime(position[1], this.ctx.currentTime);
    panner.positionZ.setValueAtTime(position[2], this.ctx.currentTime);

    source.connect(panner);
    panner.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    audio.play();
    this.audioElements.set(trackId, audio);
    this.pannerNodes.set(trackId, panner);
  }

  public updateListenerPosition(pos: [number, number, number]) {
    if (!this.ctx) return;
    const l = this.ctx.listener;
    l.positionX.setValueAtTime(pos[0], this.ctx.currentTime);
    l.positionY.setValueAtTime(pos[1], this.ctx.currentTime);
    l.positionZ.setValueAtTime(pos[2], this.ctx.currentTime);
  }

  public stopAll() {
    this.audioElements.forEach((audio) => audio.pause());
  }
}

export const spatialAudioEngine = new SpatialAudioEngine();
```

> ⚠️ SSR 주의: `new AudioContext()`는 반드시 브라우저 이벤트(클릭 등) 이후 클라이언트에서만 호출. 모듈 최상단에서 즉시 인스턴스화하지 말 것 (이번에 `three.js` CDN 스크립트를 layout에 잘못 둬서 전 라우트에 로드된 버그를 고친 것과 같은 종류의 실수를 피할 것).

### 3.6 세렌디피티 혜성(Comet) & 대척점 워프(Warp) 연출

`components/3d/objects/SerendipityComet.tsx`:

```tsx
'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGalaxyStore } from '@/store/useGalaxyStore';

export default function SerendipityComet() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const setSelectedTrackId = useGalaxyStore((state) => state.setSelectedTrackId);

  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(-100, -20, -50),
          new THREE.Vector3(-20, 50, 0),
          new THREE.Vector3(60, -30, 40),
          new THREE.Vector3(110, 40, -20),
        ],
        true
      ),
    []
  );

  useFrame(({ clock }) => {
    const t = (clock.getElapsedTime() * 0.08) % 1;
    meshRef.current?.position.copy(curve.getPoint(t));
  });

  return (
    <mesh
      ref={meshRef}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedTrackId('trk_comet_serendipity');
      }}
    >
      <sphereGeometry args={[1.2, 16, 16]} />
      <meshBasicMaterial color="#000000" wireframe />
    </mesh>
  );
}
```

`components/3d/postprocessing/TacticalEffects.tsx`:

```tsx
'use client';

import { EffectComposer, Bloom, DepthOfField, ColorAverage } from '@react-three/postprocessing';
import { useGalaxyStore } from '@/store/useGalaxyStore';

export default function TacticalEffects() {
  const isWarping = useGalaxyStore((state) => state.isWarping);
  return (
    <EffectComposer>
      <Bloom intensity={0.4} luminanceThreshold={0.8} />
      <DepthOfField focusDistance={0.02} focalLength={0.05} bokehScale={2} />
      {isWarping && <ColorAverage blendFunction={13} />}
    </EffectComposer>
  );
}
```

## 4. Zustand 전역 상태 구조

`store/useGalaxyStore.ts`:

```ts
import { create } from 'zustand';
import { TrackNode, ViewMode, SavedSector } from '@/types';

interface GalaxyState {
  viewMode: ViewMode;
  nodes: TrackNode[];
  hoveredTrackId: string | null;
  selectedTrackId: string | null;
  savedSectors: SavedSector[];
  isWarping: boolean;

  setViewMode: (mode: ViewMode) => void;
  setNodes: (nodes: TrackNode[]) => void;
  setHoveredTrackId: (id: string | null) => void;
  setSelectedTrackId: (id: string | null) => void;
  addSector: (sector: SavedSector) => void;
  triggerWarp: (isWarping: boolean) => void;
}

export const useGalaxyStore = create<GalaxyState>((set) => ({
  viewMode: 'GALAXY',
  nodes: [],
  hoveredTrackId: null,
  selectedTrackId: null,
  savedSectors: [],
  isWarping: false,

  setViewMode: (mode) => set({ viewMode: mode }),
  setNodes: (nodes) => set({ nodes }),
  setHoveredTrackId: (id) => set({ hoveredTrackId: id }),
  setSelectedTrackId: (id) => set({ selectedTrackId: id }),
  addSector: (sector) => set((state) => ({ savedSectors: [...state.savedSectors, sector] })),
  triggerWarp: (isWarping) => set({ isWarping }),
}));
```

## 5. TypeScript 핵심 인터페이스 (`types/index.ts`)

```ts
export type ViewMode = 'GALAXY' | 'SECTOR' | 'TWIN';

export interface TrackNode {
  trackId: string;
  title: string;
  artist: string;
  position3D: [number, number, number];
  similarity: number;
  lastPlayedAt: string;
  audioUrl: string;
  genre: string;
  isGapNode?: boolean;
}

export interface SavedSector {
  sectorId: string;
  name: string;
  bounds: { min: [number, number, number]; max: [number, number, number] };
  trackIds: string[];
  createdAt: string;
}

export interface TasteTwinData {
  twinUserId: string;
  matchPercentage: number;
  twinNodes: TrackNode[];
  gapNodeIds: string[];
}
```

## 6. 구현 마일스톤 체크리스트

### Phase 1 — Dynamic Canvas & Instanced Pipeline
- [x] `next/dynamic` `{ ssr: false }` Canvas 세팅 — `/galaxy` 새 라우트로 분리, 기존 `/` DRIFT 목업과 병행 (커밋 `ba59ceb`)
- [x] `InstancedMesh` 기반 800개 mock 노드 렌더링 + 호버/클릭 인터랙션 (`three-mesh-bvh`/`Bvh`는 호환성 이슈로 보류, 3.1 참고)
- [x] `RedshiftEngine` 개발 및 반감기 기반 위치/색상/크기 보간 파이프라인 연결
- [x] **(개정)** 단일 캔버스 `ViewMode`(GALAXY/SECTOR/TWIN) 스위칭 폐기 → `/galaxy`, `/explore`, `/twin` 독립 라우트로 분리. `/explore`, `/twin`은 스텁 페이지만 존재 (`app/explore/page.tsx`, `app/twin/page.tsx`)
- [x] **(개정)** 키보드(WASD) 항해는 스코프에서 완전히 제외 — 마우스 `CameraControls`만 사용. 노드 클릭 시 `setLookAt`으로 Fly-To 포커스 이동 구현 (`CanvasContainer.tsx`)
- [x] **실 데이터 연동 1단계** — `app/api/galaxy/route.ts`가 `backend GET /universe/stars`를 우선 시도(백엔드 다운/좌표 없음 시 mock 800개로 자동 폴백). 로그인 UI가 아직 없어 `frontend/lib/driftBackend.ts`가 데모 계정(`.env.local`, gitignored)으로 서버사이드 로그인 후 토큰 재사용. iTunes 검색 + Last.fm/iTunes 장르 태그로 실제 곡 15개 아카이브 + `POST /universe/refit` 실행 완료, `/galaxy`에서 실제 앨범커버·장르·미리듣기·제목·가수 확인. TODO: 정식 로그인 플로우, `UserSong.savedAt` 기반 `lastPlayedAt` 연동(현재는 전부 "방금 재생"으로 고정), 곡 수 늘어나면 `POSITION_SCALE` 재조정
- [ ] 1,000개 이상 노드 기준 60 FPS 실측 검증 (브라우저 프로파일링 필요)

### Phase 2 — Spatial Audio & Interaction Systems
- [x] Web Audio API `PannerNode` HRTF 공간 음향 엔진 구성 (`engine/SpatialAudioEngine.ts` + `AudioController.tsx`, 커밋 `567a550`)
- [x] `VolumeIntersection` 알고리즘 — 단, UX는 드래그 박스가 아니라 **곡을 하나씩 클릭해서 담는 방식**으로 변경 (`isSectorDrawMode` + `draftTrackIds`, `InstancedStars.tsx`/`SectorToolbar.tsx`)
- [x] `SectorVolumeBox` HTML 3D 프로필 메타 라벨
- [x] Sector 영속화용 API — `app/api/sectors/route.ts` (Next.js Route Handler, 서버 프로세스 메모리 저장 — 재시작하면 초기화됨, 실 DB 연동은 별도 작업)
- [x] **(개정)** `ClusterAnimationEngine.ts` — 섹터 지정 트랙이 자기 섹터 박스 위치로 프레임 단위 lerp 집결하는 모션. `SectorToolbar`의 "클러스터 정렬" 토글로 켜고 끔
- [ ] `SectorCreatorToolbar` 정식 UI (지금은 최소 토글 버튼만 있는 `SectorToolbar.tsx`)
- [ ] 실제 오디오 파일 (지금은 `/audio/sample.mp3`가 존재하지 않아 재생은 조용히 실패함)

### Phase 3 — Twin Scene & Visual Polish
- [x] **(개정)** `/twin` 라우트에 `TwinScene.tsx` 구현 — 1:1 오버레이 아님, Twin 유저 우주를 단독 렌더링(mock `app/api/twin/route.ts`, `useTwinStore.ts`, `TwinStars.tsx`, `TwinCanvasContainer.tsx`, `TwinHud.tsx`). Gap Node는 `#FF0055` + `TARGET DISCOVERY` `Html` 라벨로 표기, 노드 크기도 1.4배 확대해 시각적으로 강조. 클릭 시 Fly-To 카메라 이동은 Galaxy와 동일한 패턴(RedshiftEngine 보정 좌표 기준)으로 구현
- [x] `/explore` 라우트: 코사인 유사도 High/Mid/Low 존 분리(`engine/SimilarityZones.ts` — 반지름 방사형 매핑 + 구역 판별) + `SimilarityZoneShells.tsx`(경계 와이어프레임 구 + 라벨), mock `app/api/explore/route.ts`(600 노드), `useExploreStore.ts`
- [x] `SerendipityComet` 3차원 스플라인 애니메이션(`SerendipityComet.tsx`, HIGH/MID 경계 0.3~0.5 유사도 구간 순찰) 및 클릭 이벤트로 경계 트랙 무작위 포착 → 선택/Fly-To. 실 데이터라 후보가 적어 그 구간이 비어있을 땐 유사도 0.4에 가장 가까운 곡으로 대체
- [x] 대척점 블랙홀 워프 — HUD 버튼 클릭 시 유사도 하위 10% 중 무작위 노드로 Fly-To(절대 임계값 `-0.7` 대신 상대 퍼센타일 — 실 코사인 유사도는 태그가 전부 0 이상이라 사실상 음수가 안 나옴) + `TacticalEffects.tsx`(`@react-three/postprocessing`의 `ColorAverage`)로 워프 중에만 흑백 반전, 전환 종료 후 자동 해제
- [x] **실 데이터 연동** — `app/api/explore/route.ts`가 `backend GET /songs/recommend/full`(신규, 임계값 없이 코사인 유사도 전체 반환)을 우선 시도, 실패/후보 없음 시 mock 600개로 폴백. `RecommendService.recommendFull()` 추가. HUD에 실제 MATCH % + 앨범 커버 노출
- [ ] Bloom/DOF 등 상시 후처리 비주얼 폴리시 (워프 전용 `ColorAverage`만 우선 적용, 나머지는 추후 성능 검증 후 추가)
