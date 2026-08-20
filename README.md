# DRIFT

음악 취향 기반 3D 소셜 아카이브 플랫폼.

- `backend/` — NestJS + Prisma + PostgreSQL API 서버
- `frontend/` — Next.js 프론트엔드

## 빠른 시작

```bash
git clone https://github.com/5ceansdeep/DRIFT.git
cd DRIFT

npm install                       # 루트(concurrently) + backend + frontend 한 번에
cd backend && npm install && cd ../frontend && npm install && cd ..

npm run dev                       # 백엔드+프론트엔드 동시 기동 (한 터미널)
```

- 백엔드: `http://localhost:3001` (Swagger: `http://localhost:3001/api-docs`)
- 프론트엔드: `http://localhost:3000`

`backend`는 `npm run dev` 실행 시 `predev` 훅이 `prisma dev`로 로컬 Postgres를 자동으로
띄우고 `.env`를 생성한 뒤 마이그레이션까지 적용합니다. 자세한 내용은
[backend/README.md](backend/README.md) 참고.

각자 따로 띄우고 싶으면 `cd backend && npm run dev` / `cd frontend && npm run dev`를
별도 터미널에서 실행해도 됩니다.

## 기술 스택

- **Backend**: NestJS, Prisma 7, PostgreSQL, JWT
- **Frontend**: Next.js, React, Three.js / React Three Fiber

## 문서

- [docs/product-report.md](docs/product-report.md) — 제품/디자인 종합 보고서 (컨셉, 3대 뷰 체계, 핵심 기능, 로드맵)
- [docs/tech-spec.md](docs/tech-spec.md) — 프론트엔드 상세 개발 명세 (아키텍처, 컴포넌트 구조, 엔진별 예시 코드, 마일스톤 체크리스트)
