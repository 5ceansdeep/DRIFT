import * as THREE from "three";
import { TrackNode } from "@/types";

export function getTracksIn3DVolume(
  nodes: TrackNode[],
  minBounds: [number, number, number],
  maxBounds: [number, number, number]
): TrackNode[] {
  const boundingBox = new THREE.Box3(
    new THREE.Vector3(...minBounds),
    new THREE.Vector3(...maxBounds)
  );

  return nodes.filter((node) => {
    const point = new THREE.Vector3(...node.position3D);
    return boundingBox.containsPoint(point);
  });
}
