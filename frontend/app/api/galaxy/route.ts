import { NextResponse } from "next/server";
import { TrackNode } from "@/types";

// Phase 1: 파이프라인 검증용 mock 데이터.
// 실 데이터 연동(backend GET /universe/stars)은 로그인/PCA refit 플로우가
// 갖춰진 뒤 별도 작업으로 진행 — docs/tech-spec.md 2.3 참고.
const GENRES = ["Synthwave", "Ambient", "Indie", "Lo-fi", "Electronic", "Classical"];

export async function GET() {
  const nodeCount = 800;
  const mockNodes: TrackNode[] = Array.from({ length: nodeCount }).map((_, index) => ({
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

  return NextResponse.json({
    userId: "usr_incheon_01",
    totalCount: mockNodes.length,
    nodes: mockNodes,
    antipodeCentroid: [-75.4, 62.1, -80.9],
  });
}
