import { create } from "zustand";
import { TrackNode, ViewMode, SavedSector } from "@/types";

interface GalaxyState {
  viewMode: ViewMode;
  nodes: TrackNode[];
  hoveredTrackId: string | null;
  selectedTrackId: string | null;
  savedSectors: SavedSector[];
  isWarping: boolean;

  setViewMode: (mode: ViewMode) => void;
  setNodes: (nodes: TrackNode[]) => void;
  setHoveredTrackId: (id: string | null) => void;
  setSelectedTrackId: (id: string | null) => void;
  addSector: (sector: SavedSector) => void;
  triggerWarp: (isWarping: boolean) => void;
}

export const useGalaxyStore = create<GalaxyState>((set) => ({
  viewMode: "GALAXY",
  nodes: [],
  hoveredTrackId: null,
  selectedTrackId: null,
  savedSectors: [],
  isWarping: false,

  setViewMode: (mode) => set({ viewMode: mode }),
  setNodes: (nodes) => set({ nodes }),
  setHoveredTrackId: (id) => set({ hoveredTrackId: id }),
  setSelectedTrackId: (id) => set({ selectedTrackId: id }),
  addSector: (sector) =>
    set((state) => ({ savedSectors: [...state.savedSectors, sector] })),
  triggerWarp: (isWarping) => set({ isWarping }),
}));
