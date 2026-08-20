"use client";

import Link from "next/link";
import { useExploreStore } from "@/store/useExploreStore";

// Phase 3 최소 HUD. 정식 디자인은 추후 확정.
export default function ExploreHud() {
  const nodes = useExploreStore((state) => state.nodes);
  const hoveredTrackId = useExploreStore((state) => state.hoveredTrackId);
  const selectedTrackId = useExploreStore((state) => state.selectedTrackId);
  const isWarping = useExploreStore((state) => state.isWarping);
  const startWarp = useExploreStore((state) => state.startWarp);

  const activeId = hoveredTrackId ?? selectedTrackId;
  const activeNode = nodes.find((n) => n.trackId === activeId);

  const handleWarp = () => {
    const antipodeNodes = nodes.filter((n) => n.similarity < -0.7);
    if (antipodeNodes.length === 0) return;
    const target = antipodeNodes[Math.floor(Math.random() * antipodeNodes.length)];
    startWarp(target.trackId);
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-10 font-mono text-black">
      <div className="absolute left-4 top-4 flex flex-col gap-1 text-[11px]">
        <Link href="/galaxy" className="pointer-events-auto w-fit opacity-60 hover:opacity-100">
          ← GALAXY
        </Link>
        <div className="mt-1 font-bold">EXPLORE</div>
        <div>NODES · {nodes.length}</div>
      </div>

      <div className="pointer-events-auto absolute right-4 top-4 flex flex-col items-end gap-2 text-[11px]">
        <button
          onClick={handleWarp}
          disabled={isWarping}
          className={`border border-black px-3 py-1.5 tracking-wider transition-colors ${
            isWarping
              ? "bg-black text-[#8800FF] opacity-70"
              : "bg-[#E0F2E9]/80 text-black hover:bg-black hover:text-[#8800FF]"
          }`}
        >
          {isWarping ? "◉ WARPING..." : "⬤ 블랙홀 워프"}
        </button>
        <div className="text-black opacity-50">혜성 클릭 · 경계 발굴</div>
      </div>

      {activeNode && (
        <div className="absolute bottom-4 left-4 max-w-xs border border-black bg-[#E0F2E9]/90 px-3 py-2 text-[11px]">
          <div className="font-bold">{activeNode.title}</div>
          <div className="opacity-70">{activeNode.artist}</div>
          <div className="opacity-50">
            {activeNode.genre} · SIM {activeNode.similarity.toFixed(2)}
          </div>
        </div>
      )}
    </div>
  );
}
