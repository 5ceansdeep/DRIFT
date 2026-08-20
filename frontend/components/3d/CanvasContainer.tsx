"use client";

import { useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { CameraControls } from "@react-three/drei";
import GalaxyScene from "./scenes/GalaxyScene";
import SectorVolumeBox from "./objects/SectorVolumeBox";
import AudioController from "./AudioController";
import { useGalaxyStore } from "@/store/useGalaxyStore";
import GalaxyHud from "../ui/GalaxyHud";

const FOCUS_DISTANCE = 18;

// NOTE: 원본 스펙은 <Bvh firstHitOnly>로 InstancedMesh를 감싸지만,
// 이 프로젝트의 drei 10.7.8 + InstancedMesh 조합에서 화면 멈춤 이슈가
// 확인되어 Phase 1에서는 제외한다 (docs/tech-spec.md 3.1 참고).
export default function CanvasContainer() {
  const controlsRef = useRef<React.ComponentRef<typeof CameraControls>>(null);
  const savedSectors = useGalaxyStore((state) => state.savedSectors);
  const selectedTrackId = useGalaxyStore((state) => state.selectedTrackId);
  const nodes = useGalaxyStore((state) => state.nodes);

  // 곡을 선택(클릭)하면 카메라가 그 노드를 향해 부드럽게 이동한다.
  useEffect(() => {
    if (!selectedTrackId || !controlsRef.current) return;
    const node = nodes.find((n) => n.trackId === selectedTrackId);
    if (!node) return;
    const [x, y, z] = node.position3D;
    controlsRef.current.setLookAt(x, y, z + FOCUS_DISTANCE, x, y, z, true);
  }, [selectedTrackId, nodes]);

  return (
    <div className="relative h-full w-full">
      <GalaxyHud />

      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 120], fov: 55 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        onCreated={({ gl }) => gl.setClearColor("#E0F2E9")}
      >
        <CameraControls
          ref={controlsRef}
          makeDefault
          maxDistance={250}
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
        <AudioController />
        <GalaxyScene />
        {savedSectors.map((sector) => (
          <SectorVolumeBox key={sector.sectorId} sector={sector} />
        ))}
      </Canvas>
    </div>
  );
}
