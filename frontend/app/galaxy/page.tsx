"use client";

import dynamic from "next/dynamic";

const CanvasContainer = dynamic(() => import("@/components/3d/CanvasContainer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-paper font-mono text-black">
      <div className="animate-pulse text-xl font-bold">[ DRIFT SYSTEM INITIALIZING ]</div>
      <div className="mt-2 text-xs opacity-60">CALIBRATING 80D TO 3D TOPOLOGY...</div>
    </div>
  ),
});

export default function GalaxyPage() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-paper">
      <CanvasContainer />
    </main>
  );
}
