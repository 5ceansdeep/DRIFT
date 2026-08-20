import { NextResponse } from "next/server";
import { SavedSector } from "@/types";

// Phase 2: 서버 프로세스 메모리에만 저장하는 임시 저장소.
// 서버 재시작하면 초기화됨 — 실 서비스에서는 backend(NestJS+Prisma) 또는
// DB 연동 Route Handler로 교체 필요.
const sectors: SavedSector[] = [];

export async function GET() {
  return NextResponse.json({ sectors });
}

export async function POST(request: Request) {
  const body = (await request.json()) as SavedSector;
  if (!body?.sectorId || !body?.name || !body?.bounds) {
    return NextResponse.json({ error: "invalid sector payload" }, { status: 400 });
  }
  sectors.push(body);
  return NextResponse.json({ sector: body }, { status: 201 });
}
