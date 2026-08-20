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
  const isClusterMode = useGalaxyStore((state) => state.isClusterMode);
  const toggleClusterMode = useGalaxyStore((state) => state.toggleClusterMode);

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

    const sector = {
      sectorId: crypto.randomUUID(),
      name,
      bounds: {
        min: [box.min.x, box.min.y, box.min.z] as [number, number, number],
        max: [box.max.x, box.max.y, box.max.z] as [number, number, number],
      },
      trackIds: picked.map((n) => n.trackId),
      createdAt: new Date().toISOString(),
    };

    addSector(sector); // 즉시 반영 (optimistic)
    fetch("/api/sectors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sector),
    }).catch((err) => console.error("[SectorToolbar] failed to persist sector:", err));

    toggleSectorDrawMode();
  };

  return (
    <div className="pointer-events-auto absolute right-4 top-4 z-20 flex flex-col items-end gap-2 font-mono text-[11px]">
      <button
        onClick={toggleSectorDrawMode}
        className={`border border-black px-3 py-1.5 tracking-wider transition-colors ${
          isSectorDrawMode
            ? "bg-black text-[#c8f0d8]"
            : "bg-[#c8f0d8]/80 text-black hover:bg-black hover:text-[#c8f0d8]"
        }`}
      >
        {isSectorDrawMode ? "✕" : "▢"}
      </button>

      {isSectorDrawMode && (
        <div className="drift-panel-in flex flex-col items-end gap-1 border border-black bg-[#c8f0d8]/90 px-3 py-2">
          <div className="text-black opacity-60">{draftTrackIds.length}</div>
          <div className="flex gap-1.5">
            <button
              onClick={clearDraft}
              disabled={draftTrackIds.length === 0}
              className="border border-black px-2 py-1 text-black disabled:opacity-30"
            >
              ↺
            </button>
            <button
              onClick={handleSave}
              disabled={draftTrackIds.length === 0}
              className="border border-black bg-black px-2 py-1 text-[#c8f0d8] disabled:opacity-30"
            >
              ✓
            </button>
          </div>
        </div>
      )}

      {!isSectorDrawMode && sectorCount > 0 && (
        <button
          onClick={toggleClusterMode}
          className={`border border-black px-3 py-1.5 tracking-wider transition-colors ${
            isClusterMode
              ? "bg-black text-[#c8f0d8]"
              : "bg-[#c8f0d8]/80 text-black hover:bg-black hover:text-[#c8f0d8]"
          }`}
        >
          {isClusterMode ? "●" : "○"}
        </button>
      )}
    </div>
  );
}
