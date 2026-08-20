"use client";

import dynamic from "next/dynamic";

// Taste Twin 단독 우주 — 나와 가장 유사한 1인의 우주를 오버레이 없이 단독 렌더링.
// Gap Node는 #FF0055 강조 + "TARGET DISCOVERY" 라벨로 표기 (아키텍처 개정 4번).
const TwinCanvasContainer = dynamic(() => import("@/components/3d/TwinCanvasContainer"), {
  ssr: false,
  loading: () => (
    <main className="flex h-screen w-screen items-center justify-center bg-[#E0F2E9] font-mono text-black">
      LOADING TWIN UNIVERSE...
    </main>
  ),
});

export default function TwinPage() {
  return (
    <main className="h-screen w-screen bg-[#E0F2E9]">
      <TwinCanvasContainer />
    </main>
  );
}
