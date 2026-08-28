"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh, MeshBasicMaterial } from "three";
import { Html } from "@react-three/drei";
import { ZONE_BOUNDARY_RADII, MAX_RADIUS } from "@/engine/SimilarityZones";

// HIGH/MID/LOW 존 경계를 나타내는 얇은 와이어프레임 구 껍질 + 라벨.
// 클릭/호버 불가 (raycast 대상 아님) — 순수 시각적 방향 표지.
// 완전히 정적이면 죽어 보여서, 두 껍질이 서로 다른 리듬으로 은은하게
// 숨쉬듯 투명도가 오르내리게 해 "공간이 살아있다"는 인상을 준다.
export default function SimilarityZoneShells() {
  const highMidRef = useRef<Mesh>(null!);
  const midLowRef = useRef<Mesh>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const highMidMat = highMidRef.current?.material as MeshBasicMaterial | undefined;
    const midLowMat = midLowRef.current?.material as MeshBasicMaterial | undefined;
    if (highMidMat) highMidMat.opacity = 0.06 + Math.sin(t * 0.6) * 0.03;
    if (midLowMat) midLowMat.opacity = 0.05 + Math.sin(t * 0.4 + 1.5) * 0.025;
  });

  return (
    <group>
      <mesh ref={highMidRef} raycast={() => null}>
        <sphereGeometry args={[ZONE_BOUNDARY_RADII.highMid, 24, 16]} />
        <meshBasicMaterial color="#00F0FF" wireframe transparent opacity={0.08} />
      </mesh>
      <mesh ref={midLowRef} raycast={() => null}>
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
