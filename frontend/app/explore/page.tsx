"use client";

import dynamic from "next/dynamic";

// 탐험 우주 — 코사인 유사도 High/Mid/Low 존 분리 + 세렌디피티 혜성 +
// 대척점 블랙홀 워프. docs/tech-spec.md 3.6, docs/product-report.md 참고.
const ExploreCanvasContainer = dynamic(
  () => import("@/components/3d/ExploreCanvasContainer"),
  {
    ssr: false,
    loading: () => (
      <main className="flex h-screen w-screen items-center justify-center bg-[#c8f0d8] font-mono text-black">
        LOADING EXPLORE UNIVERSE...
      </main>
    ),
  }
);

export default function ExplorePage() {
  return (
    <main className="h-screen w-screen bg-[#c8f0d8]">
      <ExploreCanvasContainer />
    </main>
  );
}
