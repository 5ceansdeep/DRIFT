"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useExploreStore } from "@/store/useExploreStore";
import { COMET_RADIUS_RANGE } from "@/engine/SimilarityZones";

const INK = "#0a0f0c";
const TRAIL_LAG = 0.015; // 꼬리가 머리보다 이만큼 뒤처진 위치를 따라간다

// 0.3~0.5 유사도 경계(필터 버블의 가장자리)를 순찰하는 세렌디피티 혜성.
// 클릭하면 그 경계 구간에서 무작위 트랙 하나를 "포착"해 선택 상태로 만든다.
// 연구소 컨셉: 빛나는 후광 대신, 참고 HTML의 궤도 표지처럼 얇은 와이어프레임
// 정팔면체 + 짧은 꼬리선 하나만 남긴다 — 계측기가 궤적을 추적하는 인상.
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

  // 꼬리선: <line> JSX는 React의 SVG <line> 타입과 이름이 겹쳐 타입 충돌이
  // 나서, three.js Line 객체를 직접 만들어 <primitive>로 붙인다.
  const trailLine = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
    const mat = new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.35 });
    const line = new THREE.Line(g, mat);
    line.raycast = () => {};
    return line;
  }, []);

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    const t = (elapsed * 0.05) % 1;
    const pos = curve.getPoint(t);
    meshRef.current?.position.copy(pos);

    // 은은한 회전 — 정지된 채로는 죽어 보인다.
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.006;
      meshRef.current.rotation.y += 0.004;
    }

    // 꼬리: 머리 위치 → 살짝 이전 시각의 위치로 이어지는 짧은 선분.
    const tailPos = curve.getPoint((t - TRAIL_LAG + 1) % 1);
    const attr = trailLine.geometry.getAttribute("position") as THREE.BufferAttribute;
    attr.setXYZ(0, pos.x, pos.y, pos.z);
    attr.setXYZ(1, tailPos.x, tailPos.y, tailPos.z);
    attr.needsUpdate = true;
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
    <>
      {/* 꼬리선 — 클릭 대상 아님, 순수 장식 */}
      <primitive object={trailLine} />
      <mesh ref={meshRef} onClick={handleClick}>
        <octahedronGeometry args={[1.6, 0]} />
        <meshBasicMaterial color={INK} wireframe />
      </mesh>
    </>
  );
}
