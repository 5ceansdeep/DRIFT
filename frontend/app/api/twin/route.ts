import { NextResponse } from "next/server";
import type { TasteTwinData, TrackNode } from "@/types";
import { fetchTwin } from "@/lib/driftBackend";

// 실 데이터 연동: backend GET /users/twin(taste_vector 코사인 유사도 최고
// 1명 + 그 유저 아카이브, Gap Node 포함)을 우선 시도. 백엔드가 꺼져있거나
// 아직 비교할 다른 유저/아카이브가 없으면 mock 150개로 자동 폴백.
const GENRES = ["Shoegaze", "City Pop", "Ambient", "Post-Rock", "Bedroom Pop", "Jazz Fusion"];
const TWIN_NODE_COUNT = 150;
const GAP_NODE_COUNT = 10;

// backend PCA 좌표는 표본이 적어 ±1 안팎으로 좁게 뭉쳐 나온다 — Galaxy와
// 같은 배율(POSITION_SCALE)로 펼쳐서 같은 우주 스케일감을 유지한다.
const POSITION_SCALE = 60;

function randomUnitVector(): [number, number, number] {
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

function generateMockData(): TasteTwinData {
  const nodes: TrackNode[] = [];
  for (let i = 0; i < TWIN_NODE_COUNT; i++) {
    const isGapNode = i < GAP_NODE_COUNT;
    const [ux, uy, uz] = randomUnitVector();
    const r = 20 + Math.random() * 70;
    nodes.push({
      trackId: `twin-track-${i}`,
      title: `Twin Track ${i}`,
      artist: `Twin Artist ${i % 20}`,
      position3D: [ux * r, uy * r, uz * r],
      similarity: isGapNode ? 0.9 + Math.random() * 0.1 : Math.random(),
      lastPlayedAt: new Date(
        Date.now() - Math.random() * 90 * 24 * 3600 * 1000
      ).toISOString(),
      audioUrl: "/audio/sample.mp3",
      genre: GENRES[i % GENRES.length],
      isGapNode,
    });
  }
  return {
    twinUserId: "twin-user-001",
    matchPercentage: 74,
    twinNodes: nodes,
    gapNodeIds: nodes.filter((n) => n.isGapNode).map((n) => n.trackId),
  };
}

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const overrideToken = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;

  try {
    const twin = await fetchTwin(overrideToken);
    if (!twin || twin.twinNodes.length === 0) {
      throw new Error("비교할 취향 쌍둥이/아카이브 없음");
    }

    const nodes: TrackNode[] = twin.twinNodes.map((n) => ({
      trackId: n.id,
      title: n.title,
      artist: n.artist,
      position3D: [
        n.coord.x * POSITION_SCALE,
        n.coord.y * POSITION_SCALE,
        n.coord.z * POSITION_SCALE,
      ],
      similarity: 0,
      lastPlayedAt: new Date().toISOString(),
      audioUrl: n.previewUrl ?? "/audio/sample.mp3",
      genre: n.genreTags[0] ?? "Unknown",
      coverUrl: n.coverUrl,
      isGapNode: n.isGapNode,
    }));

    const data: TasteTwinData = {
      twinUserId: twin.twinUserId,
      matchPercentage: twin.matchPercentage,
      twinNodes: nodes,
      gapNodeIds: nodes.filter((n) => n.isGapNode).map((n) => n.trackId),
    };

    return NextResponse.json({ ...data, source: "backend" });
  } catch (err) {
    console.warn("[api/twin] backend 연동 실패, mock 데이터로 폴백:", err);
    return NextResponse.json({ ...generateMockData(), source: "mock" });
  }
}
