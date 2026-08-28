import * as THREE from "three";
import { SavedSector } from "@/types";

export interface ClusterTarget {
  sectorId: string;
  position: THREE.Vector3;
}

/**
 * 저장된 섹터들의 trackId → (자기 섹터 박스 안의 결정론적 위치) 매핑을 만든다.
 * 섹터 안 트랙 개수에 맞춰 대략 정육면체形 격자로 나눠 배치한다.
 * SECTOR_MODE(isClusterMode) 켜졌을 때 InstancedStars가 이 위치로 lerp한다.
 */
export function buildClusterTargets(sectors: SavedSector[]): Map<string, ClusterTarget> {
  const targets = new Map<string, ClusterTarget>();

  sectors.forEach((sector) => {
    const { min, max } = sector.bounds;
    const center = new THREE.Vector3(
      (min[0] + max[0]) / 2,
      (min[1] + max[1]) / 2,
      (min[2] + max[2]) / 2
    );
    const size = new THREE.Vector3(
      Math.max(max[0] - min[0], 1),
      Math.max(max[1] - min[1], 1),
      Math.max(max[2] - min[2], 1)
    );

    const count = sector.trackIds.length;
    const cols = Math.max(1, Math.ceil(Math.cbrt(count)));

    sector.trackIds.forEach((trackId, i) => {
      const ix = i % cols;
      const iy = Math.floor(i / cols) % cols;
      const iz = Math.floor(i / (cols * cols));
      const fx = cols > 1 ? ix / (cols - 1) - 0.5 : 0;
      const fy = cols > 1 ? iy / (cols - 1) - 0.5 : 0;
      const fz = cols > 1 ? iz / (cols - 1) - 0.5 : 0;

      targets.set(trackId, {
        sectorId: sector.sectorId,
        position: new THREE.Vector3(
          center.x + fx * size.x * 0.8,
          center.y + fy * size.y * 0.8,
          center.z + fz * size.z * 0.8
        ),
      });
    });
  });

  return targets;
}
