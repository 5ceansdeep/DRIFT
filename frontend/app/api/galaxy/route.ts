import { NextResponse } from "next/server";
import { TrackNode } from "@/types";
import { fetchBackendStars } from "@/lib/driftBackend";

// docs/tech-spec.md 2.3 참고.
// backend GET /universe/stars(좌표가 PCA로 계산된 곡)를 우선 시도하고,
// 백엔드가 꺼져 있거나 좌표가 준비된 곡이 하나도 없으면 mock 800개로 폴백한다
// (다른 개발자가 backend 없이도 /galaxy를 계속 볼 수 있게).
const GENRES = ["Synthwave", "Ambient", "Indie", "Lo-fi", "Electronic", "Classical"];

// backend PCA 좌표는 현재 표본이 적어(15곡) ±1 안팎으로 매우 좁게 뭉쳐 나온다.
// 기존 mock 데이터(±80 스케일)와 카메라/컨트롤 설정을 그대로 재사용할 수 있게
// 시각적으로 펼쳐주는 임시 배율 — 곡 수가 늘어 PCA 분산이 커지면 낮춰야 한다.
const POSITION_SCALE = 60;

function generateMockNodes(): TrackNode[] {
  const nodeCount = 800;
  return Array.from({ length: nodeCount }).map((_, index) => ({
    trackId: `trk_${index + 1}`,
    title: `Track Alpha ${index + 1}`,
    artist: `Artist Node ${index % 20}`,
    position3D: [
      (Math.random() - 0.5) * 160,
      (Math.random() - 0.5) * 160,
      (Math.random() - 0.5) * 160,
    ],
    similarity: Math.random() * 2 - 1,
    lastPlayedAt: new Date(
      Date.now() - Math.random() * 1000 * 3600 * 24 * 90
    ).toISOString(),
    audioUrl: `/audio/sample.mp3`,
    genre: GENRES[index % GENRES.length],
  }));
}

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const overrideToken = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;

  try {
    const stars = await fetchBackendStars(overrideToken);
    if (stars.length === 0) throw new Error("좌표가 준비된 곡 없음 (POST /universe/refit 필요)");

    const nodes: TrackNode[] = stars.map((s) => ({
      trackId: s.id,
      title: s.title,
      artist: s.artist,
      position3D: [
        s.coord.x * POSITION_SCALE,
        s.coord.y * POSITION_SCALE,
        s.coord.z * POSITION_SCALE,
      ],
      // similarity는 Galaxy 뷰에서 안 쓰여서 중립값. lastPlayedAt은 실제
      // UserSong.savedAt(내가 저장한 곡이면) 또는 곡이 DB에 들어온 시각 —
      // RedshiftEngine이 이걸로 색/드리프트를 계산한다.
      similarity: 0,
      lastPlayedAt: s.lastPlayedAt,
      audioUrl: s.previewUrl ?? "/audio/sample.mp3",
      genre: s.genreTags[0] ?? "Unknown",
      coverUrl: s.coverUrl,
    }));

    return NextResponse.json({ nodes, source: "backend" });
  } catch (err) {
    console.warn("[api/galaxy] backend 연동 실패, mock 데이터로 폴백:", err);
    return NextResponse.json({ nodes: generateMockNodes(), source: "mock" });
  }
}
