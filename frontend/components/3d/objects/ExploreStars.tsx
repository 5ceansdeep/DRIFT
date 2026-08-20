"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { useExploreStore } from "@/store/useExploreStore";
import { colorForSimilarity } from "@/engine/SimilarityZones";
import type { TrackNode } from "@/types";

const tempObject = new THREE.Object3D();
const HOVER_SCALE_MULT = 1.6;
const HOVER_LAMBDA = 14; // 호버 스케일 damp 계수 — 클수록 빠르게 반응
const BASE_SCALE = 0.7;

export default function ExploreStars({ nodes }: { nodes: TrackNode[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const hoveredId = useRef<number | null>(null);
  // 현재 스케일 배수(1 = base) — 매 프레임 목표치로 damp되어 순간이동 대신
  // 부드럽게 커지고 줄어든다.
  const scaleMults = useRef<number[]>([]);
  const isAnimating = useRef(false);

  const setHoveredTrackId = useExploreStore((state) => state.setHoveredTrackId);
  const setSelectedTrackId = useExploreStore((state) => state.setSelectedTrackId);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || nodes.length === 0) return;

    nodes.forEach((node, i) => {
      const color = colorForSimilarity(node.similarity);
      tempObject.position.set(...node.position3D);
      tempObject.scale.set(BASE_SCALE, BASE_SCALE, BASE_SCALE);
      tempObject.updateMatrix();
      mesh.setMatrixAt(i, tempObject.matrix);
      mesh.setColorAt(i, color);
    });

    scaleMults.current = nodes.map(() => 1);
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [nodes]);

  // 호버 스케일 배수를 목표치로 damp — 수렴하면 자동으로 멈춘다.
  useFrame((_, delta) => {
    if (!isAnimating.current) return;
    const mesh = meshRef.current;
    if (!mesh || nodes.length === 0) {
      isAnimating.current = false;
      return;
    }

    let stillMoving = false;

    nodes.forEach((node, i) => {
      const targetMult = i === hoveredId.current ? HOVER_SCALE_MULT : 1;
      const curMult = scaleMults.current[i] ?? 1;
      if (Math.abs(curMult - targetMult) > 0.002) {
        scaleMults.current[i] = THREE.MathUtils.damp(curMult, targetMult, HOVER_LAMBDA, delta);
        stillMoving = true;
      } else {
        scaleMults.current[i] = targetMult;
      }

      const s = BASE_SCALE * scaleMults.current[i];
      tempObject.position.set(...node.position3D);
      tempObject.scale.set(s, s, s);
      tempObject.updateMatrix();
      mesh.setMatrixAt(i, tempObject.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (!stillMoving) isAnimating.current = false;
  });

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const id = e.instanceId;
    if (id === undefined || !nodes[id] || id === hoveredId.current) return;

    hoveredId.current = id;
    isAnimating.current = true;
    setHoveredTrackId(nodes[id].trackId);
  };

  const handlePointerOut = () => {
    hoveredId.current = null;
    isAnimating.current = true;
    setHoveredTrackId(null);
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const id = e.instanceId;
    if (id === undefined || !nodes[id]) return;
    setSelectedTrackId(nodes[id].trackId);
  };

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, nodes.length]}
      // 호버 시 setMatrixAt으로 스케일을 바꾸는데, InstancedMesh의 캐시된
      // 바운딩 스피어가 갱신되지 않아 전체가 컬링될 수 있어 꺼둔다.
      frustumCulled={false}
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      <octahedronGeometry args={[0.8, 0]} />
      <meshBasicMaterial wireframe vertexColors toneMapped={false} />
    </instancedMesh>
  );
}
