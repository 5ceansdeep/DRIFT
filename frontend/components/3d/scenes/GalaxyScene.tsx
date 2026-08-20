"use client";

import { useEffect } from "react";
import { useGalaxyStore } from "@/store/useGalaxyStore";
import InstancedStars from "../objects/InstancedStars";

export default function GalaxyScene() {
  const setNodes = useGalaxyStore((state) => state.setNodes);
  const nodeCount = useGalaxyStore((state) => state.nodes.length);

  useEffect(() => {
    if (nodeCount > 0) return;
    fetch("/api/galaxy")
      .then((res) => res.json())
      .then((data) => setNodes(data.nodes))
      .catch((err) => console.error("[GalaxyScene] failed to load nodes:", err));
  }, [nodeCount, setNodes]);

  return <InstancedStars />;
}
