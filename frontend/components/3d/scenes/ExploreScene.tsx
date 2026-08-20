"use client";

import { useEffect } from "react";
import { useExploreStore } from "@/store/useExploreStore";
import { prefetchCovers } from "@/lib/itunesImage";
import ExploreStars from "../objects/ExploreStars";
import SimilarityZoneShells from "../objects/SimilarityZoneShells";
import SerendipityComet from "../objects/SerendipityComet";
import type { TrackNode } from "@/types";

export default function ExploreScene() {
  const setNodes = useExploreStore((state) => state.setNodes);
  const nodeCount = useExploreStore((state) => state.nodes.length);
  const nodes = useExploreStore((state) => state.nodes);

  useEffect(() => {
    if (nodeCount > 0) return;
    fetch("/api/explore")
      .then((res) => res.json())
      .then((data) => {
        setNodes(data.nodes);
        prefetchCovers(data.nodes.map((n: TrackNode) => n.coverUrl));
      })
      .catch((err) => console.error("[ExploreScene] failed to load nodes:", err));
  }, [nodeCount, setNodes]);

  return (
    <>
      <SimilarityZoneShells />
      <ExploreStars nodes={nodes} />
      <SerendipityComet />
    </>
  );
}
