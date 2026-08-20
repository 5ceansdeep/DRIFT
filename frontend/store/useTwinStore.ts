import { create } from "zustand";
import { TasteTwinData } from "@/types";

// /twin 전용 스토어. Galaxy 스토어와 분리 — 1:1 오버레이가 아니라
// Twin 유저 우주를 단독으로 렌더링하는 구조이므로 상태를 공유하지 않는다.
interface TwinState {
  twinData: TasteTwinData | null;
  hoveredTrackId: string | null;
  selectedTrackId: string | null;

  setTwinData: (data: TasteTwinData) => void;
  setHoveredTrackId: (id: string | null) => void;
  setSelectedTrackId: (id: string | null) => void;
}

export const useTwinStore = create<TwinState>((set) => ({
  twinData: null,
  hoveredTrackId: null,
  selectedTrackId: null,

  setTwinData: (data) => set({ twinData: data }),
  setHoveredTrackId: (id) => set({ hoveredTrackId: id }),
  setSelectedTrackId: (id) => set({ selectedTrackId: id }),
}));
