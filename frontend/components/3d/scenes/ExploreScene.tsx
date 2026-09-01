"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { Grid, Html } from "@react-three/drei";
import { useExploreStore } from "@/store/useExploreStore";
import { prefetchCovers } from "@/lib/itunesImage";
import { authHeader } from "@/lib/authClient";
import ExploreStars from "../objects/ExploreStars";
import ExploreNodeControls from "../objects/ExploreNodeControls";
import SimilarityZoneShells from "../objects/SimilarityZoneShells";
import SerendipityComet from "../objects/SerendipityComet";
import type { TrackNode } from "@/types";

const FLOOR_Y = 0;
const SELF_LINK_COUNT = 5; // 원점(나)에서 뻗어나가는 연결선을 그릴 상위 유사도 곡 개수

// 각 노드 → 바닥 격자로 내려가는 짧은 수직 지시선. 등각 카메라에서
// "이 점이 바닥 어디 위에 떠 있는가"를 즉시 읽게 해주는 로피팝 차트 기법.
function useStemGeometry(nodes: TrackNode[]) {
  return useMemo(() => {
    const g = new THREE.BufferGeometry();
    const positions = new Float32Array(nodes.length * 6);
    nodes.forEach((n, i) => {
      const [x, y, z] = n.position3D;
      positions.set([x, FLOOR_Y, z, x, y, z], i * 6);
    });
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [nodes]);
}

// 원점(내 라이브러리) → 유사도 상위 곡들로 뻗는 연결선.
function useSelfLinkGeometry(nodes: TrackNode[]) {
  return useMemo(() => {
    const top = [...nodes].sort((a, b) => b.similarity - a.similarity).slice(0, SELF_LINK_COUNT);
    const g = new THREE.BufferGeometry();
    const positions = new Float32Array(top.length * 6);
    top.forEach((n, i) => {
      const [x, y, z] = n.position3D;
      positions.set([0, 0, 0, x, y, z], i * 6);
    });
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [nodes]);
}

export default function ExploreScene() {
  const setNodes = useExploreStore((state) => state.setNodes);
  const nodeCount = useExploreStore((state) => state.nodes.length);
  const nodes = useExploreStore((state) => state.nodes);
  const selectedTrackId = useExploreStore((state) => state.selectedTrackId);
  const selectedNode = nodes.find((n) => n.trackId === selectedTrackId) ?? null;

  const stemGeometry = useStemGeometry(nodes);
  const selfLinkGeometry = useSelfLinkGeometry(nodes);

  useEffect(() => {
    if (nodeCount > 0) return;
    fetch("/api/explore", { headers: authHeader() })
      .then((res) => res.json())
      .then((data) => {
        setNodes(data.nodes);
        prefetchCovers(data.nodes.map((n: TrackNode) => n.coverUrl));
      })
      .catch((err) => console.error("[ExploreScene] failed to load nodes:", err));
  }, [nodeCount, setNodes]);

  return (
    <>
      {/* 연구소 컨셉: 실험실 작업대의 그래프 용지 같은 기준 격자.
          원점(=내 라이브러리, 유사도 1.0 지점)과 같은 높이에 깔아, 격자가
          "해수면" 기준선처럼 노드 구름을 가로지르게 한다. */}
      <Grid
        args={[500, 500]}
        position={[0, FLOOR_Y, 0]}
        cellColor="#7aaa8a"
        sectionColor="#5a7060"
        cellThickness={0.4}
        sectionThickness={0.7}
        cellSize={10}
        sectionSize={50}
        fadeDistance={350}
        fadeStrength={1.5}
        infiniteGrid
        followCamera={false}
      />

      {/* 노드 → 바닥 지시선 */}
      <lineSegments raycast={() => null}>
        <primitive object={stemGeometry} attach="geometry" />
        <lineBasicMaterial color="#5a7060" transparent opacity={0.35} />
      </lineSegments>

      {/* 원점 → 상위 유사도 곡 연결선 */}
      <lineSegments raycast={() => null}>
        <primitive object={selfLinkGeometry} attach="geometry" />
        <lineBasicMaterial color="#0a0f0c" transparent opacity={0.22} />
      </lineSegments>

      <SimilarityZoneShells />

      {/* MY LIBRARY 앵커 — radiusForSimilarity(1) = 0, 즉 원점이 "나와 100%
          같은 지점"이라 여기가 곧 자기 자신의 위치다. 참고 이미지처럼 채워진
          큐브로 바닥 위에 두드러지게 표시. */}
      <group>
        <mesh raycast={() => null} position={[0, FLOOR_Y, 0]}>
          <boxGeometry args={[5, 5, 5]} />
          <meshBasicMaterial color="#0a0f0c" />
        </mesh>
        <Html position={[0, FLOOR_Y - 4.5, 0]} center style={{ pointerEvents: "none" }}>
          <div className="whitespace-nowrap border-b border-ink3 pb-px font-mono text-[9px] uppercase tracking-[0.18em] text-ink3 opacity-60">
            My Library
          </div>
        </Html>
      </group>

      <ExploreStars nodes={nodes} />
      <SerendipityComet />
      {selectedNode && <ExploreNodeControls node={selectedNode} />}
    </>
  );
}
