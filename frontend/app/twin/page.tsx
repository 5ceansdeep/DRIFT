// Taste Twin 단독 우주 — 나와 가장 유사한 1인의 우주를 오버레이 없이 단독 렌더링.
// Gap Node는 #FF0055 강조 + "TARGET DISCOVERY" 라벨로 표기 예정.
// 아직 미구현 (Phase 3 예정). docs/tech-spec.md, 아키텍처 개정 메모 참고.
export default function TwinPage() {
  return (
    <main className="flex h-screen w-screen flex-col items-center justify-center bg-[#E0F2E9] font-mono text-black">
      <div className="text-xl font-bold">[ TASTE TWIN — COMING SOON ]</div>
      <div className="mt-2 text-xs opacity-60">
        취향 쌍둥이 단독 우주 · Gap Node 발굴 (Phase 3)
      </div>
    </main>
  );
}
