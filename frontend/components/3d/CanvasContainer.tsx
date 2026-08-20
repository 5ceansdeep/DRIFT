"use client";

import { Canvas } from "@react-three/fiber";
import { CameraControls } from "@react-three/drei";
import GalaxyScene from "./scenes/GalaxyScene";
import { useGalaxyStore } from "@/store/useGalaxyStore";
import GalaxyHud from "../ui/GalaxyHud";

// NOTE: 원본 스펙은 <Bvh firstHitOnly>로 InstancedMesh를 감싸지만,
// 이 프로젝트의 drei 10.7.8 + InstancedMesh 조합에서 화면 멈춤 이슈가
// 확인되어 Phase 1에서는 제외한다 (docs/tech-spec.md 3.1 참고).
export default function CanvasContainer() {
  const viewMode = useGalaxyStore((state) => state.viewMode);

  return (
    <div className="relative h-full w-full">
      <GalaxyHud />

      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 120], fov: 55 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        onCreated={({ gl }) => gl.setClearColor("#E0F2E9")}
      >
        <CameraControls makeDefault maxDistance={250} minDistance={5} />
        <ambientLight intensity={0.8} />
        {viewMode === "GALAXY" && <GalaxyScene />}
        {/* SECTOR / TWIN 씬은 Phase 2/3에서 구현 */}
      </Canvas>
    </div>
  );
}
