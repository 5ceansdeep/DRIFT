import { create } from "zustand";
import { TrackNode, ViewMode, SavedSector } from "@/types";

export interface ScreenRect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface GalaxyState {
  viewMode: ViewMode;
  nodes: TrackNode[];
  hoveredTrackId: string | null;
  selectedTrackId: string | null;
  savedSectors: SavedSector[];
  isWarping: boolean;
  // Phase 2: Sector 볼륨 지정 모드
  isSectorDrawMode: boolean;
  dragRectScreen: ScreenRect | null;

  setViewMode: (mode: ViewMode) => void;
  setNodes: (nodes: TrackNode[]) => void;
  setHoveredTrackId: (id: string | null) => void;
  setSelectedTrackId: (id: string | null) => void;
  addSector: (sector: SavedSector) => void;
  triggerWarp: (isWarping: boolean) => void;
  toggleSectorDrawMode: () => void;
  setDragRectScreen: (rect: ScreenRect | null) => void;
}

export const useGalaxyStore = create<GalaxyState>((set) => ({
  viewMode: "GALAXY",
  nodes: [],
  hoveredTrackId: null,
  selectedTrackId: null,
  savedSectors: [],
  isWarping: false,
  isSectorDrawMode: false,
  dragRectScreen: null,

  setViewMode: (mode) => set({ viewMode: mode }),
  setNodes: (nodes) => set({ nodes }),
  setHoveredTrackId: (id) => set({ hoveredTrackId: id }),
  setSelectedTrackId: (id) => set({ selectedTrackId: id }),
  addSector: (sector) =>
    set((state) => ({ savedSectors: [...state.savedSectors, sector] })),
  triggerWarp: (isWarping) => set({ isWarping }),
  toggleSectorDrawMode: () =>
    set((state) => ({ isSectorDrawMode: !state.isSectorDrawMode, dragRectScreen: null })),
  setDragRectScreen: (rect) => set({ dragRectScreen: rect }),
}));
