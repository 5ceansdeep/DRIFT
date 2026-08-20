"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { CameraControls } from "@react-three/drei";
import TwinScene from "./scenes/TwinScene";
import AudioController from "./AudioController";
import { useTwinStore } from "@/store/useTwinStore";
import { calculateRedshiftColorAndPosition } from "@/engine/RedshiftEngine";
import TwinHud from "../ui/TwinHud";
import AtmosphereFX from "../ui/AtmosphereFX";

const FOCUS_DISTANCE = 18;

export default function TwinCanvasContainer() {
  const controlsRef = useRef<React.ComponentRef<typeof CameraControls>>(null);
  const selectedTrackId = useTwinStore((state) => state.selectedTrackId);
  const twinData = useTwinStore((state) => state.twinData);

  useEffect(() => {
    if (!selectedTrackId || !controlsRef.current) return;
    const node = twinData?.twinNodes.find((n) => n.trackId === selectedTrackId);
    if (!node) return;

    const basePos = new THREE.Vector3(...node.position3D);
    const { position: target } = calculateRedshiftColorAndPosition(basePos, node.lastPlayedAt);

    controlsRef.current.setLookAt(
      target.x,
      target.y,
      target.z + FOCUS_DISTANCE,
      target.x,
      target.y,
      target.z,
      true
    );
  }, [selectedTrackId, twinData]);

  return (
    <div className="relative h-full w-full">
      <AtmosphereFX />
      <TwinHud />

      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 120], fov: 55 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        onCreated={({ gl }) => gl.setClearColor("#c8f0d8")}
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
        <AudioController selectedTrackId={selectedTrackId} nodes={twinData?.twinNodes ?? []} />
        <TwinScene />
      </Canvas>
    </div>
  );
}
