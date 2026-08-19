"use client";

import { Canvas } from "@react-three/fiber";
import InstancedStars from "../../components/3d/InstancedStars";

export default function PrototypePage() {
  return (
    <div style={{ width: "100vw", height: "100dvh", margin: 0 }}>
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 50], fov: 60 }}>
        <color attach="background" args={["#e0f2e9"]} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 15, 10]} intensity={0.8} />
        <InstancedStars />
      </Canvas>
    </div>
  );
}
