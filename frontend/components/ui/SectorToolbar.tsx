"use client";

import { useGalaxyStore } from "@/store/useGalaxyStore";

// Phase 2 최소 툴바. 정식 SectorCreatorToolbar는 추후 디자인 확정 후 교체.
export default function SectorToolbar() {
  const isSectorDrawMode = useGalaxyStore((state) => state.isSectorDrawMode);
  const toggleSectorDrawMode = useGalaxyStore((state) => state.toggleSectorDrawMode);
  const sectorCount = useGalaxyStore((state) => state.savedSectors.length);

  return (
    <div className="pointer-events-auto absolute right-4 top-4 z-20 flex flex-col items-end gap-2 font-mono text-[11px]">
      <button
        onClick={toggleSectorDrawMode}
        className={`border border-black px-3 py-1.5 tracking-wider transition-colors ${
          isSectorDrawMode ? "bg-black text-[#E0F2E9]" : "bg-[#E0F2E9]/80 text-black hover:bg-black hover:text-[#E0F2E9]"
        }`}
      >
        {isSectorDrawMode ? "■ 구역 지정 중 (드래그)" : "▢ 구역 지정 모드"}
      </button>
      {sectorCount > 0 && (
        <div className="text-black opacity-60">SAVED SECTORS · {sectorCount}</div>
      )}
    </div>
  );
}
