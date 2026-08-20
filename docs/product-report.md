# DRIFT 종합 보고서

> 원본: Notion 문서 "DRIFT 종합 보고서" / "[DRIFT] Web-Only 3D 공간형 취향 탐색 엔진: 통합 개발 가이드라인 및 서비스 종합 보고서"를 이 저장소용으로 정리.
> 구현 세부 코드는 [tech-spec.md](tech-spec.md) 참고. 이 문서는 제품/디자인 컨텍스트.

## 1. 프로젝트 개요

- **프로젝트명**: DRIFT
- **핵심 정의**: 80차원 데이터 벡터 기반의 취향 구조를 3차원 공간 위상(Topology)으로 변환하여, 사용자가 능동적으로 음악을 탐험하도록 만드는 웹 전용 3D 공간형 세렌디피티 탐색 엔진(Spatial Serendipity Engine).
- **핵심 슬로건**: "당신의 취향이 우주가 됩니다" — 알고리즘적 리스트 소비에서 벗어난 3차원 자율 항해.

### 1.1 문제 제기

기존 음악 플랫폼(Spotify, YouTube Music 등)의 2D 리스트 추천 알고리즘은 단기적 체류 시간을 극대화하기 위해 유사한 취향의 음악만 지속적으로 제공하는 한계가 있음.

- **필터 버블**: 추천 알고리즘이 사용자의 과거 데이터만 필터링하여 특정 취향 안에 가두는 현상 (Pariser, 2011).
- **에코 챔버**: 유사한 취향 범주의 음악만 반복 노출되어 편향이 증폭되는 구조 (Sunstein, 2017).
- **청취 다양성의 결여**: Spotify 데이터를 활용한 연구에 따르면, 단기적 추천 편의성이 장기적으로는 청취 음악적 다양성을 크게 왜곡함 (Anderson et al., 2020).

### 1.2 3D 공간화의 기획적 당위성

**"거리 = 취향의 격차 (Distance = Disparity in Taste)"** — 단순 시각화 기믹이 아니라, 데이터 간 공간적 거리감을 직관적으로 부여함으로써 사용자가 자신의 취향 경계를 눈으로 확인하고, 스스로 그 경계를 넘나드는 '능동적 세렌디피티'를 경험하게 하는 인터페이스.

## 2. 디자인 정체성 및 비주얼 연출 전략

### 2.1 비주얼 컨셉: 전술 레이더 & 연구실 인터페이스 (Tactical Blueprint)

일반적인 '어두운 SF 우주' 클리셰에서 벗어난, 최첨단 음향 연구실에서 분석 모니터를 직접 조작하는 듯한 **전술 블루프린트(Tactical Blueprint / Synth-Lab)** 감성.

- **Main Color**: 라이트 민트 그린 (`#E0F2E9` 계열)
- **Sub Color**: 모노크롬 블랙 (`#000000`), 그리드 가이드라인
- **Twin Color**: 슬레이트 화이트/그레이 (`#E2E8F0` — 비교 오버레이용)
- **Typography**: IBM Plex Mono (UI/데이터 수치) + 조선굴림체 / Unbounded (메인 타이핑)
- **인상 및 가치**: 사용자로 하여금 단순 오락 소비가 아닌, 자신의 음악 취향 데이터를 정교하게 과학적으로 조사·탐색하고 있다는 지적 신뢰감과 힙한 브랜드 감성을 전달.

### 2.2 감각적 몰입 연출

- **Audio-Reactive Wireframe**: 선택된 큐브/노드가 재생 음원의 오디오 파형(FFT) 및 비트에 맞춰 3D 와이어프레임 형태로 미세하게 반응·진동.
- **Depth of Field (DOF) & Spatial Fog**: 카메라 초점과 멀어지는 외곽 노드에 그리드 레이어의 아웃포커싱 및 안개 효과를 적용하여 밝은 배경 안에서도 명확한 Z축 공간 깊이감 제공.
- **역공간 시각 반전 (Inversion Effect)**: 일반 탐색은 민트 뷰로 진행되다가, 대척점(블랙홀) 지점을 클릭하면 전체가 색상 흑백 반전되며 극적 몰입감 연출.

### 2.3 웹 전용 UX 인터랙션

- **마우스 호버(Hover) 피드백**: 커서를 3D 노드 위에 올리면 해당 노드가 3D 와이어프레임으로 분해/발광하며, 해당 트랙의 3D 앰비언스 페이드인.
- **데스크톱 탐색 컨트롤**: 마우스 휠(Scroll Zoom)을 통한 스케일 전환, 우클릭 드래그(Orbit & Pan)를 통한 공간 회전, 키보드(WASD / 방향키)를 통한 3D 공간 자유 항해.

## 3. 정제된 3대 공간 뷰 체계 (Cleaned-Up View System)

과도한 애니메이션과 잡다한 요소를 제거하고 몰입감 있는 탐색을 위해 전체 구조를 3가지 모드로 명확히 분리.

```
[1. Galaxy View] ──(구역 지정)──> [2. Sector Archive View]
       │
       └──(Twin 동기화)──> [3. Taste Twin View (1:1 Overlay)]
```

### 3.1 Galaxy View (메인 우주 탐색 뷰)

- **특징**: 100% 내 데이터만 존재하는 완전한 개인 공간.
- **경험**: 마우스 드래그 및 키보드 조작으로 3D 공간을 자유롭게 항해하며, 혜성 포착, 대척점 워프, 공간 구역(Sector) 지정이 가능.

### 3.2 Sector Archive View (3D 공간 구역화 아카이브)

- **특징**: 지루한 2D 텍스트 플레이리스트를 대체하는 3D 공간 구역화(Bounding Volume) 뷰.
- **경험**: 탐색 중 마우스 드래그로 지정한 공간 구역이 투명 3D 바운딩 박스(Sector Cube)로 저장되며, 아카이브 모드 진입 시 내가 저장한 N개의 3D 섹터 캡슐들만 정갈하게 격자배치됨.
- **프로필 메타 라벨**: 각 캡슐 상단에 IBM Plex Mono 폰트로 메타 정보 프로필 (`[SECTOR 01: 14 TRACKS / AVG SIMILARITY 0.89]`).

### 3.3 Taste Twin View (1:1 취향 쌍둥이 오버레이 뷰)

- **특징**: 다수 유저를 잇지 않고, 백엔드 코사인 유사도가 가장 높은 단 1명의 '취향 쌍둥이(Taste Twin)' 데이터만 1:1 매핑.
- **경험**: 내 3D 공간 위에 Twin의 우주를 투명하게 겹쳐 시각화 (내 색상: 민트 그린, Twin 색상: 슬레이트 화이트).
- **Gap Node 발굴**: 나와 겹치지 않는 Twin의 노드에 `TARGET DISCOVERY` 표시를 부여하여, 나에게는 미지지만 취향에 100% 부합하는 최고의 추천곡 발굴.

## 4. 핵심 프리미엄 기능 상세 메커니즘

| 기능명 | 메커니즘 | 핵심 가치 및 UX |
|---|---|---|
| **① 취향의 대척점 (Antipode & Blackhole Warp)** | 유사도가 가장 낮은(-1) 영역을 3D 우주 반대편 워프 구역으로 지정. 클릭 시 흑백 반전 과와 함께 워프 이동. | 필터 버블의 강제 깨뜨림 — 극단적으로 새로운 장르 진입. |
| **② 3D 섹터 아카이빙 (Spatial Volume Capsule)** | 드래그로 3D 공간 위의 바운딩 박스(Sector)를 지정해 캡슐 형태로 아카이빙. | 지친 플레이리스트 대신 정갈한 3D 가이드 블록으로 플레이리스트 시각화. |
| **③ 세렌디피티 혜성 (Serendipity Comet)** | 코사인 유사도 0.3~0.5 범위의 경계 구역을 가로지르는 빛 있는 유성을 마우스로 포착. | 정밀한 미시 경계 영역을 사용자 부담 없이 자연스럽게 인지. |
| **④ 1:1 취향 쌍둥이 (Taste Twin & Gap Node)** | 나와 최상위 유사도 1인의 데이터를 오버레이하여 빈 공간을 'Gap Node' 타겟화. | 한 유저 노이즈 없이 99% 확신할 수 있는 미시 곡을 정교하게 발굴. |
| **⑤ 시간축 적색편이 (Time-Decay Redshift)** | 반감기 함수($e^{-\lambda t}$)를 적용, 방치된 음악은 외곽으로 밀려나며 색이 붉은색으로 전이. | 3D 공간을 따라보는 것만으로 과거의 추억과 취향 변화 추적 학습. |
| **⑥ 하이브리드 웜홀 (Cosmic Wormhole)** | 이종 장르 클러스터 간 교량 트랙(Bridge Track)을 3D Spline 터널로 연결하여 이동. | 서로 먼 장르 간 이동 시 의도적 서사 맥락(Context) 제공. |

## 5. 시스템 아키텍처 및 기술 구현 명세 (Web-Only)

### 5.1 웹 전용 기술 스택

- **Core Framework**: React 18, Vite, TypeScript — **이 저장소는 Vite 대신 Next.js App Router 채택** ([tech-spec.md](tech-spec.md) 상단 참고)
- **3D Graphic Engine**: `three.js`, `@react-three/fiber` (R3F), `@react-three/drei`
- **Post-Processing**: `@react-three/postprocessing` (Bloom, DepthOfField)
- **Audio Engine**: Browser Native Web Audio API (`AudioContext`, `PannerNode`, `AnalyserNode`)
- **State Management**: `Zustand`
- **Interaction Utility**: `three-mesh-bvh` (마우스 레이캐스팅 계산 최적화)
- **Backend (원본 스펙 기준)**: Python (FastAPI), Scikit-learn (PCA/UMAP 차원 축소), Milvus/Pinecone (Vector DB)
  - ⚠️ **이 저장소의 실제 백엔드는 NestJS + Prisma + PostgreSQL** (`backend/`), PCA는 Python 스크립트(`backend/umap/`)로 오프라인 계산. Vector DB는 아직 미도입 — Postgres에 벡터를 배열 컬럼으로 직접 저장 중.

### 5.2 데이터-시각-조작 매핑 테이블 (Interaction Matrix)

| 백엔드 데이터 (Input) | 시각/사운드 표현 (Output) | 사용자 조작 (Interaction) |
|---|---|---|
| 코사인 유사도 (1 ~ -1) | 3D 공간 위의 거리가 가까워지거나 멀어짐 | 마우스 휠 및 공간 3D 줌 탐색 |
| 청취 빈도 및 신호도 | 별의 크기, 발광도(Glow), 앰비언스 볼륨 | 마우스 호버 및 포커싱 |
| 마지막 청취 시점 (t) | 색상 상태 (최근: 밝은 청백색 → 오래됨: 붉은색) | 시간 흐름 제어 또는 자동 렌더링 |
| 세렌디피티 (0.3 ~ 0.5) | 공간을 가로지르는 빛 있는 유성 (Comet) | 혜성 마우스 클릭 / 포획 |
| 극단적 유사도 (-1) | 주요 빛을 흡수하는 워프 공간 왜곡 영역 | 블랙홀 워프 버튼 클릭 / 이동 |

### 5.3 차원 축소 정보 손실 방어 논리 (예상 QA 대응)

- **질문**: "80차원을 3차원으로 축소(PCA)하면 데이터 분산 정보 손실이 심하지 않은가?"
- **논리적 방어**: "3D 우주 공간은 사용자의 직관적인 시각 탐색을 위한 **매크로 지도(Macro Navigation)** 역할만 수행한다. 실제 정밀 추천 알고리즘 및 유저 일치율 계산은 **백엔드의 80차원 고차원 공간에서 코사인 유사도**를 직접 산출하므로 추천 정확도는 데이터 정밀도를 완벽히 유지한다."

### 5.4 웹 성능 최적화 전략

- **InstancedMesh**: 수천 개의 음악 노드를 단 1회의 Draw Call로 처리하여 GPU 부하 절감.
- **three-mesh-bvh**: 마우스 이동 시 수행되는 레이캐스팅 연산 복잡도를 $O(N)$에서 $O(\log N)$으로 단축.
- **Audio-Reactive 스코프 제한**: 카메라에 근접한 타겟 노드 1~2개에만 Web Audio API `AnalyserNode`를 결합하여 FFT 와이어프레임 반응 연산 수행.

## 6. MVP 개발 로드맵 (3단계 Phase)

```
[ Phase 1: Core Engine ] ──> [ Phase 2: Sensory & Mode ] ──> [ Phase 3: Visual Polish ]
- Vite + R3F 웹 환경 구축   - Positional Audio 연동      - 적색편이 파티클 적용
- 80D → 3D PCA 매핑        - 3D Sector Bounding Box     - 블랙홀 워프 흑백 반전
- InstancedMesh & BVH 적용   - Taste Twin 1:1 Overlay     - FFT 와이어프레임 반응
```

(이 저장소에서는 "Vite + R3F"를 "Next.js + R3F"로 치환하여 진행)

### Phase 1: Core Engine & Spatial Base (필수 MVP)

- [ ] Next.js + React + TypeScript 기반 R3F 캔버스 및 민트 그린 블루프린트 프레임 구축
- [ ] 80차원 백엔드 데이터 연동 및 PCA/UMAP 기반 3차원 좌표 변환 파이프라인 완성
- [ ] `InstancedMesh` 및 `three-mesh-bvh` 기반 마우스 호버 및 노드 클릭 상세 구현

### Phase 2: Sensory & Mode Expansion

- [ ] Web Audio API 기반의 공간 음향(Spatial Audio) 시스템 구축
- [ ] 마우스 드래그 기반 3D 바운딩 박스 지정 및 **Sector Archive View** 모드 구현
- [ ] 나와 가장 유사한 1인을 1:1 매핑하는 **Taste Twin Overlay** 및 Gap Node 시각화
- [ ] $0.3 \sim 0.5$ 유사도 구간을 가로지르는 '혜성 포획' 이벤트를 웹 인터랙션으로 구현

### Phase 3: Visual Polish & Advanced Astrophysics

- [ ] 시간 감쇠 공식 기반의 '시간축 적색편이' 파티클을 실시간 색상 전이 적용
- [ ] '대척점 블랙홀 워프' 진입 시 색공간 흑백 반전(Invert) 및 카메라이동 연출
- [ ] 오디오 FFT 연동 비트 반영 3D 와이어프레임 파티클 최적화

## 7. 이 저장소 현재 상태와의 정합성 메모

- `frontend/`는 Next.js App Router로 이미 세팅됨, Vite 아님 (합의 완료).
- `frontend/app/page.tsx`(`/`)는 별도의 정적 DRIFT v4 목업(Landing/Explore/Archive/Add Track/Social/Settings, vanilla Three.js)이 이미 포팅되어 있음 — 본 스펙의 Galaxy/Sector/Twin 3뷰 체계와는 다른 UI. **결정: 본 스펙 기능은 `/galaxy` 같은 새 라우트로 분리 구축, 기존 `/` 목업은 유지하며 병행 개발.**
- `frontend/components/3d/InstancedStars.tsx` + `frontend/app/prototype/page.tsx`: 큐브 1,000개 InstancedMesh 호버 프로토타입 존재 (본 스펙 3.2의 원형). `Bvh` 래퍼는 `InstancedMesh`와의 호환성 이슈로 현재 제외된 상태.
- backend는 NestJS + Prisma + PostgreSQL, 75차원 벡터를 Postgres 배열 컬럼에 저장 (Vector DB 미도입). PCA는 `backend/umap/*.py` 오프라인 스크립트.
