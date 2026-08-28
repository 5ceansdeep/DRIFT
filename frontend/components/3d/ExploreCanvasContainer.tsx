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

export default function ExploreCanvasContainer() {
  const controlsRef = useRef<React.ComponentRef<typeof CameraControls>>(null);
  const selectedTrackId = useExploreStore((state) => state.selectedTrackId);
  const nodes = useExploreStore((state) => state.nodes);
  const isWarping = useExploreStore((state) => state.isWarping);
  const warpTargetId = useExploreStore((state) => state.warpTargetId);
  const endWarp = useExploreStore((state) => state.endWarp);

  // 곡 클릭 → 일반 Fly-To
  useEffect(() => {
    if (!selectedTrackId || !controlsRef.current || isWarping) return;
    const node = nodes.find((n) => n.trackId === selectedTrackId);
    if (!node) return;
    const [x, y, z] = node.position3D;
    controlsRef.current.setLookAt(x, y, z + FOCUS_DISTANCE, x, y, z, true);
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

    const timer = setTimeout(() => endWarp(), WARP_TRANSITION_MS);
    return () => clearTimeout(timer);
  }, [isWarping, warpTargetId, nodes, endWarp]);

  return (
    <div className="relative h-full w-full">
      <AtmosphereFX />
      <ExploreHud />

      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 150], fov: 55 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        onCreated={({ gl }) => gl.setClearColor(DRIFT_PAPER_HEX)}
      >
        <CameraControls
          ref={controlsRef}
          makeDefault
          maxDistance={300}
          minDistance={5}
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
