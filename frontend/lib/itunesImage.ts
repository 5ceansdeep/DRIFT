/**
 * DB에는 고화질(600x600) iTunes 아트워크 URL이 저장돼 있는데, 작은 썸네일
 * 자리에도 그 원본을 그대로 받아오면 불필요하게 느리다. iTunes CDN은
 * URL 끝의 "600x600bb" 같은 크기 세그먼트를 바꿔주면 그 크기로 즉석
 * 서빙해주므로, 실제 표시 크기에 맞는 작은 버전을 요청해 로딩을 가볍게 한다.
 */
export function iTunesCoverUrl(
  url: string | null | undefined,
  size: number
): string | null {
  if (!url) return null;
  return url.replace(/\d+x\d+bb(\.\w+)$/, `${size}x${size}bb$1`);
}

/**
 * 노드 목록이 로드되자마자 호버 썸네일 크기로 미리 브라우저 캐시에 데워둔다.
 * 실제 호버 시점엔 이미 캐시에 있어서 지연 없이 뜬다 — 클릭 안 될 수도 있는
 * 큰 이미지(TrackDetailPanel용)는 여기서 미리 받지 않는다 (낭비 방지).
 */
export function prefetchCovers(
  urls: (string | null | undefined)[],
  size = 80
): void {
  if (typeof window === "undefined") return;
  const unique = new Set(urls.filter((u): u is string => Boolean(u)));
  unique.forEach((url) => {
    const img = new Image();
    img.src = iTunesCoverUrl(url, size)!;
  });
}
