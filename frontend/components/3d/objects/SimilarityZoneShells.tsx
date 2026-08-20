"use client";

import { Html } from "@react-three/drei";
import { ZONE_BOUNDARY_RADII, MAX_RADIUS } from "@/engine/SimilarityZones";

// HIGH/MID/LOW 존 경계를 나타내는 얇은 와이어프레임 구 껍질 + 라벨.
// 클릭/호버 불가 (raycast 대상 아님) — 순수 시각적 방향 표지.
export default function SimilarityZoneShells() {
  return (
    <group>
      <mesh raycast={() => null}>
        <sphereGeometry args={[ZONE_BOUNDARY_RADII.highMid, 24, 16]} />
        <meshBasicMaterial color="#00F0FF" wireframe transparent opacity={0.08} />
      </mesh>
      <mesh raycast={() => null}>
        <sphereGeometry args={[ZONE_BOUNDARY_RADII.midLow, 24, 16]} />
        <meshBasicMaterial color="#8800FF" wireframe transparent opacity={0.06} />
      </mesh>

      <Html position={[0, ZONE_BOUNDARY_RADII.highMid * 0.5, 0]} center style={{ pointerEvents: "none" }}>
        <div className="whitespace-nowrap font-mono text-[9px] tracking-widest text-[#00F0FF] opacity-70">
          HIGH SIMILARITY
        </div>
      </Html>
      <Html
        position={[0, (ZONE_BOUNDARY_RADII.highMid + ZONE_BOUNDARY_RADII.midLow) / 2, 0]}
        center
        style={{ pointerEvents: "none" }}
      >
        <div className="whitespace-nowrap font-mono text-[9px] tracking-widest text-[#FFC400] opacity-70">
          SERENDIPITY BOUNDARY
        </div>
      </Html>
      <Html position={[0, MAX_RADIUS * 0.92, 0]} center style={{ pointerEvents: "none" }}>
        <div className="whitespace-nowrap font-mono text-[9px] tracking-widest text-[#8800FF] opacity-70">
          ANTIPODE · WARP ZONE
        </div>
      </Html>
    </group>
  );
}
