export type ViewMode = "GALAXY" | "SECTOR" | "TWIN";

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
