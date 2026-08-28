"use client";

// 브라우저 전용 인증 헬퍼. 랜딩(drift-app.js, 바닐라 JS)과 React 3D 라우트가
// 같은 localStorage 키를 공유해서 로그인 상태를 주고받는다.
const TOKEN_KEY = "drift_token";
const USERNAME_KEY = "drift_username";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUsername(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USERNAME_KEY);
}

export function isLoggedIn(): boolean {
  return getToken() !== null;
}

export function logout(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
}

/** /api/* Route Handler 호출 시 붙일 헤더 — 로그인 안 했으면 빈 객체(서버가 데모 계정으로 폴백). */
export function authHeader(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface AuthResponse {
  accessToken: string;
  user: { id: string; email: string; username: string };
}

async function callAuth(path: string, body: object): Promise<AuthResponse> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? "요청 실패");

  localStorage.setItem(TOKEN_KEY, data.accessToken);
  localStorage.setItem(USERNAME_KEY, data.user.username);
  return data;
}

export function signup(email: string, username: string, password: string) {
  return callAuth("/auth/signup", { email, username, password });
}

export function login(email: string, password: string) {
  return callAuth("/auth/login", { email, password });
}
