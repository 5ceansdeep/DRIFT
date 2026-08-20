"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { InstancedMesh } from "three";
import type { ThreeEvent } from "@react-three/fiber";

const COUNT = 1000;
const SPREAD = 60;
const BASE_COLOR = new THREE.Color("#0a0f0c");
const HOVER_COLOR = new THREE.Color("#ff6a3d");

// 모듈 로드 시 1회만 계산 — 컴포넌트 렌더 함수 안에서 Math.random()을
// 직접 호출하면 impure render로 lint 에러(react-hooks/purity)가 난다.
function generatePositions(): THREE.Vector3[] {
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
}
const STATIC_POSITIONS = generatePositions();

export default function InstancedStars() {
  const meshRef = useRef<InstancedMesh>(null!);
  const hoveredId = useRef<number | null>(null);

  // 최초 1회: 인스턴스별 위치 행렬 + 기본 색상 세팅
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    STATIC_POSITIONS.forEach((pos, i) => {
      dummy.position.copy(pos);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, BASE_COLOR);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, []);

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
