"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useExploreStore } from "@/store/useExploreStore";
import { COMET_RADIUS_RANGE } from "@/engine/SimilarityZones";

// 0.3~0.5 유사도 경계(필터 버블의 가장자리)를 순찰하는 세렌디피티 혜성.
// 클릭하면 그 경계 구간에서 무작위 트랙 하나를 "포착"해 선택 상태로 만든다.
export default function SerendipityComet() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const nodes = useExploreStore((state) => state.nodes);
  const setSelectedTrackId = useExploreStore((state) => state.setSelectedTrackId);

  const curve = useMemo(() => {
    const r = (COMET_RADIUS_RANGE.min + COMET_RADIUS_RANGE.max) / 2;
    // 경계 반지름 r 근방을 도는 불규칙한 폐곡선.
    return new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(-r, r * 0.3, r * 0.2),
        new THREE.Vector3(0, -r * 0.6, r * 0.8),
        new THREE.Vector3(r * 0.9, r * 0.2, -r * 0.3),
        new THREE.Vector3(r * 0.2, r * 0.7, -r * 0.7),
        new THREE.Vector3(-r * 0.8, -r * 0.2, -r * 0.4),
      ],
      true
    );
  }, []);

  useFrame(({ clock }) => {
    const t = (clock.getElapsedTime() * 0.05) % 1;
    meshRef.current?.position.copy(curve.getPoint(t));
  });

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (nodes.length === 0) return;

    const boundaryNodes = nodes.filter((n) => n.similarity >= 0.3 && n.similarity <= 0.5);
    if (boundaryNodes.length > 0) {
      const pick = boundaryNodes[Math.floor(Math.random() * boundaryNodes.length)];
      setSelectedTrackId(pick.trackId);
      return;
    }

    // 실 데이터는 후보가 적어 0.3~0.5 구간이 비어있을 수 있다 — 그 경우
    // 경계값(0.4)에 가장 가까운 곡으로 대체해 혜성 클릭이 항상 반응하게 한다.
    const closest = nodes.reduce((best, n) =>
      Math.abs(n.similarity - 0.4) < Math.abs(best.similarity - 0.4) ? n : best
    );
    setSelectedTrackId(closest.trackId);
  };

  return (
    <mesh ref={meshRef} onClick={handleClick}>
      <sphereGeometry args={[1.6, 16, 16]} />
      <meshBasicMaterial color="#000000" wireframe />
    </mesh>
  );
}
