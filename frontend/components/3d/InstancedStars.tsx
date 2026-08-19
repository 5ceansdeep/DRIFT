"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { InstancedMesh } from "three";
import type { ThreeEvent } from "@react-three/fiber";

const COUNT = 1000;
const SPREAD = 60;
const BASE_COLOR = new THREE.Color("#0a0f0c");
const HOVER_COLOR = new THREE.Color("#ff6a3d");

export default function InstancedStars() {
  const meshRef = useRef<InstancedMesh>(null!);
  const hoveredId = useRef<number | null>(null);

  // 1,000개 큐브의 임의 3D 좌표 (컴포넌트 생애주기 동안 고정)
  const positions = useMemo(() => {
    const arr: THREE.Vector3[] = [];
    for (let i = 0; i < COUNT; i++) {
      arr.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * SPREAD,
          (Math.random() - 0.5) * SPREAD,
          (Math.random() - 0.5) * SPREAD
        )
      );
    }
    return arr;
  }, []);

  // 최초 1회: 인스턴스별 위치 행렬 + 기본 색상 세팅
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    positions.forEach((pos, i) => {
      dummy.position.copy(pos);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, BASE_COLOR);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [positions]);

  const setInstanceColor = (id: number, color: THREE.Color) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.setColorAt(id, color);
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const id = e.instanceId;
    if (id === undefined || id === hoveredId.current) return;
    if (hoveredId.current !== null) setInstanceColor(hoveredId.current, BASE_COLOR);
    setInstanceColor(id, HOVER_COLOR);
    hoveredId.current = id;
  };

  const handlePointerOut = () => {
    if (hoveredId.current !== null) {
      setInstanceColor(hoveredId.current, BASE_COLOR);
      hoveredId.current = null;
    }
  };

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, COUNT]}
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
    >
      <boxGeometry args={[0.6, 0.6, 0.6]} />
      <meshStandardMaterial vertexColors toneMapped={false} />
    </instancedMesh>
  );
}
