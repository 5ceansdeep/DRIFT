# DRIFT

음악 취향 기반 3D 소셜 아카이브 플랫폼.

- `backend/` — NestJS + Prisma + PostgreSQL API 서버
- `frontend/` — Next.js 프론트엔드

## 빠른 시작

```bash
git clone https://github.com/5ceansdeep/DRIFT.git
cd DRIFT

cd backend && npm install && npm run dev     # Postgres 설치 필요 없음, 알아서 DB 뜸
```

```bash
cd frontend && npm install && npm run dev
```

- 백엔드: `http://localhost:3001` (Swagger: `http://localhost:3001/api-docs`)
- 프론트엔드: `http://localhost:3000`

`backend`는 `npm run dev` 실행 시 `predev` 훅이 `prisma dev`로 로컬 Postgres를 자동으로
띄우고 `.env`를 생성한 뒤 마이그레이션까지 적용합니다. 자세한 내용은
[backend/README.md](backend/README.md) 참고.

## 기술 스택

- **Backend**: NestJS, Prisma 7, PostgreSQL, JWT
- **Frontend**: Next.js, React, Three.js / React Three Fiber
