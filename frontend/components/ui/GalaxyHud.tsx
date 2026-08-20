"use client";

import { useGalaxyStore } from "@/store/useGalaxyStore";
import SectorToolbar from "./SectorToolbar";

// Phase 1 검증용 최소 HUD. HeaderNav/TrackDetailHUD 정식 컴포넌트는 추후 교체.
export default function GalaxyHud() {
  const nodeCount = useGalaxyStore((state) => state.nodes.length);
  const hoveredTrackId = useGalaxyStore((state) => state.hoveredTrackId);
  const selectedTrackId = useGalaxyStore((state) => state.selectedTrackId);
  const nodes = useGalaxyStore((state) => state.nodes);

  const hovered = nodes.find((n) => n.trackId === hoveredTrackId);
  const selected = nodes.find((n) => n.trackId === selectedTrackId);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 p-4 font-mono text-[11px] text-black">
      <div className="absolute left-4 top-4 opacity-40">{nodeCount > 0 ? nodeCount : "···"}</div>
      <div className="absolute bottom-4 right-4 flex items-end gap-2 text-right">
        <div>
          {hovered && (
            <div className="opacity-70">
              {hovered.title} — {hovered.artist}
            </div>
          )}
          {selected && (
            <div className="mt-1 font-bold">
              {selected.title} — {selected.artist}
            </div>
          )}
        </div>
        {(selected ?? hovered)?.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- 외부(iTunes) 원격 이미지, next/image 도메인 설정 전까지 임시
          <img
            src={(selected ?? hovered)!.coverUrl!}
            alt=""
            className="h-10 w-10 border border-black object-cover"
          />
        )}
      </div>

      <SectorToolbar />
    </div>
  );
}
