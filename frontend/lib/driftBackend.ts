// 서버 전용 모듈 — Route Handler에서만 import할 것 (클라이언트 컴포넌트에서
// import하면 DRIFT_DEMO_PASSWORD가 브라우저 번들에 노출될 수 있다).
// NestJS 백엔드(GET /universe/stars) 서버사이드 프록시용 헬퍼.
// 프론트에 아직 로그인 UI가 없어서, 데모 계정으로 대신 로그인해 토큰을 얻는다.
// docs/tech-spec.md 2.3 "실 데이터 연동" 항목의 첫 단계 — 실제 로그인 플로우가
// 붙기 전까지의 임시 다리(bridge) 역할.
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

async function authedFetch(path: string, retried = false): Promise<Response> {
  const token = cachedToken ?? (await login());
  const res = await fetch(`${BACKEND_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  // 캐시된 토큰이 만료됐으면 한 번 재로그인 후 재시도
  if (res.status === 401 && !retried) {
    cachedToken = null;
    return authedFetch(path, true);
  }
  return res;
}

/** GET /universe/stars — 좌표(coordX/Y/Z)가 계산된 곡만 반환된다 (PCA refit 필요). */
export async function fetchBackendStars(): Promise<BackendStar[]> {
  const res = await authedFetch("/universe/stars");
  if (!res.ok) throw new Error(`/universe/stars 조회 실패: ${res.status}`);
  return res.json();
}
