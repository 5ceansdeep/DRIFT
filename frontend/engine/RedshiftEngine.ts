import * as THREE from "three";

const HALF_LIFE_DAYS = 30; // 30일 반감기
const LAMBDA = Math.LN2 / HALF_LIFE_DAYS;

export interface RedshiftResult {
  position: THREE.Vector3;
  color: THREE.Color;
  scale: number;
}

/**
 * 마지막 청취 시점 기준 반감기 함수를 적용해 위치/색상/크기를 계산한다.
 * decayFactor: 1.0(방금 재생) → 0.0(오래 방치).
 * - 색상: 청백색(#00F0FF, 활성) → 붉은색(#FF2200, 방치) 보간
 * - 위치: 오래될수록 원점 기준 외곽으로 최대 1.4배 밀려남
 * - 크기: 오래될수록 0.6배까지 축소
 */
export function calculateRedshiftColorAndPosition(
  basePosition: THREE.Vector3,
  lastPlayedAtIso: string,
  nowDate: Date = new Date()
): RedshiftResult {
  const lastPlayed = new Date(lastPlayedAtIso);
  const diffDays = Math.max(
    0,
    (nowDate.getTime() - lastPlayed.getTime()) / (1000 * 3600 * 24)
  );

  const decayFactor = Math.exp(-LAMBDA * diffDays);

  const activeColor = new THREE.Color("#00F0FF");
  const agedColor = new THREE.Color("#FF2200");
  const finalColor = agedColor.clone().lerp(activeColor, decayFactor);

  const driftFactor = 1 + (1 - decayFactor) * 0.4;
  const finalPosition = basePosition.clone().multiplyScalar(driftFactor);

  const finalScale = 0.6 + decayFactor * 0.6;

  return { position: finalPosition, color: finalColor, scale: finalScale };
}
