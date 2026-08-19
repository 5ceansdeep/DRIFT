import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DRIFT",
  description: "음악 취향 기반 3D 소셜 아카이브 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,300;0,400;0,500;1,400&family=Unbounded:wght@300;400;700;900&family=Noto+Sans+KR:wght@300;400;500;700&family=Black+Han+Sans&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
