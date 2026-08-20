"use client";

import { useGalaxyStore } from "@/store/useGalaxyStore";
import SectorToolbar from "./SectorToolbar";

// Phase 1 검증용 최소 HUD. HeaderNav/TrackDetailHUD 정식 컴포넌트는 추후 교체.
export default function GalaxyHud() {
  const nodeCount = useGalaxyStore((state) => state.nodes.length);
  const hoveredTrackId = useGalaxyStore((state) => state.hoveredTrackId);
  const selectedTrackId = useGalaxyStore((state) => state.selectedTrackId);
  const nodes = useGalaxyStore((state) => state.nodes);
  const isSectorDrawMode = useGalaxyStore((state) => state.isSectorDrawMode);

  const hovered = nodes.find((n) => n.trackId === hoveredTrackId);
  const selected = nodes.find((n) => n.trackId === selectedTrackId);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 p-4 font-mono text-[11px] text-black">
      <div className="absolute left-4 top-4">
        <div className="tracking-widest opacity-60">DRIFT · GALAXY VIEW</div>
        <div className="mt-1 opacity-60">
          NODES {nodeCount > 0 ? nodeCount : "LOADING..."}
        </div>
        {isSectorDrawMode && (
          <div className="mt-1 text-black">곡을 클릭해서 구역에 담으세요 (다시 클릭하면 뺌)</div>
        )}
      </div>
      <div className="absolute bottom-4 right-4 text-right">
        {hovered && (
          <div className="opacity-80">
            HOVER · {hovered.title} — {hovered.artist}
          </div>
        )}
        {selected && (
          <div className="mt-1 font-bold">
            SELECTED · {selected.title} — {selected.artist}
          </div>
        )}
      </div>

      <SectorToolbar />
    </div>
  );
}
