# DRIFT Backend

음악 취향 기반 3D 소셜 아카이브 플랫폼 **DRIFT**의 백엔드 서버.

## 기술 스택

- **Runtime**: Node.js
- **Framework**: NestJS
- **ORM**: Prisma 7
- **Database**: PostgreSQL
- **Auth**: JWT
- **API 문서**: Swagger (`/api`)
- **벡터 계산**: Last.fm API
- **차원 축소**: Python UMAP 스크립트

## 시작하기

```bash
cd backend
npm install
npm run dev        # 개발 서버 (watch mode)
```

Swagger UI: `http://localhost:3000/api`

## 환경변수 (.env)

```
DATABASE_URL=
JWT_SECRET=
Lastfm_API_KEY=
```

## 프로젝트 구조

```
src/
├── auth/           # 인증 (회원가입/로그인)
├── songs/          # 곡 검색/아카이브 + song_vector 계산
├── satellites/     # 수동 추천곡 등록/수정/조회
├── prisma/         # DB 연결
└── app.module.ts

umap/
├── compute_user_coords.py   # taste_vector → 유저 3D 좌표 (행성)
├── compute_song_coords.py   # song_vector → 곡 3D 좌표 (별)
└── requirements.txt

scripts/
├── collect_songs.py         # Last.fm 차트 기반 초기 곡 풀 수집
└── requirements.txt
```

## API 목록

### Auth
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/auth/signup` | 회원가입 |
| POST | `/auth/login` | 로그인 (JWT 반환) |

### Songs
| Method | Endpoint | 설명 | Auth |
|--------|----------|------|------|
| GET | `/songs/search?q=` | 곡 검색 (iTunes) | - |
| POST | `/songs/archive` | 곡 아카이브 저장 | O |
| GET | `/songs/my` | 내 아카이브 목록 | O |
| DELETE | `/songs/my/:id` | 아카이브에서 곡 삭제 | O |

### Satellites
| Method | Endpoint | 설명 | Auth |
|--------|----------|------|------|
| POST | `/satellites` | Satellite 등록 (최대 3개) | O |
| GET | `/satellites/my` | 내 Satellite 목록 | O |
| GET | `/satellites/user/:userId` | 특정 유저의 Satellite 목록 | O |
| PATCH | `/satellites/:id` | Satellite 수정 | O |

## 벡터 시스템

### song_vector (75차원)
곡 아카이브 시 Last.fm API로 태그를 가져와 자동 생성.
- `track.getTopTags` → 없으면 `artist.getTopTags` fallback
- 75개 태그 차원 (장르/서브장르/무드/시대/특성/국가)
- 표기 차이 정규화 (`kpop` → `k-pop` 등)

### 곡 풀 수집
추천 API를 위한 곡 데이터 확보 방법:
- **초기 수집**: `scripts/collect_songs.py`로 Last.fm 인기 차트 250곡 수집
- **자동 확장**: 검색 시 결과를 백그라운드로 songs 테이블에 자동 저장 (song_vector는 아카이브 시 생성)

### taste_vector (75차원)
유저가 아카이브한 곡들의 song_vector 평균값. 저장/삭제 시 자동 갱신.

### UMAP 좌표 계산 (Python)

```bash
cd backend/umap
pip install -r requirements.txt

python compute_user_coords.py   # 유저 행성 좌표 계산
python compute_song_coords.py   # 곡 별 좌표 계산
```

- 기본 metric: `euclidean` (값 크기 차이 반영)
- cosine 버전은 각 스크립트 내 주석 처리되어 있음

## DB 관리

```bash
npx prisma studio   # DB GUI
npx prisma migrate dev --name <name>   # 마이그레이션
```

## 보류 API
- 소셜 API (팔로우/팔로워)
- 플레이리스트 공유 API (DB 스키마 변경 필요)
