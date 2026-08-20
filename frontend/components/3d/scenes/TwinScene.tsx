"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { useTwinStore } from "@/store/useTwinStore";
import { calculateRedshiftColorAndPosition } from "@/engine/RedshiftEngine";
import { authHeader } from "@/lib/authClient";
import { prefetchCovers } from "@/lib/itunesImage";
import TwinStars from "../objects/TwinStars";
import type { TrackNode } from "@/types";

export default function TwinScene() {
  const twinData = useTwinStore((state) => state.twinData);
  const setTwinData = useTwinStore((state) => state.setTwinData);

  useEffect(() => {
    if (twinData) return;
    fetch("/api/twin", { headers: authHeader() })
      .then((res) => res.json())
      .then((data) => {
        setTwinData(data);
        prefetchCovers(data.twinNodes.map((n: TrackNode) => n.coverUrl));
      })
      .catch((err) => console.error("[TwinScene] failed to load twin data:", err));
  }, [twinData, setTwinData]);

  const gapNodes = useMemo(() => {
    if (!twinData) return [];
    return twinData.twinNodes.filter((n) => n.isGapNode);
  }, [twinData]);

  if (!twinData) return null;

  return (
    <>
      <TwinStars nodes={twinData.twinNodes} />
      {gapNodes.map((node) => {
        const basePos = new THREE.Vector3(...node.position3D);
        const { position } = calculateRedshiftColorAndPosition(basePos, node.lastPlayedAt);
        return (
          <Html
            key={node.trackId}
            position={position}
            center
            distanceFactor={40}
            style={{ pointerEvents: "none" }}
          >
            <div className="whitespace-nowrap font-mono text-[10px] font-bold tracking-widest text-[#FF0055]">
              ▲ TARGET DISCOVERY
            </div>
          </Html>
        );
      })}
    </>
  );
}
