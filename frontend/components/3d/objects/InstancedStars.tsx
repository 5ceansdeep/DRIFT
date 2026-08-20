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

  // ClusterAnimationEngine 목표 위치로 매 프레임 lerp (수렴하면 자동으로 멈춘다).
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

      const scale = i === hoveredId.current ? base.scale * HOVER_SCALE_MULT : base.scale;
      tempObject.position.copy(current);
      tempObject.scale.set(scale, scale, scale);
      tempObject.updateMatrix();
      mesh.setMatrixAt(i, tempObject.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (!stillMoving) isAnimating.current = false;
  });

  // 애니메이션이 쉬고 있을 때(클러스터 전환 중이 아닐 때)의 호버 확대/축소.
  // currentPositions 기준으로 스케일만 덧그린다 — 클러스터된 위치를 건드리지 않는다.
  const applyScale = (id: number, mult: number) => {
    const mesh = meshRef.current;
    const base = baseTransforms.current[id];
    const current = currentPositions.current[id];
    if (!mesh || !base || !current) return;
    tempObject.position.copy(current);
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

    if (!isAnimating.current) {
      if (hoveredId.current !== null) applyScale(hoveredId.current, 1);
      applyScale(id, HOVER_SCALE_MULT);
    }
    hoveredId.current = id;
    setHoveredTrackId(nodes[id].trackId);
  };

  const handlePointerOut = () => {
    if (hoveredId.current !== null && !isAnimating.current) {
      applyScale(hoveredId.current, 1);
    }
    hoveredId.current = null;
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
