"use client";

import { useState } from "react";
import { getToken } from "@/lib/authClient";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";

interface SearchResult {
  title: string;
  artist: string;
  coverUrl: string | null;
  previewUrl: string | null;
}

// 로그인한 유저가 곡을 검색해서 자기 아카이브에 담는 최소 UI.
// 로그인 전이면 아예 렌더링하지 않는다 (데모 계정 폴백으로 구경만 가능한 상태).
export default function ArchiveSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [archivedKeys, setArchivedKeys] = useState<Set<string>>(new Set());
  const [archivingKey, setArchivingKey] = useState<string | null>(null);

  const token = getToken();
  if (!token) return null;

  const handleSearch = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/songs/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(Array.isArray(data) ? data.slice(0, 8) : []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (r: SearchResult) => {
    const key = `${r.title}::${r.artist}`;
    setArchivingKey(key);
    try {
      const res = await fetch(`${BACKEND_URL}/songs/archive`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: r.title,
          artist: r.artist,
          coverUrl: r.coverUrl,
          previewUrl: r.previewUrl,
          source: "search",
        }),
      });
      if (res.ok) {
        setArchivedKeys((prev) => new Set(prev).add(key));
        // 새로 담은 곡이 실제로 우주에 나타나게 좌표 배정까지 기다렸다가 새로고침.
        setTimeout(() => window.location.reload(), 900);
      }
    } finally {
      setArchivingKey(null);
    }
  };

  return (
    <div className="pointer-events-auto absolute left-4 bottom-4 z-20 flex flex-col items-start gap-1 font-mono text-[11px]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="border border-black bg-[#c8f0d8]/80 px-3 py-1.5 text-black hover:bg-black hover:text-[#c8f0d8]"
      >
        {open ? "✕" : "+ 곡 담기"}
      </button>

      {open && (
        <div className="flex w-72 flex-col gap-2 border border-black bg-[#c8f0d8]/90 p-3 text-black">
          <div className="flex gap-1">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="곡·아티스트 검색"
              className="min-w-0 flex-1 border border-black bg-transparent px-2 py-1 outline-none"
            />
            <button onClick={handleSearch} className="border border-black px-2">
              →
            </button>
          </div>

          <div className="flex max-h-56 flex-col gap-1 overflow-y-auto">
            {loading && <div className="opacity-50">···</div>}
            {!loading && results.length === 0 && (
              <div className="opacity-40">검색 결과가 여기 뜹니다</div>
            )}
            {results.map((r) => {
              const key = `${r.title}::${r.artist}`;
              const archived = archivedKeys.has(key);
              return (
                <div key={key} className="flex items-center gap-2 border-b border-black/10 pb-1">
                  <div className="min-w-0 flex-1 truncate">
                    {r.title} — {r.artist}
                  </div>
                  <button
                    onClick={() => handleArchive(r)}
                    disabled={archived || archivingKey === key}
                    className="shrink-0 border border-black px-1.5 disabled:opacity-30"
                  >
                    {archived ? "✓" : archivingKey === key ? "···" : "+"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
