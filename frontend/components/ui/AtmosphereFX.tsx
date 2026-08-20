// 랜딩 목업의 아날로그 텍스처(그레인/스캔라인/레지 마크)를 3D 라우트에도
// 얹어 톤을 통일한다. 순수 장식이라 pointer-events 없음.
export default function AtmosphereFX() {
  return (
    <>
      <div className="drift-grain" />
      <div className="drift-scanline" />
      <div className="drift-reg drift-reg-tl" />
      <div className="drift-reg drift-reg-tr" />
      <div className="drift-reg drift-reg-bl" />
      <div className="drift-reg drift-reg-br" />
    </>
  );
}
