import { NextResponse } from "next/server";
import type { TasteTwinData, TrackNode } from "@/types";

// Mock: 실 데이터 연동 전까지 사용하는 취향 쌍둥이 응답.
// 실제로는 GET /twin/gap-nodes (backend, 코사인 유사도 기반 매칭)로 대체될 예정.
const GENRES = ["Shoegaze", "City Pop", "Ambient", "Post-Rock", "Bedroom Pop", "Jazz Fusion"];
const TWIN_NODE_COUNT = 150;
const GAP_NODE_COUNT = 10;

function generateTwinNodes(): TrackNode[] {
  const nodes: TrackNode[] = [];
  for (let i = 0; i < TWIN_NODE_COUNT; i++) {
    const isGapNode = i < GAP_NODE_COUNT;
    nodes.push({
      trackId: `twin-track-${i}`,
      title: `Twin Track ${i}`,
      artist: `Twin Artist ${i % 20}`,
      position3D: [
        (Math.random() - 0.5) * 140,
        (Math.random() - 0.5) * 140,
        (Math.random() - 0.5) * 140,
      ],
      similarity: isGapNode ? 0.9 + Math.random() * 0.1 : Math.random(),
      lastPlayedAt: new Date(
        Date.now() - Math.random() * 90 * 24 * 3600 * 1000
      ).toISOString(),
      audioUrl: "/audio/sample.mp3",
      genre: GENRES[i % GENRES.length],
      isGapNode,
    });
  }
  return nodes;
}

export async function GET() {
  const twinNodes = generateTwinNodes();
  const data: TasteTwinData = {
    twinUserId: "twin-user-001",
    matchPercentage: 74,
    twinNodes,
    gapNodeIds: twinNodes.filter((n) => n.isGapNode).map((n) => n.trackId),
  };
  return NextResponse.json(data);
}
