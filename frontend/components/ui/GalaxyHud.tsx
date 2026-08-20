"use client";

import { useGalaxyStore } from "@/store/useGalaxyStore";
import SectorToolbar from "./SectorToolbar";
import TrackDetailPanel from "./TrackDetailPanel";
import { iTunesCoverUrl } from "@/lib/itunesImage";

// Phase 1 검증용 최소 HUD. HeaderNav 정식 컴포넌트는 추후 교체.
export default function GalaxyHud() {
  const nodeCount = useGalaxyStore((state) => state.nodes.length);
  const hoveredTrackId = useGalaxyStore((state) => state.hoveredTrackId);
  const selectedTrackId = useGalaxyStore((state) => state.selectedTrackId);
  const nodes = useGalaxyStore((state) => state.nodes);

  // 선택된 곡은 TrackDetailPanel(화면 중앙)이 담당 — 여기선 hover만 가볍게 표시.
  const hovered = selectedTrackId ? undefined : nodes.find((n) => n.trackId === hoveredTrackId);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 p-4 font-mono text-[11px] text-black">
      <div className="absolute left-4 top-4 opacity-40">{nodeCount > 0 ? nodeCount : "···"}</div>
      {hovered && (
        <div className="absolute bottom-4 right-4 flex items-end gap-2 text-right">
          <div className="opacity-70">
            {hovered.title} — {hovered.artist}
          </div>
          {hovered.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- 외부(iTunes) 원격 이미지, 썸네일 크기로 요청해 로딩 가볍게
            <img
              src={iTunesCoverUrl(hovered.coverUrl, 80)!}
              alt=""
              decoding="async"
              className="h-10 w-10 border border-black object-cover"
            />
          )}
        </div>
      )}

      <SectorToolbar />
      <TrackDetailPanel />
    </div>
  );
}
