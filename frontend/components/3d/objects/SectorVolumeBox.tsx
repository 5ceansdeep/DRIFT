"use client";

import { Html } from "@react-three/drei";
import { SavedSector } from "@/types";

interface Props {
  sector: SavedSector;
}

export default function SectorVolumeBox({ sector }: Props) {
  const { min, max } = sector.bounds;
  const size: [number, number, number] = [
    Math.max(max[0] - min[0], 0.01),
    Math.max(max[1] - min[1], 0.01),
    Math.max(max[2] - min[2], 0.01),
  ];
  const center: [number, number, number] = [
    (min[0] + max[0]) / 2,
    (min[1] + max[1]) / 2,
    (min[2] + max[2]) / 2,
  ];

  return (
    <group position={center}>
      <mesh>
        <boxGeometry args={size} />
        <meshBasicMaterial color="#000000" wireframe transparent opacity={0.3} />
      </mesh>

      <Html position={[0, size[1] / 2 + 2, 0]} center>
        <div className="whitespace-nowrap rounded border border-black bg-[#E0F2E9]/90 px-2 py-1 font-mono text-[10px] tracking-wider text-black shadow-md backdrop-blur-sm">
          [{sector.name.toUpperCase()}] : {sector.trackIds.length} TRACKS
        </div>
      </Html>
    </group>
  );
}
