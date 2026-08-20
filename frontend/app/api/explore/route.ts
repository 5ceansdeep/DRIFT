import { NextResponse } from "next/server";
import type { TrackNode } from "@/types";

// Mock: 코사인 유사도(-1~1) 기반 탐험 우주. 실제로는 백엔드의 80차원 공간
// 코사인 유사도를 3D로 PCA 투영한 좌표로 대체될 예정.
// 유사도가 높을수록(1에 가까울수록) 원점에 가깝게, 낮을수록(-1에 가까울수록)
// 바깥쪽 대척점(안티포드) 쉘로 밀려나는 방사형 레이아웃 — RedshiftEngine과
// 같은 발상을 "청취 최근성" 대신 "취향 유사도" 축에 적용한 것.
const GENRES = ["Noise Rock", "Free Jazz", "Drone", "IDM", "Field Recording", "Krautrock"];
const NODE_COUNT = 600;
const MAX_RADIUS = 130;

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

function generateExploreNodes(): TrackNode[] {
  const nodes: TrackNode[] = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    const similarity = Math.random() * 2 - 1; // -1 ~ 1
    const radius = (1 - similarity) * 0.5 * MAX_RADIUS;
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

export async function GET() {
  return NextResponse.json({ nodes: generateExploreNodes() });
}
