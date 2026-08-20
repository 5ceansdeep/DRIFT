"use client";

import { useState } from "react";
import * as THREE from "three";
import { useGalaxyStore } from "@/store/useGalaxyStore";
import { calculateRedshiftColorAndPosition } from "@/engine/RedshiftEngine";
import { authHeader } from "@/lib/authClient";
import type { SavedSector } from "@/types";

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
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const picked = nodes.filter((n) => draftTrackIds.includes(n.trackId));
    if (picked.length === 0) return;

    const positions = picked.map((node) => {
      const basePos = new THREE.Vector3(...node.position3D);
      return calculateRedshiftColorAndPosition(basePos, node.lastPlayedAt).position;
    });
    const box = new THREE.Box3().setFromPoints(positions);

    const name = window.prompt(`구역 이름을 입력하세요 (${picked.length}곡)`, "My Sector");
    if (!name) return;

    const payload = {
      name,
      boundsMin: [box.min.x, box.min.y, box.min.z],
      boundsMax: [box.max.x, box.max.y, box.max.z],
      trackIds: picked.map((n) => n.trackId),
    };

    setSaving(true);
    try {
      const res = await fetch("/api/sectors", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`저장 실패: ${res.status}`);
      const { sector } = (await res.json()) as { sector: SavedSector };
      addSector(sector); // 서버가 발급한 id로 반영 — DB에 영속되므로 새로고침해도 안 사라짐
      toggleSectorDrawMode();
    } catch (err) {
      console.error("[SectorToolbar] failed to persist sector:", err);
      window.alert("구역 저장에 실패했어요. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
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
              disabled={draftTrackIds.length === 0 || saving}
              className="border border-black bg-black px-2 py-1 text-[#c8f0d8] disabled:opacity-30"
            >
              {saving ? "···" : "✓"}
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
