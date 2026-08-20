"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { ThreeEvent } from "@react-three/fiber";
import { useGalaxyStore } from "@/store/useGalaxyStore";
import { calculateRedshiftColorAndPosition } from "@/engine/RedshiftEngine";

const tempObject = new THREE.Object3D();
const HOVER_SCALE_MULT = 1.6;

export default function InstancedStars() {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  // Redshift 계산으로 얻은 기준 위치/스케일 — 호버 시 이 값을 기준으로만 확대/축소한다.
  const baseTransforms = useRef<{ position: THREE.Vector3; scale: number }[]>([]);
  const hoveredId = useRef<number | null>(null);

  const nodes = useGalaxyStore((state) => state.nodes);
  const setHoveredTrackId = useGalaxyStore((state) => state.setHoveredTrackId);
  const setSelectedTrackId = useGalaxyStore((state) => state.setSelectedTrackId);

  // Instanced Matrix 및 Color 매핑 (노드 목록이 바뀔 때만 재계산)
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || nodes.length === 0) return;

    const transforms: { position: THREE.Vector3; scale: number }[] = [];

    nodes.forEach((node, i) => {
      const basePos = new THREE.Vector3(...node.position3D);
      const { position, color, scale } = calculateRedshiftColorAndPosition(
        basePos,
        node.lastPlayedAt
      );

      transforms.push({ position, scale });

      tempObject.position.copy(position);
      tempObject.scale.set(scale, scale, scale);
      tempObject.updateMatrix();

      mesh.setMatrixAt(i, tempObject.matrix);
      mesh.setColorAt(i, color);
    });

    baseTransforms.current = transforms;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [nodes]);

  const applyScale = (id: number, mult: number) => {
    const mesh = meshRef.current;
    const base = baseTransforms.current[id];
    if (!mesh || !base) return;
    tempObject.position.copy(base.position);
    const s = base.scale * mult;
    tempObject.scale.set(s, s, s);
    tempObject.updateMatrix();
    mesh.setMatrixAt(id, tempObject.matrix);
    mesh.instanceMatrix.needsUpdate = true;
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const id = e.instanceId;
    if (id === undefined || !nodes[id] || id === hoveredId.current) return;

    if (hoveredId.current !== null) applyScale(hoveredId.current, 1);
    applyScale(id, HOVER_SCALE_MULT);
    hoveredId.current = id;
    setHoveredTrackId(nodes[id].trackId);
  };

  const handlePointerOut = () => {
    if (hoveredId.current !== null) {
      applyScale(hoveredId.current, 1);
      hoveredId.current = null;
    }
    setHoveredTrackId(null);
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const id = e.instanceId;
    if (id !== undefined && nodes[id]) setSelectedTrackId(nodes[id].trackId);
  };

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, nodes.length]}
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      <octahedronGeometry args={[0.8, 0]} />
      <meshBasicMaterial wireframe vertexColors toneMapped={false} />
    </instancedMesh>
  );
}
