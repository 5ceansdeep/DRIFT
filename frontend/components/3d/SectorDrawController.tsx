"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { useGalaxyStore } from "@/store/useGalaxyStore";
import { calculateRedshiftColorAndPosition } from "@/engine/RedshiftEngine";
import { getTracksIn3DVolume } from "@/engine/VolumeIntersection";

// 화면에는 아무것도 그리지 않는다 — Canvas DOM 엘리먼트에 직접 포인터 이벤트를
// 붙여서 "구역 지정 모드"일 때 2D 드래그 사각형을 3D 볼륨으로 변환한다.
// 사각형 자체는 GalaxyHud(2D 레이어)가 store.dragRectScreen을 읽어 그린다.
export default function SectorDrawController() {
  const { camera, gl, size } = useThree();
  const isSectorDrawMode = useGalaxyStore((state) => state.isSectorDrawMode);
  const setDragRectScreen = useGalaxyStore((state) => state.setDragRectScreen);
  const addSector = useGalaxyStore((state) => state.addSector);
  const toggleSectorDrawMode = useGalaxyStore((state) => state.toggleSectorDrawMode);

  const dragging = useRef(false);
  const start = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!isSectorDrawMode) return;
    const el = gl.domElement;

    const toLocal = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onDown = (e: PointerEvent) => {
      dragging.current = true;
      start.current = toLocal(e);
      setDragRectScreen({ x1: start.current.x, y1: start.current.y, x2: start.current.x, y2: start.current.y });
    };

    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const cur = toLocal(e);
      setDragRectScreen({ x1: start.current.x, y1: start.current.y, x2: cur.x, y2: cur.y });
    };

    const onUp = (e: PointerEvent) => {
      if (!dragging.current) return;
      dragging.current = false;
      const cur = toLocal(e);

      const rx1 = Math.min(start.current.x, cur.x);
      const rx2 = Math.max(start.current.x, cur.x);
      const ry1 = Math.min(start.current.y, cur.y);
      const ry2 = Math.max(start.current.y, cur.y);
      setDragRectScreen(null);

      // 너무 작은 드래그(=클릭 실수)는 무시
      if (rx2 - rx1 < 8 || ry2 - ry1 < 8) return;

      // 렌더링된(Redshift 보정된) 좌표 기준으로 화면 투영해 사각형 안에 드는 노드를 찾는다.
      const now = new Date();
      const rendered = useGalaxyStore.getState().nodes.map((node) => {
        const basePos = new THREE.Vector3(...node.position3D);
        const { position } = calculateRedshiftColorAndPosition(basePos, node.lastPlayedAt, now);
        return { node, position };
      });

      const picked = rendered.filter(({ position }) => {
        const ndc = position.clone().project(camera);
        if (ndc.z < -1 || ndc.z > 1) return false;
        const sx = ((ndc.x + 1) / 2) * size.width;
        const sy = ((1 - ndc.y) / 2) * size.height;
        return sx >= rx1 && sx <= rx2 && sy >= ry1 && sy <= ry2;
      });

      if (picked.length === 0) {
        window.alert("선택된 영역에 노드가 없어요. 다시 드래그해보세요.");
        return;
      }

      const box = new THREE.Box3().setFromPoints(picked.map((p) => p.position));
      // getTracksIn3DVolume 재사용을 위해 렌더링 좌표를 position3D 자리에 넣은 가상 노드로 필터링
      const virtualNodes = rendered.map(({ node, position }) => ({
        ...node,
        position3D: [position.x, position.y, position.z] as [number, number, number],
      }));
      const tracksInVolume = getTracksIn3DVolume(
        virtualNodes,
        [box.min.x, box.min.y, box.min.z],
        [box.max.x, box.max.y, box.max.z]
      );

      const name = window.prompt(
        `구역 이름을 입력하세요 (${tracksInVolume.length}곡 포함)`,
        `Sector ${new Date().toLocaleTimeString()}`
      );
      if (!name) return;

      addSector({
        sectorId: crypto.randomUUID(),
        name,
        bounds: {
          min: [box.min.x, box.min.y, box.min.z],
          max: [box.max.x, box.max.y, box.max.z],
        },
        trackIds: tracksInVolume.map((t) => t.trackId),
        createdAt: new Date().toISOString(),
      });
      toggleSectorDrawMode();
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
    };
  }, [isSectorDrawMode, camera, gl, size, setDragRectScreen, addSector, toggleSectorDrawMode]);

  return null;
}
