import { create } from "zustand";
import { TrackNode, ViewMode, SavedSector } from "@/types";

interface GalaxyState {
  viewMode: ViewMode;
  nodes: TrackNode[];
  hoveredTrackId: string | null;
  selectedTrackId: string | null;
  savedSectors: SavedSector[];
  isWarping: boolean;
  // Sector 큐레이션 모드: 곡을 하나씩 클릭해서 담았다 뺐다 하며 구역을 구성한다.
  isSectorDrawMode: boolean;
  draftTrackIds: string[];

  setViewMode: (mode: ViewMode) => void;
  setNodes: (nodes: TrackNode[]) => void;
  setHoveredTrackId: (id: string | null) => void;
  setSelectedTrackId: (id: string | null) => void;
  addSector: (sector: SavedSector) => void;
  triggerWarp: (isWarping: boolean) => void;
  toggleSectorDrawMode: () => void;
  toggleDraftTrack: (trackId: string) => void;
  clearDraft: () => void;
}

export const useGalaxyStore = create<GalaxyState>((set) => ({
  viewMode: "GALAXY",
  nodes: [],
  hoveredTrackId: null,
  selectedTrackId: null,
  savedSectors: [],
  isWarping: false,
  isSectorDrawMode: false,
  draftTrackIds: [],

  setViewMode: (mode) => set({ viewMode: mode }),
  setNodes: (nodes) => set({ nodes }),
  setHoveredTrackId: (id) => set({ hoveredTrackId: id }),
  setSelectedTrackId: (id) => set({ selectedTrackId: id }),
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
}));
