"use client";

import Link from "next/link";
import { useExploreStore } from "@/store/useExploreStore";
import { iTunesCoverUrl } from "@/lib/itunesImage";
import TrackDetailPanel from "./TrackDetailPanel";

// Phase 3 최소 HUD. 정식 디자인은 추후 확정.
export default function ExploreHud() {
  const nodes = useExploreStore((state) => state.nodes);
  const hoveredTrackId = useExploreStore((state) => state.hoveredTrackId);
  const selectedTrackId = useExploreStore((state) => state.selectedTrackId);
  const setSelectedTrackId = useExploreStore((state) => state.setSelectedTrackId);
  const isWarping = useExploreStore((state) => state.isWarping);
  const startWarp = useExploreStore((state) => state.startWarp);

  // 선택된 곡은 TrackDetailPanel(화면 중앙)이 담당 — 여기선 hover만 가볍게 표시.
  const hoveredNode = selectedTrackId
    ? undefined
    : nodes.find((n) => n.trackId === hoveredTrackId);
  const selectedNode = nodes.find((n) => n.trackId === selectedTrackId) ?? null;

  const handleWarp = () => {
    if (nodes.length === 0) return;
    // 절대 임계값(-0.7) 대신 "가장 유사도가 낮은 쪽 10%"에서 뽑는다 — mock 데이터는
    // -1~1 범위라 절대 임계값도 맞지만, 실 데이터(코사인 유사도, 태그가 전부
    // 0 이상 가중치라 사실상 0~1 범위)엔 음수가 거의 없어 대척점이 안 잡힌다.
    const sorted = [...nodes].sort((a, b) => a.similarity - b.similarity);
    const pool = sorted.slice(0, Math.max(1, Math.ceil(sorted.length * 0.1)));
    const target = pool[Math.floor(Math.random() * pool.length)];
    startWarp(target.trackId);
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-10 font-mono text-black">
      <div className="pointer-events-auto absolute left-4 top-4 flex flex-col gap-1 text-[11px]">
        <Link href="/galaxy" className="w-fit opacity-60 hover:opacity-100">
          ← GALAXY
        </Link>
        <Link href="/twin" className="w-fit opacity-40 hover:opacity-100">
          TWIN →
        </Link>
        <div className="opacity-40">{nodes.length > 0 ? nodes.length : "···"}</div>
      </div>

      <div className="pointer-events-auto absolute right-4 top-4">
        <button
          onClick={handleWarp}
          disabled={isWarping}
          className={`border border-black px-3 py-1.5 tracking-wider transition-colors ${
            isWarping
              ? "bg-black text-[#8800FF] opacity-70"
              : "bg-paper/80 text-black hover:bg-black hover:text-[#8800FF]"
          }`}
        >
          {isWarping ? "◉" : "⬤"}
        </button>
      </div>

      {hoveredNode && (
        <div className="drift-panel-in pointer-events-none absolute bottom-4 left-4 flex max-w-xs items-center gap-2 border border-black bg-paper/90 px-3 py-2 text-[11px]">
          {hoveredNode.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- 외부(iTunes) 원격 이미지, 썸네일 크기로 요청해 로딩 가볍게
            <img
              src={iTunesCoverUrl(hoveredNode.coverUrl, 80)!}
              alt=""
              decoding="async"
              className="h-10 w-10 border border-black object-cover"
            />
          )}
          <div>
            <div className="font-bold">{hoveredNode.title}</div>
            <div className="opacity-70">{hoveredNode.artist}</div>
            <div className="opacity-50">{Math.round(hoveredNode.similarity * 100)}%</div>
          </div>
        </div>
      )}

      <TrackDetailPanel
        node={selectedNode}
        onClose={() => setSelectedTrackId(null)}
        badge={
          selectedNode && (
            <span className="text-[11px] opacity-60">
              MATCH {Math.round(selectedNode.similarity * 100)}%
            </span>
          )
        }
      />
    </div>
  );
}
