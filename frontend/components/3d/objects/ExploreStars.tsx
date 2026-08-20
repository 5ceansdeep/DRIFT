"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { ThreeEvent } from "@react-three/fiber";
import { useExploreStore } from "@/store/useExploreStore";
import { colorForSimilarity } from "@/engine/SimilarityZones";
import type { TrackNode } from "@/types";

const tempObject = new THREE.Object3D();
const HOVER_SCALE_MULT = 1.6;
const BASE_SCALE = 0.7;

export default function ExploreStars({ nodes }: { nodes: TrackNode[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const hoveredId = useRef<number | null>(null);

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

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [nodes]);

  const applyScale = (id: number, mult: number) => {
    const mesh = meshRef.current;
    const node = nodes[id];
    if (!mesh || !node) return;
    tempObject.position.set(...node.position3D);
    const s = BASE_SCALE * mult;
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
    if (hoveredId.current !== null) applyScale(hoveredId.current, 1);
    hoveredId.current = null;
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
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      <octahedronGeometry args={[0.8, 0]} />
      <meshBasicMaterial wireframe vertexColors toneMapped={false} />
    </instancedMesh>
  );
}
