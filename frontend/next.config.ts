import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // 저장소 루트에 concurrently용 package.json/package-lock.json이 있어서
  // Next.js(Turbopack, 16부터 기본 번들러)가 워크스페이스 루트를 그쪽으로
  // 잘못 추론해 tailwindcss 등 node_modules 해석이 깨지는 문제가 있었다.
  // frontend/를 루트로 명시해서 고정.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
