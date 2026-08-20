# DRIFT 시스템 상세 개발 명세서 (Technical Design Spec)

> 원본: Notion 문서 "[DRIFT] Next.js App Router 기반 시스템 상세 개발 명세서"를 이 저장소용으로 정리.
> **이 프로젝트는 원본 스펙의 Vite 대신 Next.js App Router를 그대로 사용한다** (이미 결정됨, [../README.md](../README.md) 참고).
> 아래 예시 코드의 파일 경로(`app/`, `components/`, `store/` 등)는 Next.js 기준으로 그대로 적용 가능.

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

이 저장소에서는 `components/3d/`를 이미 `frontend/components/3d/`로 시작했다 ([InstancedStars.tsx](../frontend/components/3d/InstancedStars.tsx) 프로토타입 존재).

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

> ⚠️ `frontend/app/prototype/page.tsx` 프로토타입은 이 스펙보다 앞서 `<Bvh>`를 뺀 상태다 (drei 10.7.8 + InstancedMesh 조합에서 화면 멈춤 이슈 확인됨 — [git log](../frontend) 커밋 `c539852` 근방 참고). 본 기능 구현 시 `Bvh` 재도입 여부는 노드 수 규모를 보고 별도 검증 필요.

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
- [ ] `next/dynamic` `{ ssr: false }` Canvas 세팅 (`app/page.tsx` ↔ 기존 DRIFT 목업 `/` 라우트와 공존 방식 결정 필요)
- [ ] `InstancedMesh` + `three-mesh-bvh` 결합: 1,000개 노드 기준 60 FPS 검증
- [ ] `RedshiftEngine` 개발 및 반감기 기반 위치/색상 보간 파이프라인 연결

### Phase 2 — Spatial Audio & Interaction Systems
- [ ] Web Audio API `PannerNode` HRTF 공간 음향 엔진 구성
- [ ] `VolumeIntersection` 알고리즘: 3D 마우스 드래그 볼륨 크기 내 포함 곡 필터링
- [ ] `SectorVolumeBox` HTML 3D 프로필 메타 라벨 및 아카이브 API 통합

### Phase 3 — Twin Overlay & Visual Polish
- [ ] `TwinOverlayScene` 구현 (사용자: Cyan 와이어프레임 vs Twin: Slate White 와이어프레임)
- [ ] `SerendipityComet` 3차원 스플라인 애니메이션 및 포함 이벤트를 통한 Gap Node 검색 처리
- [ ] Post-processing(Bloom, DOF, ColorInvert) 통합으로 최종 전역 연구실 비주얼 완성
