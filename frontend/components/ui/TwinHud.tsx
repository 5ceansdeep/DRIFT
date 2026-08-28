"use client";

import Link from "next/link";
import { useTwinStore } from "@/store/useTwinStore";
import TrackDetailPanel from "./TrackDetailPanel";

// Phase 3 최소 HUD. 정식 디자인은 추후 확정.
export default function TwinHud() {
  const twinData = useTwinStore((state) => state.twinData);
  const hoveredTrackId = useTwinStore((state) => state.hoveredTrackId);
  const selectedTrackId = useTwinStore((state) => state.selectedTrackId);
  const setSelectedTrackId = useTwinStore((state) => state.setSelectedTrackId);

  // 선택된 곡은 TrackDetailPanel(화면 중앙)이 담당 — 여기선 hover만 가볍게 표시.
  const hoveredNode = selectedTrackId
    ? undefined
    : twinData?.twinNodes.find((n) => n.trackId === hoveredTrackId);
  const selectedNode = twinData?.twinNodes.find((n) => n.trackId === selectedTrackId) ?? null;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 font-mono text-black">
      <div className="pointer-events-auto absolute left-4 top-4 flex flex-col gap-1 text-[11px]">
        <Link href="/galaxy" className="w-fit opacity-60 hover:opacity-100">
          ← GALAXY
        </Link>
        <Link href="/explore" className="w-fit opacity-40 hover:opacity-100">
          EXPLORE →
        </Link>
        {twinData && <div className="mt-1 font-bold opacity-70">{twinData.matchPercentage}%</div>}
      </div>

      {hoveredNode && (
        <div className="drift-panel-in absolute bottom-4 left-4 max-w-xs border border-black bg-paper/90 px-3 py-2 text-[11px]">
          <div className="font-bold">{hoveredNode.title}</div>
          <div className="opacity-70">{hoveredNode.artist}</div>
          {hoveredNode.isGapNode && <div className="mt-1 font-bold text-[#FF0055]">▲</div>}
        </div>
      )}

      <TrackDetailPanel
        node={selectedNode}
        onClose={() => setSelectedTrackId(null)}
        badge={
          selectedNode?.isGapNode ? (
            <span className="text-[11px] font-bold text-[#FF0055]">▲ TARGET DISCOVERY</span>
          ) : undefined
        }
      />
    </div>
  );
}
