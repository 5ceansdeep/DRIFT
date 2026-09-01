"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import { useExploreStore } from "@/store/useExploreStore";
import { iTunesCoverUrl } from "@/lib/itunesImage";
import type { TrackNode } from "@/types";

const INK = "#0a0f0c";
const CARD_SIZE = 5;
const FRAME_PAD = 0.7; // 사진 주변에 남는 잉크 테두리 두께
const HOVER_SCALE = 1.5;
const SELECT_SCALE = 2.8;
const SCALE_LAMBDA = 10; // damp 계수 — 클수록 빠르게 반응

// 커버 URL을 three.js 텍스처로 로드하는 훅. drei의 useTexture(Suspense 기반)
// 대신 직접 로더를 써서, 실패(네트워크 오류·CORS 등)해도 앱 전체가 죽지
// 않고 그냥 커버 없는 카드(잉크 테두리만)로 조용히 폴백하게 한다.
function useCoverTexture(url: string | null): THREE.Texture | null {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!url) {
      // url이 없어졌을 때(커버 없는 곡으로 바뀜)만 리셋 — 로더 콜백과 같은
      // "외부 리소스 로딩 결과 반영" 성격이라 동기 setState를 의도적으로 씀.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTexture(null);
      return;
    }
    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      (tex) => {
        if (cancelled) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        setTexture(tex);
      },
      undefined,
      () => {
        if (!cancelled) setTexture(null);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [url]);

  return texture;
}

// 노드 하나 = 실제 앨범 커버 사진이 붙은 카드. 항상 카메라를 바라보도록
// Billboard로 감싸고, 호버/선택 시 부드럽게 확대된다. 노드마다 텍스처가
// 달라서(InstancedMesh는 인스턴스별 텍스처를 못 씀) 개별 메시로 렌더링한다 —
// Explore 후보곡 수(수십 개)에선 성능 문제가 없다.
function TrackCard({ node }: { node: TrackNode }) {
  const groupRef = useRef<THREE.Group>(null!);
  const scaleRef = useRef(1);
  const [hovered, setHovered] = useState(false);

  const isSelected = useExploreStore((s) => s.selectedTrackId === node.trackId);
  const setHoveredTrackId = useExploreStore((s) => s.setHoveredTrackId);
  const setSelectedTrackId = useExploreStore((s) => s.setSelectedTrackId);

  const coverUrl = node.coverUrl ? iTunesCoverUrl(node.coverUrl, 200) : null;
  const cover = useCoverTexture(coverUrl);

  useFrame((_, delta) => {
    const target = isSelected ? SELECT_SCALE : hovered ? HOVER_SCALE : 1;
    if (Math.abs(scaleRef.current - target) < 0.002) {
      scaleRef.current = target;
    } else {
      scaleRef.current = THREE.MathUtils.damp(scaleRef.current, target, SCALE_LAMBDA, delta);
    }
    groupRef.current?.scale.setScalar(scaleRef.current);
  });

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    setHoveredTrackId(node.trackId);
  };
  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(false);
    setHoveredTrackId(null);
  };
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setSelectedTrackId(node.trackId);
  };

  return (
    <Billboard position={node.position3D}>
      <group
        ref={groupRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        {/* 잉크 프레임 — 커버가 없으면 이 사각형만 보여 기존 마커와 동일하게 동작 */}
        <mesh>
          <planeGeometry args={[CARD_SIZE + FRAME_PAD, CARD_SIZE + FRAME_PAD]} />
          <meshBasicMaterial color={INK} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
        {cover && (
          <mesh position={[0, 0, 0.05]}>
            <planeGeometry args={[CARD_SIZE, CARD_SIZE]} />
            <meshBasicMaterial map={cover} toneMapped={false} side={THREE.DoubleSide} />
          </mesh>
        )}
      </group>
    </Billboard>
  );
}

export default function ExploreStars({ nodes }: { nodes: TrackNode[] }) {
  return (
    <>
      {nodes.map((node) => (
        <TrackCard key={node.trackId} node={node} />
      ))}
    </>
  );
}
