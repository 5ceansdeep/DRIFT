"use client";

import Link from "next/link";
import { useTwinStore } from "@/store/useTwinStore";

// Phase 3 최소 HUD. 정식 디자인은 추후 확정.
export default function TwinHud() {
  const twinData = useTwinStore((state) => state.twinData);
  const hoveredTrackId = useTwinStore((state) => state.hoveredTrackId);
  const selectedTrackId = useTwinStore((state) => state.selectedTrackId);

  const activeId = hoveredTrackId ?? selectedTrackId;
  const activeNode = twinData?.twinNodes.find((n) => n.trackId === activeId);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 font-mono text-black">
      <div className="absolute left-4 top-4 flex flex-col gap-1 text-[11px]">
        <Link href="/galaxy" className="pointer-events-auto w-fit opacity-60 hover:opacity-100">
          ← GALAXY
        </Link>
        <div className="mt-1 font-bold">TASTE TWIN</div>
        {twinData && (
          <>
            <div>MATCH · {twinData.matchPercentage}%</div>
            <div>NODES · {twinData.twinNodes.length}</div>
            <div>GAP NODES · {twinData.gapNodeIds.length}</div>
          </>
        )}
      </div>

      {activeNode && (
        <div className="absolute bottom-4 left-4 max-w-xs border border-black bg-[#E0F2E9]/90 px-3 py-2 text-[11px]">
          <div className="font-bold">{activeNode.title}</div>
          <div className="opacity-70">{activeNode.artist}</div>
          <div className="opacity-50">{activeNode.genre}</div>
          {activeNode.isGapNode && (
            <div className="mt-1 font-bold text-[#FF0055]">▲ TARGET DISCOVERY</div>
          )}
        </div>
      )}
    </div>
  );
}
