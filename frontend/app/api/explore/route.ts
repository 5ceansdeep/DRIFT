import { NextResponse } from "next/server";
import type { TrackNode } from "@/types";
import { fetchRecommendCandidates } from "@/lib/driftBackend";
import { radiusForSimilarity } from "@/engine/SimilarityZones";

// 실 데이터 연동: backend GET /songs/recommend/full(코사인 유사도)를 우선 시도.
// 백엔드가 꺼져 있거나 후보곡이 없으면(아카이브 전, taste_vector 없음 등)
// mock 600개로 자동 폴백 — docs/tech-spec.md 2.3/3.6 참고.
const GENRES = ["Noise Rock", "Free Jazz", "Drone", "IDM", "Field Recording", "Krautrock"];
const NODE_COUNT = 600;

function randomUnitVector(): [number, number, number] {
  // 구면상 균등 분포 (Marsaglia 방법)
  let x, y, z, d2;
  do {
    x = Math.random() * 2 - 1;
    y = Math.random() * 2 - 1;
    z = Math.random() * 2 - 1;
    d2 = x * x + y * y + z * z;
  } while (d2 === 0 || d2 > 1);
  const d = Math.sqrt(d2);
  return [x / d, y / d, z / d];
}

function generateMockNodes(): TrackNode[] {
  const nodes: TrackNode[] = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    const similarity = Math.random() * 2 - 1; // -1 ~ 1
    const radius = radiusForSimilarity(similarity);
    const [ux, uy, uz] = randomUnitVector();

    nodes.push({
      trackId: `exp-track-${i}`,
      title: `Explore Track ${i}`,
      artist: `Explore Artist ${i % 24}`,
      position3D: [ux * radius, uy * radius, uz * radius],
      similarity,
      lastPlayedAt: new Date(
        Date.now() - Math.random() * 180 * 24 * 3600 * 1000
      ).toISOString(),
      audioUrl: "/audio/sample.mp3",
      genre: GENRES[i % GENRES.length],
    });
  }
  return nodes;
}

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const overrideToken = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;

  try {
    const candidates = await fetchRecommendCandidates(overrideToken);
    if (candidates.length === 0) {
      throw new Error("추천 후보 없음 (아카이브 곡 없음 또는 taste_vector 미생성)");
    }

    const nodes: TrackNode[] = candidates.map((c) => {
      // recommend 결과엔 3D 위치가 없다 — 방향은 무작위, 반지름만 실제 유사도로 결정.
      const radius = radiusForSimilarity(Math.max(-1, Math.min(1, c.similarity)));
      const [ux, uy, uz] = randomUnitVector();

      return {
        trackId: c.id,
        title: c.title,
        artist: c.artist,
        position3D: [ux * radius, uy * radius, uz * radius],
        similarity: c.similarity,
        lastPlayedAt: new Date().toISOString(),
        audioUrl: c.previewUrl ?? "/audio/sample.mp3",
        genre: c.genreTags[0] ?? "Unknown",
        coverUrl: c.coverUrl,
      };
    });

    return NextResponse.json({ nodes, source: "backend" });
  } catch (err) {
    console.warn("[api/explore] backend 연동 실패, mock 데이터로 폴백:", err);
    return NextResponse.json({ nodes: generateMockNodes(), source: "mock" });
  }
}
