"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { useGalaxyStore } from "@/store/useGalaxyStore";
import { calculateRedshiftColorAndPosition } from "@/engine/RedshiftEngine";
import { buildClusterTargets } from "@/engine/ClusterAnimationEngine";

const tempObject = new THREE.Object3D();
const HOVER_SCALE_MULT = 1.6;
const PICK_COLOR = new THREE.Color("#ff2fb0"); // Sector 큐레이션 중 담긴 곡 강조색
const LERP_LAMBDA = 4; // 클러스터 모션 damp 계수 — 클수록 빠르게 수렴
const HOVER_LAMBDA = 14; // 호버 스케일 damp 계수 — 클수록 빠르게 반응

interface BaseTransform {
  position: THREE.Vector3;
  scale: number;
  color: THREE.Color;
}

export default function InstancedStars() {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  // Redshift 계산으로 얻은 기준(=흩뿌려진) 위치/스케일/색상.
  const baseTransforms = useRef<BaseTransform[]>([]);
  // 실제로 화면에 그려지는 현재 위치 — 클러스터 모드일 때 이 값이 목표 위치로 lerp된다.
  const currentPositions = useRef<THREE.Vector3[]>([]);
  // 현재 스케일 배수(1 = base, HOVER_SCALE_MULT = 호버) — 매 프레임 목표치로 damp되어
  // 스케일이 순간이동 대신 부드럽게 커지고 줄어들게 한다.
  const scaleMults = useRef<number[]>([]);
  const isAnimating = useRef(false);
  const hoveredId = useRef<number | null>(null);

  const nodes = useGalaxyStore((state) => state.nodes);
  const savedSectors = useGalaxyStore((state) => state.savedSectors);
  const isClusterMode = useGalaxyStore((state) => state.isClusterMode);
  const setHoveredTrackId = useGalaxyStore((state) => state.setHoveredTrackId);
  const setSelectedTrackId = useGalaxyStore((state) => state.setSelectedTrackId);
  const isSectorDrawMode = useGalaxyStore((state) => state.isSectorDrawMode);
  const draftTrackIds = useGalaxyStore((state) => state.draftTrackIds);
  const toggleDraftTrack = useGalaxyStore((state) => state.toggleDraftTrack);

  const clusterTargets = useMemo(() => buildClusterTargets(savedSectors), [savedSectors]);

  // Instanced Matrix 및 Color 초기 매핑 (노드 목록이 바뀔 때만 재계산)
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || nodes.length === 0) return;

    const transforms: BaseTransform[] = [];
    const positions: THREE.Vector3[] = [];

    nodes.forEach((node, i) => {
      const basePos = new THREE.Vector3(...node.position3D);
      const { position, color, scale } = calculateRedshiftColorAndPosition(
        basePos,
        node.lastPlayedAt
      );

      transforms.push({ position, scale, color });
      positions.push(position.clone());

      tempObject.position.copy(position);
      tempObject.scale.set(scale, scale, scale);
      tempObject.updateMatrix();

      mesh.setMatrixAt(i, tempObject.matrix);
      mesh.setColorAt(i, color);
    });

    baseTransforms.current = transforms;
    currentPositions.current = positions;
    scaleMults.current = nodes.map(() => 1);
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [nodes]);

  // Sector 큐레이션 중 담긴/뺀 곡의 색상을 강조/원복한다.
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || baseTransforms.current.length === 0) return;
    const draftSet = new Set(draftTrackIds);

    nodes.forEach((node, i) => {
      const base = baseTransforms.current[i];
      if (!base) return;
      mesh.setColorAt(i, draftSet.has(node.trackId) ? PICK_COLOR : base.color);
    });
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [draftTrackIds, nodes]);

  // 클러스터 모드가 켜지거나 꺼지면 목표 위치가 바뀐 것이므로 애니메이션을 재개한다.
  useEffect(() => {
    isAnimating.current = true;
  }, [isClusterMode, clusterTargets]);

  // ClusterAnimationEngine 목표 위치로, 그리고 호버 스케일 배수를 매 프레임
  // damp — 위치/스케일 둘 다 순간이동 없이 부드럽게 수렴하면 자동으로 멈춘다.
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
      const current = currentPositions.current[i];
      if (!base || !current) return;

      const target = isClusterMode
        ? clusterTargets.get(node.trackId)?.position ?? base.position
        : base.position;

      if (current.distanceTo(target) > 0.01) {
        current.x = THREE.MathUtils.damp(current.x, target.x, LERP_LAMBDA, delta);
        current.y = THREE.MathUtils.damp(current.y, target.y, LERP_LAMBDA, delta);
        current.z = THREE.MathUtils.damp(current.z, target.z, LERP_LAMBDA, delta);
        stillMoving = true;
      } else {
        current.copy(target);
      }

      const targetMult = i === hoveredId.current ? HOVER_SCALE_MULT : 1;
      const curMult = scaleMults.current[i] ?? 1;
      if (Math.abs(curMult - targetMult) > 0.002) {
        scaleMults.current[i] = THREE.MathUtils.damp(curMult, targetMult, HOVER_LAMBDA, delta);
        stillMoving = true;
      } else {
        scaleMults.current[i] = targetMult;
      }

      const scale = base.scale * scaleMults.current[i];
      tempObject.position.copy(current);
      tempObject.scale.set(scale, scale, scale);
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
    isAnimating.current = true; // 새 호버/이전 호버 둘 다 이 프레임 루프가 damp 처리
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

    if (isSectorDrawMode) {
      toggleDraftTrack(nodes[id].trackId);
    } else {
      setSelectedTrackId(nodes[id].trackId);
    }
  };

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, nodes.length]}
      // 클러스터 모드에서 setMatrixAt으로 인스턴스를 계속 이동시키는데,
      // InstancedMesh의 프러스텀 컬링용 바운딩 스피어는 최초 1회 계산된 뒤
      // 자동 갱신되지 않는다. 컬링을 꺼서 "전체가 통째로 사라지는" 버그를 막는다.
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
