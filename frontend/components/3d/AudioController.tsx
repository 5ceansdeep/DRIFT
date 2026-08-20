"use client";

import { useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGalaxyStore } from "@/store/useGalaxyStore";
import { spatialAudioEngine } from "@/engine/SpatialAudioEngine";

// Canvas 내부에 렌더링만 되고 화면엔 아무것도 그리지 않는 오디오 전담 컴포넌트.
// selectedTrackId가 바뀌면 해당 트랙을 HRTF 패닝으로 재생하고,
// 매 프레임 카메라 위치를 오디오 리스너 좌표에 반영한다.
export default function AudioController() {
  const selectedTrackId = useGalaxyStore((state) => state.selectedTrackId);
  const nodes = useGalaxyStore((state) => state.nodes);

  useEffect(() => {
    if (!selectedTrackId) return;
    const node = nodes.find((n) => n.trackId === selectedTrackId);
    if (!node) return;

    spatialAudioEngine.registerAndPlay(node.trackId, node.audioUrl, node.position3D);

    return () => {
      spatialAudioEngine.stop(node.trackId);
    };
  }, [selectedTrackId, nodes]);

  useFrame(({ camera }) => {
    spatialAudioEngine.updateListenerPosition([
      camera.position.x,
      camera.position.y,
      camera.position.z,
    ]);
  });

  return null;
}
