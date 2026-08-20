import { create } from "zustand";
import { TrackNode, SavedSector } from "@/types";

interface GalaxyState {
  nodes: TrackNode[];
  hoveredTrackId: string | null;
  selectedTrackId: string | null;
  savedSectors: SavedSector[];
  isWarping: boolean;
  // Sector 큐레이션 모드: 곡을 하나씩 클릭해서 담았다 뺐다 하며 구역을 구성한다.
  isSectorDrawMode: boolean;
  draftTrackIds: string[];
  // 섹터 지정된 트랙을 각자의 섹터 박스 위치로 모으는 연출 (ClusterAnimationEngine).
  isClusterMode: boolean;

  setNodes: (nodes: TrackNode[]) => void;
  setHoveredTrackId: (id: string | null) => void;
  setSelectedTrackId: (id: string | null) => void;
  setSectors: (sectors: SavedSector[]) => void;
  addSector: (sector: SavedSector) => void;
  triggerWarp: (isWarping: boolean) => void;
  toggleSectorDrawMode: () => void;
  toggleDraftTrack: (trackId: string) => void;
  clearDraft: () => void;
  toggleClusterMode: () => void;
}

export const useGalaxyStore = create<GalaxyState>((set) => ({
  nodes: [],
  hoveredTrackId: null,
  selectedTrackId: null,
  savedSectors: [],
  isWarping: false,
  isSectorDrawMode: false,
  draftTrackIds: [],
  isClusterMode: false,

  setNodes: (nodes) => set({ nodes }),
  setHoveredTrackId: (id) => set({ hoveredTrackId: id }),
  setSelectedTrackId: (id) => set({ selectedTrackId: id }),
  setSectors: (sectors) => set({ savedSectors: sectors }),
  addSector: (sector) =>
    set((state) => ({ savedSectors: [...state.savedSectors, sector] })),
  triggerWarp: (isWarping) => set({ isWarping }),
  toggleSectorDrawMode: () =>
    set((state) => ({ isSectorDrawMode: !state.isSectorDrawMode, draftTrackIds: [] })),
  toggleDraftTrack: (trackId) =>
    set((state) => ({
      draftTrackIds: state.draftTrackIds.includes(trackId)
        ? state.draftTrackIds.filter((id) => id !== trackId)
        : [...state.draftTrackIds, trackId],
    })),
  clearDraft: () => set({ draftTrackIds: [] }),
  toggleClusterMode: () => set((state) => ({ isClusterMode: !state.isClusterMode })),
}));
