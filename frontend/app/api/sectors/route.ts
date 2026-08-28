import { NextResponse } from "next/server";
import { fetchSectors, createSector } from "@/lib/driftBackend";

// 실 데이터 연동 — backend GET/POST /sectors(DB 영속, 유저별 소유)로 프록시.
// 예전엔 서버 프로세스 메모리 배열이라 재시작하면 다 날아갔음.
function getOverrideToken(request: Request): string | undefined {
  const auth = request.headers.get("authorization");
  return auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;
}

export async function GET(request: Request) {
  const overrideToken = getOverrideToken(request);
  try {
    const sectors = await fetchSectors(overrideToken);
    return NextResponse.json({ sectors });
  } catch (err) {
    console.warn("[api/sectors] backend 연동 실패, 빈 목록 반환:", err);
    return NextResponse.json({ sectors: [] });
  }
}

export async function POST(request: Request) {
  const overrideToken = getOverrideToken(request);
  const body = await request.json();

  if (!body?.name || !Array.isArray(body?.boundsMin) || !Array.isArray(body?.boundsMax) || !Array.isArray(body?.trackIds)) {
    return NextResponse.json({ error: "invalid sector payload" }, { status: 400 });
  }

  try {
    const sector = await createSector(
      {
        name: body.name,
        boundsMin: body.boundsMin,
        boundsMax: body.boundsMax,
        trackIds: body.trackIds,
      },
      overrideToken
    );
    return NextResponse.json({ sector }, { status: 201 });
  } catch (err) {
    console.error("[api/sectors] 생성 실패:", err);
    return NextResponse.json({ error: "구역 저장 실패" }, { status: 502 });
  }
}
