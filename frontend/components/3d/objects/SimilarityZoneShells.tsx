"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh, MeshBasicMaterial } from "three";
import { Html } from "@react-three/drei";
import { useExploreStore } from "@/store/useExploreStore";
import { ZONE_BOUNDARY_RADII, MAX_RADIUS, zoneForSimilarity } from "@/engine/SimilarityZones";

const IDLE_OPACITY = 0.035;
const ACTIVE_OPACITY = 0.16;
const LAMBDA = 8; // 목표 opacity로 damp되는 속도

// HIGH/MID/LOW 존 경계를 나타내는 얇은 와이어프레임 구 껍질 + 라벨.
// 클릭/호버 불가 (raycast 대상 아님) — 순수 시각적 방향 표지.
// 연구소 컨셉: 평소엔 잉크 색 그리드처럼 거의 안 보이다가, 그 존에 속한
// 노드를 호버/선택하면 해당 경계만 살짝 밝아진다 — 참고 HTML의 장르
// 구체(hover 시에만 wireframe이 드러나는 연출)를 유사도 존에 맞게 재해석.
export default function SimilarityZoneShells() {
  const highMidRef = useRef<Mesh>(null!);
  const midLowRef = useRef<Mesh>(null!);

  const nodes = useExploreStore((state) => state.nodes);
  const hoveredTrackId = useExploreStore((state) => state.hoveredTrackId);
  const selectedTrackId = useExploreStore((state) => state.selectedTrackId);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    const focusId = hoveredTrackId ?? selectedTrackId;
    const focusNode = focusId ? nodes.find((n) => n.trackId === focusId) : undefined;
    const activeZone = focusNode ? zoneForSimilarity(focusNode.similarity) : null;

    const highMidMat = highMidRef.current?.material as MeshBasicMaterial | undefined;
    const midLowMat = midLowRef.current?.material as MeshBasicMaterial | undefined;

    // 껍질 하나가 두 존을 가른다: HIGH|MID 경계는 HIGH나 MID를 보고 있을 때,
    // MID|LOW 경계는 MID나 LOW를 보고 있을 때 함께 밝아진다.
    const highMidTarget =
      activeZone === "HIGH" || activeZone === "MID"
        ? ACTIVE_OPACITY
        : IDLE_OPACITY + Math.sin(t * 0.6) * 0.015;
    const midLowTarget =
      activeZone === "MID" || activeZone === "LOW"
        ? ACTIVE_OPACITY
        : IDLE_OPACITY + Math.sin(t * 0.4 + 1.5) * 0.012;

    if (highMidMat) {
      highMidMat.opacity += (highMidTarget - highMidMat.opacity) * Math.min(1, LAMBDA * delta);
    }
    if (midLowMat) {
      midLowMat.opacity += (midLowTarget - midLowMat.opacity) * Math.min(1, LAMBDA * delta);
    }
  });

  return (
    <group>
      <mesh ref={highMidRef} raycast={() => null}>
        <sphereGeometry args={[ZONE_BOUNDARY_RADII.highMid, 24, 16]} />
        <meshBasicMaterial color="#0a0f0c" wireframe transparent opacity={IDLE_OPACITY} />
      </mesh>
      <mesh ref={midLowRef} raycast={() => null}>
        <sphereGeometry args={[ZONE_BOUNDARY_RADII.midLow, 24, 16]} />
        <meshBasicMaterial color="#0a0f0c" wireframe transparent opacity={IDLE_OPACITY} />
      </mesh>

      <Html position={[0, ZONE_BOUNDARY_RADII.highMid * 0.5, 0]} center style={{ pointerEvents: "none" }}>
        <div className="whitespace-nowrap border-b border-ink3 pb-px font-mono text-[9px] uppercase tracking-[0.18em] text-ink3 opacity-60">
          High Similarity
        </div>
      </Html>
      <Html
        position={[0, (ZONE_BOUNDARY_RADII.highMid + ZONE_BOUNDARY_RADII.midLow) / 2, 0]}
        center
        style={{ pointerEvents: "none" }}
      >
        <div className="whitespace-nowrap border-b border-ink3 pb-px font-mono text-[9px] uppercase tracking-[0.18em] text-ink3 opacity-60">
          Serendipity Boundary
        </div>
      </Html>
      <Html position={[0, MAX_RADIUS * 0.92, 0]} center style={{ pointerEvents: "none" }}>
        <div className="whitespace-nowrap border-b border-ink3 pb-px font-mono text-[9px] uppercase tracking-[0.18em] text-ink3 opacity-60">
          Antipode · Warp Zone
        </div>
      </Html>
    </group>
  );
}
