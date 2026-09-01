"use client";

import { useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { CameraControls } from "@react-three/drei";
import ExploreScene from "./scenes/ExploreScene";
import TacticalEffects from "./postprocessing/TacticalEffects";
import AudioController from "./AudioController";
import { useExploreStore } from "@/store/useExploreStore";
import ExploreHud from "../ui/ExploreHud";
import AtmosphereFX from "../ui/AtmosphereFX";
import { DRIFT_PAPER_HEX } from "@/lib/driftTheme";

const FOCUS_DISTANCE = 18;
const WARP_TRANSITION_MS = 1300; // CameraControls smoothTime(0.9~1.2s)에 맞춘 여유값
// 직교 카메라라 확대/축소는 위치가 아니라 zoom 값이 좌우한다 — 기본 줌은
// Canvas의 camera.zoom(4)과 맞추고, 곡을 선택하면 이만큼 확대한다.
const DEFAULT_ZOOM = 4;
const SELECTED_ZOOM = 13;

export default function ExploreCanvasContainer() {
  const controlsRef = useRef<React.ComponentRef<typeof CameraControls>>(null);
  const selectedTrackId = useExploreStore((state) => state.selectedTrackId);
  const nodes = useExploreStore((state) => state.nodes);
  const isWarping = useExploreStore((state) => state.isWarping);
  const warpTargetId = useExploreStore((state) => state.warpTargetId);
  const endWarp = useExploreStore((state) => state.endWarp);

  // 곡 클릭 → 노드를 화면 중앙으로 이동 + 확대. 선택 해제 시 원래 배율로 복귀.
  useEffect(() => {
    if (!controlsRef.current || isWarping) return;

    if (!selectedTrackId) {
      controlsRef.current.zoomTo(DEFAULT_ZOOM, true);
      return;
    }
    const node = nodes.find((n) => n.trackId === selectedTrackId);
    if (!node) return;
    const [x, y, z] = node.position3D;
    controlsRef.current.setLookAt(x, y, z + FOCUS_DISTANCE, x, y, z, true);
    controlsRef.current.zoomTo(SELECTED_ZOOM, true);
  }, [selectedTrackId, nodes, isWarping]);

  // 블랙홀 워프 → 대척점 존으로 급이동 + 일정 시간 뒤 흑백 효과 해제
  useEffect(() => {
    if (!isWarping || !warpTargetId || !controlsRef.current) return;
    const node = nodes.find((n) => n.trackId === warpTargetId);
    if (!node) {
      endWarp();
      return;
    }
    const [x, y, z] = node.position3D;
    controlsRef.current.setLookAt(x, y, z + FOCUS_DISTANCE, x, y, z, true);
    controlsRef.current.zoomTo(SELECTED_ZOOM, true);

    const timer = setTimeout(() => endWarp(), WARP_TRANSITION_MS);
    return () => clearTimeout(timer);
  }, [isWarping, warpTargetId, nodes, endWarp]);

  return (
    <div className="relative h-full w-full">
      <AtmosphereFX />
      <ExploreHud />

      <Canvas
        dpr={[1, 2]}
        orthographic
        // 등각(isometric) 느낌 — 원근 소실점 없이 격자가 평행한 다이아몬드로
        // 보이도록 직교 카메라를 대각선 위치에서 시작시킨다.
        camera={{ position: [110, 85, 110], zoom: 4, near: 0.1, far: 2000 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        onCreated={({ gl }) => gl.setClearColor(DRIFT_PAPER_HEX)}
      >
        <CameraControls
          ref={controlsRef}
          makeDefault
          minZoom={1.2}
          maxZoom={18}
          azimuthRotateSpeed={0.3}
          polarRotateSpeed={0.3}
          dollySpeed={0.5}
          truckSpeed={1}
          smoothTime={0.9}
          draggingSmoothTime={0.6}
          restThreshold={0.005}
        />
        <ambientLight intensity={0.8} />
        <AudioController selectedTrackId={selectedTrackId} nodes={nodes} />
        <ExploreScene />
        <TacticalEffects />
      </Canvas>
    </div>
  );
}
