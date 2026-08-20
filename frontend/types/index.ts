// NOTE: 단일 캔버스 내 모드 스위칭(ViewMode)은 폐기하고 /galaxy, /explore, /twin
// 독립 라우트로 분리했다 (docs/tech-spec.md 1.2, 아키텍처 개정 메모 참고).

export interface TrackNode {
  trackId: string;
  title: string;
  artist: string;
  position3D: [number, number, number];
  similarity: number;
  lastPlayedAt: string; // ISO String
  audioUrl: string;
  genre: string;
  isGapNode?: boolean;
  coverUrl?: string | null; // 실 데이터 연동(backend Song.coverUrl) 시 채워짐, mock 데이터엔 없음
}

export interface SavedSector {
  sectorId: string;
  name: string;
  bounds: {
    min: [number, number, number];
    max: [number, number, number];
  };
  trackIds: string[];
  createdAt: string;
}

export interface TasteTwinData {
  twinUserId: string;
  matchPercentage: number;
  twinNodes: TrackNode[];
  gapNodeIds: string[];
}
