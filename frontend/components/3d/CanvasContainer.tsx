"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { CameraControls } from "@react-three/drei";
import GalaxyScene from "./scenes/GalaxyScene";
import SectorVolumeBox from "./objects/SectorVolumeBox";
import AudioController from "./AudioController";
import { useGalaxyStore } from "@/store/useGalaxyStore";
import { calculateRedshiftColorAndPosition } from "@/engine/RedshiftEngine";
import { buildClusterTargets } from "@/engine/ClusterAnimationEngine";
import GalaxyHud from "../ui/GalaxyHud";
import AtmosphereFX from "../ui/AtmosphereFX";
import { DRIFT_PAPER_HEX } from "@/lib/driftTheme";

const FOCUS_DISTANCE = 18;

// NOTE: 원본 스펙은 <Bvh firstHitOnly>로 InstancedMesh를 감싸지만,
// 이 프로젝트의 drei 10.7.8 + InstancedMesh 조합에서 화면 멈춤 이슈가
// 확인되어 Phase 1에서는 제외한다 (docs/tech-spec.md 3.1 참고).
export default function CanvasContainer() {
  const controlsRef = useRef<React.ComponentRef<typeof CameraControls>>(null);
  const savedSectors = useGalaxyStore((state) => state.savedSectors);
  const selectedTrackId = useGalaxyStore((state) => state.selectedTrackId);
  const nodes = useGalaxyStore((state) => state.nodes);
  const isClusterMode = useGalaxyStore((state) => state.isClusterMode);

  const clusterTargets = useMemo(() => buildClusterTargets(savedSectors), [savedSectors]);

  // 곡을 선택(클릭)하면 카메라가 그 노드를 향해 부드럽게 이동한다.
  // node.position3D는 원본(흩뿌려진) 좌표일 뿐, 실제로 렌더링되는 위치는
  // RedshiftEngine의 드리프트 보정(+클러스터 모드일 땐 클러스터 좌표)이 적용된
  // 값이므로, InstancedStars와 동일한 계산을 거쳐야 화면 중앙에 정확히 맞는다.
  useEffect(() => {
    if (!selectedTrackId || !controlsRef.current) return;
    const node = nodes.find((n) => n.trackId === selectedTrackId);
    if (!node) return;

    const basePos = new THREE.Vector3(...node.position3D);
    const { position: redshiftedPos } = calculateRedshiftColorAndPosition(
      basePos,
      node.lastPlayedAt
    );
    const target = isClusterMode
      ? (clusterTargets.get(node.trackId)?.position ?? redshiftedPos)
      : redshiftedPos;

    controlsRef.current.setLookAt(
      target.x,
      target.y,
      target.z + FOCUS_DISTANCE,
      target.x,
      target.y,
      target.z,
      true
    );
  }, [selectedTrackId, nodes, isClusterMode, clusterTargets]);

  return (
    <div className="relative h-full w-full">
      <AtmosphereFX />
      <GalaxyHud />

      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 120], fov: 55 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        onCreated={({ gl }) => gl.setClearColor(DRIFT_PAPER_HEX)}
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
        <AudioController selectedTrackId={selectedTrackId} nodes={nodes} />
        <GalaxyScene />
        {savedSectors.map((sector) => (
          <SectorVolumeBox key={sector.sectorId} sector={sector} />
        ))}
      </Canvas>
    </div>
  );
}
