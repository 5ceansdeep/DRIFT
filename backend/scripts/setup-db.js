#!/usr/bin/env node
/**
 * 로컬 개발용 DB 부트스트랩 스크립트.
 *
 * - backend/.env 가 없으면 .env.example 기반으로 생성 (JWT_SECRET 자동 생성)
 * - `prisma dev` 로 로컬 Postgres 서버를 백그라운드로 띄움 (설치 불필요, Prisma CLI가 관리)
 * - 발급된 DATABASE_URL 을 .env 에 반영
 * - `prisma migrate deploy` 로 스키마 적용
 *
 * 사용법: node scripts/setup-db.js  (또는 npm run db:start)
 * `npm run dev` 실행 전에 predev 훅으로 자동 실행됨.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const ENV_PATH = path.join(ROOT, ".env");
const ENV_EXAMPLE_PATH = path.join(ROOT, ".env.example");
// .bin/prisma(.cmd) 래퍼 대신 CLI 진입점을 node로 직접 실행 — 플랫폼 무관, 셸 불필요.
const PRISMA_CLI = require.resolve("prisma/build/index.js", { paths: [ROOT] });

function runPrisma(args, options = {}) {
  return execFileSync(process.execPath, [PRISMA_CLI, ...args], {
    cwd: ROOT,
    ...options,
  });
}

function readEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  const env = {};
  for (const line of lines) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

function writeEnv(filePath, env) {
  const body =
    Object.entries(env)
      .map(([k, v]) => `${k}=${v}`)
      .join("\n") + "\n";
  fs.writeFileSync(filePath, body, "utf8");
}

// 1. .env 준비 (없으면 .env.example + 자동 생성 JWT_SECRET 로 생성)
let env = readEnv(ENV_PATH);
if (Object.keys(env).length === 0) {
  console.log("[setup-db] .env 가 없어 새로 생성합니다.");
  env = readEnv(ENV_EXAMPLE_PATH);
}
if (!env.JWT_SECRET) {
  env.JWT_SECRET = crypto.randomBytes(32).toString("hex");
  console.log("[setup-db] JWT_SECRET 자동 생성");
}
if (!env.Lastfm_API_KEY) {
  env.Lastfm_API_KEY = "";
}

// 2. prisma dev 로 로컬 DB 서버 기동 (이미 떠있으면 그대로 사용)
console.log("[setup-db] prisma dev 로컬 DB 서버 확인/기동 중...");
let stdout;
try {
  stdout = runPrisma(["dev", "--detach"], { encoding: "utf8" });
} catch (err) {
  console.error("[setup-db] prisma dev 실행 실패:", err.message);
  process.exit(1);
}
const match = stdout.match(/postgres:\/\/[^\s]+/);
if (!match) {
  console.error("[setup-db] prisma dev 출력에서 접속 URL을 찾지 못했습니다:\n" + stdout);
  process.exit(1);
}
env.DATABASE_URL = `"${match[0]}"`;
writeEnv(ENV_PATH, env);
console.log("[setup-db] .env 에 DATABASE_URL 반영 완료:", match[0]);

// 3. 마이그레이션 적용
console.log("[setup-db] prisma migrate deploy 실행 중...");
try {
  runPrisma(["migrate", "deploy"], { stdio: "inherit" });
} catch (err) {
  console.error("[setup-db] 마이그레이션 실패:", err.message);
  process.exit(1);
}

console.log("[setup-db] 완료 — 로컬 DB 준비됨.");
