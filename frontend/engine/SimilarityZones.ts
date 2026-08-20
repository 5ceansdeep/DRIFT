import * as THREE from "three";

// 코사인 유사도(-1~1) → 3D 방사형 좌표/구역 매핑.
// app/api/explore/route.ts가 서버에서 이미 이 공식으로 position3D를 생성하므로,
// 여기서는 "반지름 상수"와 "구역 판별/색상"만 클라이언트 쪽에서 재사용한다.
export const MAX_RADIUS = 130;
const HIGH_THRESHOLD = 1 / 3; // 유사도 > 1/3 → HIGH(친숙)
const LOW_THRESHOLD = -1 / 3; // 유사도 < -1/3 → LOW(대척점/워프 존)

export type SimilarityZone = "HIGH" | "MID" | "LOW";

export function radiusForSimilarity(similarity: number): number {
  return (1 - similarity) * 0.5 * MAX_RADIUS;
}

export function zoneForSimilarity(similarity: number): SimilarityZone {
  if (similarity > HIGH_THRESHOLD) return "HIGH";
  if (similarity < LOW_THRESHOLD) return "LOW";
  return "MID";
}

export const ZONE_BOUNDARY_RADII = {
  highMid: radiusForSimilarity(HIGH_THRESHOLD),
  midLow: radiusForSimilarity(LOW_THRESHOLD),
} as const;

const ZONE_COLORS: Record<SimilarityZone, THREE.Color> = {
  HIGH: new THREE.Color("#00F0FF"),
  MID: new THREE.Color("#FFC400"),
  LOW: new THREE.Color("#8800FF"),
};

export function colorForSimilarity(similarity: number): THREE.Color {
  return ZONE_COLORS[zoneForSimilarity(similarity)];
}

// 세렌디피티 혜성이 순찰하는 "필터 버블 경계" 구간 — HIGH/MID 경계 바로 바깥.
export const COMET_RADIUS_RANGE = {
  min: radiusForSimilarity(0.5),
  max: radiusForSimilarity(0.3),
} as const;
