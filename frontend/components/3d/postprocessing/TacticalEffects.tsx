"use client";

import { EffectComposer, ColorAverage } from "@react-three/postprocessing";
import { useExploreStore } from "@/store/useExploreStore";

// 블랙홀 워프 진입 시에만 흑백(색상 평균) 반전 효과를 켠다.
// 평소엔 EffectComposer 자체를 렌더링하지 않아 성능 비용이 없다.
export default function TacticalEffects() {
  const isWarping = useExploreStore((state) => state.isWarping);
  if (!isWarping) return null;
  return (
    <EffectComposer>
      <ColorAverage />
    </EffectComposer>
  );
}
