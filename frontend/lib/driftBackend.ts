// 서버 전용 모듈 — Route Handler에서만 import할 것 (클라이언트 컴포넌트에서
// import하면 DRIFT_DEMO_PASSWORD가 브라우저 번들에 노출될 수 있다).
// NestJS 백엔드(GET /universe/stars) 서버사이드 프록시용 헬퍼.
// 실제 로그인한 유저가 있으면 그 토큰(overrideToken, 클라이언트가
// Authorization 헤더로 넘겨준 값)을 그대로 쓰고, 없으면 데모 계정으로
// 대신 로그인해 폴백한다 (로그인 안 하고도 /galaxy·/explore를 구경할 수 있게).
const BACKEND_URL = process.env.DRIFT_BACKEND_URL ?? "http://localhost:3001";

interface BackendStar {
  id: string;
  title: string;
  artist: string;
  coverUrl: string | null;
  previewUrl: string | null;
  genreTags: string[];
  coord: { x: number; y: number; z: number };
}

// 토큰은 서버 프로세스 메모리에만 캐시 (dev 서버 재시작 전까지 재사용, ~7일 만료).
let cachedToken: string | null = null;

async function login(): Promise<string> {
  const email = process.env.DRIFT_DEMO_EMAIL;
  const password = process.env.DRIFT_DEMO_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "DRIFT_DEMO_EMAIL / DRIFT_DEMO_PASSWORD 미설정 — frontend/.env.local 확인 필요"
    );
  }

  const res = await fetch(`${BACKEND_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`백엔드 로그인 실패: ${res.status}`);

  const data = (await res.json()) as { accessToken: string };
  cachedToken = data.accessToken;
  return cachedToken;
}

async function authedFetch(
  path: string,
  overrideToken?: string,
  retried = false
): Promise<Response> {
  const token = overrideToken ?? cachedToken ?? (await login());
  const res = await fetch(`${BACKEND_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  // 데모 계정 캐시 토큰이 만료됐으면 한 번 재로그인 후 재시도.
  // overrideToken(실 유저 토큰)은 서버가 대신 갱신해줄 수 없으니 재시도하지 않는다 —
  // 401이면 그대로 호출부에 돌려줘서 mock 폴백 등으로 처리하게 한다.
  if (res.status === 401 && !retried && !overrideToken) {
    cachedToken = null;
    return authedFetch(path, undefined, true);
  }
  return res;
}

/** GET /universe/stars — 좌표(coordX/Y/Z)가 계산된 곡만 반환된다 (PCA refit 필요). */
export async function fetchBackendStars(overrideToken?: string): Promise<BackendStar[]> {
  const res = await authedFetch("/universe/stars", overrideToken);
  if (!res.ok) throw new Error(`/universe/stars 조회 실패: ${res.status}`);
  return res.json();
}

export interface RecommendCandidate {
  id: string;
  title: string;
  artist: string;
  coverUrl: string | null;
  previewUrl: string | null;
  genreTags: string[];
  similarity: number; // 코사인 유사도, -1~1 (실질적으로는 태그가 0/1 가중치라 보통 0~1)
}

/**
 * GET /songs/recommend/full — 아카이브 안 한 곡 전체 + 실제 코사인 유사도.
 * Explore 뷰의 HIGH/MID/LOW 존을 채우는 데 쓰인다 (mock 랜덤 유사도 대체).
 */
export async function fetchRecommendCandidates(
  overrideToken?: string
): Promise<RecommendCandidate[]> {
  const res = await authedFetch("/songs/recommend/full", overrideToken);
  if (!res.ok) throw new Error(`/songs/recommend/full 조회 실패: ${res.status}`);
  const data = (await res.json()) as { songs: RecommendCandidate[] };
  return data.songs;
}

export interface BackendTwinNode {
  id: string;
  title: string;
  artist: string;
  coverUrl: string | null;
  previewUrl: string | null;
  genreTags: string[];
  coord: { x: number; y: number; z: number };
  isGapNode: boolean;
}

export interface BackendTwin {
  twinUserId: string;
  twinUsername: string;
  matchPercentage: number;
  twinNodes: BackendTwinNode[];
}

/** GET /users/twin — taste_vector 코사인 유사도 최고 1명 + 그 유저의 아카이브(Gap Node 포함). */
export async function fetchTwin(overrideToken?: string): Promise<BackendTwin | null> {
  const res = await authedFetch("/users/twin", overrideToken);
  if (!res.ok) throw new Error(`/users/twin 조회 실패: ${res.status}`);
  const data = (await res.json()) as { twin: BackendTwin | null; message?: string };
  return data.twin;
}
