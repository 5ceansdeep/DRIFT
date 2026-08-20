import { create } from "zustand";
import { TrackNode } from "@/types";

// /explore 전용 스토어. Galaxy/Twin 스토어와 분리된 독립 우주.
interface ExploreState {
  nodes: TrackNode[];
  hoveredTrackId: string | null;
  selectedTrackId: string | null;
  // 블랙홀 워프: 대척점(안티포드) 존의 노드로 카메라를 급이동시키는 연출.
  isWarping: boolean;
  warpTargetId: string | null;

  setNodes: (nodes: TrackNode[]) => void;
  setHoveredTrackId: (id: string | null) => void;
  setSelectedTrackId: (id: string | null) => void;
  startWarp: (nodeId: string) => void;
  endWarp: () => void;
}

export const useExploreStore = create<ExploreState>((set) => ({
  nodes: [],
  hoveredTrackId: null,
  selectedTrackId: null,
  isWarping: false,
  warpTargetId: null,

  setNodes: (nodes) => set({ nodes }),
  setHoveredTrackId: (id) => set({ hoveredTrackId: id }),
  setSelectedTrackId: (id) => set({ selectedTrackId: id }),
  startWarp: (nodeId) => set({ isWarping: true, warpTargetId: nodeId }),
  endWarp: () => set({ isWarping: false, warpTargetId: null }),
}));
