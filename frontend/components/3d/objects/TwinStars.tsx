"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { useTwinStore } from "@/store/useTwinStore";
import { calculateRedshiftColorAndPosition } from "@/engine/RedshiftEngine";
import type { TrackNode } from "@/types";

const tempObject = new THREE.Object3D();
const HOVER_SCALE_MULT = 1.6;
const HOVER_LAMBDA = 14; // 호버 스케일 damp 계수 — 클수록 빠르게 반응
const GAP_COLOR = new THREE.Color("#FF0055"); // Gap Node 강조색 — 아키텍처 개정 4번
const GAP_SCALE_MULT = 1.4; // Gap Node는 일반 노드보다 눈에 띄게 크게

interface BaseTransform {
  position: THREE.Vector3;
  scale: number;
  color: THREE.Color;
}

export default function TwinStars({ nodes }: { nodes: TrackNode[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const baseTransforms = useRef<BaseTransform[]>([]);
  const hoveredId = useRef<number | null>(null);
  // 현재 스케일 배수(1 = base) — 매 프레임 목표치로 damp되어 순간이동 대신
  // 부드럽게 커지고 줄어든다.
  const scaleMults = useRef<number[]>([]);
  const isAnimating = useRef(false);

  const setHoveredTrackId = useTwinStore((state) => state.setHoveredTrackId);
  const setSelectedTrackId = useTwinStore((state) => state.setSelectedTrackId);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || nodes.length === 0) return;

    const transforms: BaseTransform[] = [];

    nodes.forEach((node, i) => {
      const basePos = new THREE.Vector3(...node.position3D);
      const { position, color, scale } = calculateRedshiftColorAndPosition(
        basePos,
        node.lastPlayedAt
      );

      const finalColor = node.isGapNode ? GAP_COLOR : color;
      const finalScale = node.isGapNode ? scale * GAP_SCALE_MULT : scale;

      transforms.push({ position, scale: finalScale, color: finalColor });

      tempObject.position.copy(position);
      tempObject.scale.set(finalScale, finalScale, finalScale);
      tempObject.updateMatrix();

      mesh.setMatrixAt(i, tempObject.matrix);
      mesh.setColorAt(i, finalColor);
    });

    baseTransforms.current = transforms;
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
      const base = baseTransforms.current[i];
      if (!base) return;

      const targetMult = i === hoveredId.current ? HOVER_SCALE_MULT : 1;
      const curMult = scaleMults.current[i] ?? 1;
      if (Math.abs(curMult - targetMult) > 0.002) {
        scaleMults.current[i] = THREE.MathUtils.damp(curMult, targetMult, HOVER_LAMBDA, delta);
        stillMoving = true;
      } else {
        scaleMults.current[i] = targetMult;
      }

      const s = base.scale * scaleMults.current[i];
      tempObject.position.copy(base.position);
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
