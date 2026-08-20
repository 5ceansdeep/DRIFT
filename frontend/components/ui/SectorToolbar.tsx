"use client";

import * as THREE from "three";
import { useGalaxyStore } from "@/store/useGalaxyStore";
import { calculateRedshiftColorAndPosition } from "@/engine/RedshiftEngine";

// Phase 2 최소 툴바. 정식 SectorCreatorToolbar는 추후 디자인 확정 후 교체.
export default function SectorToolbar() {
  const isSectorDrawMode = useGalaxyStore((state) => state.isSectorDrawMode);
  const toggleSectorDrawMode = useGalaxyStore((state) => state.toggleSectorDrawMode);
  const clearDraft = useGalaxyStore((state) => state.clearDraft);
  const draftTrackIds = useGalaxyStore((state) => state.draftTrackIds);
  const addSector = useGalaxyStore((state) => state.addSector);
  const nodes = useGalaxyStore((state) => state.nodes);
  const sectorCount = useGalaxyStore((state) => state.savedSectors.length);

  const handleSave = () => {
    const picked = nodes.filter((n) => draftTrackIds.includes(n.trackId));
    if (picked.length === 0) return;

    const positions = picked.map((node) => {
      const basePos = new THREE.Vector3(...node.position3D);
      return calculateRedshiftColorAndPosition(basePos, node.lastPlayedAt).position;
    });
    const box = new THREE.Box3().setFromPoints(positions);

    const name = window.prompt(`구역 이름을 입력하세요 (${picked.length}곡)`, "My Sector");
    if (!name) return;

    addSector({
      sectorId: crypto.randomUUID(),
      name,
      bounds: {
        min: [box.min.x, box.min.y, box.min.z],
        max: [box.max.x, box.max.y, box.max.z],
      },
      trackIds: picked.map((n) => n.trackId),
      createdAt: new Date().toISOString(),
    });
    toggleSectorDrawMode();
  };

  return (
    <div className="pointer-events-auto absolute right-4 top-4 z-20 flex flex-col items-end gap-2 font-mono text-[11px]">
      <button
        onClick={toggleSectorDrawMode}
        className={`border border-black px-3 py-1.5 tracking-wider transition-colors ${
          isSectorDrawMode
            ? "bg-black text-[#E0F2E9]"
            : "bg-[#E0F2E9]/80 text-black hover:bg-black hover:text-[#E0F2E9]"
        }`}
      >
        {isSectorDrawMode ? "구역 지정 중지" : "▢ 구역 지정 모드"}
      </button>

      {isSectorDrawMode && (
        <div className="flex flex-col items-end gap-1 border border-black bg-[#E0F2E9]/90 px-3 py-2">
          <div className="text-black">담은 곡 · {draftTrackIds.length}</div>
          <div className="flex gap-1.5">
            <button
              onClick={clearDraft}
              disabled={draftTrackIds.length === 0}
              className="border border-black px-2 py-1 text-black disabled:opacity-30"
            >
              비우기
            </button>
            <button
              onClick={handleSave}
              disabled={draftTrackIds.length === 0}
              className="border border-black bg-black px-2 py-1 text-[#E0F2E9] disabled:opacity-30"
            >
              저장
            </button>
          </div>
        </div>
      )}

      {!isSectorDrawMode && sectorCount > 0 && (
        <div className="text-black opacity-60">SAVED SECTORS · {sectorCount}</div>
      )}
    </div>
  );
}
