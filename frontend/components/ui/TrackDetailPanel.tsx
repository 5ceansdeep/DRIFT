"use client";

import { useEffect, useRef, useState } from "react";
import { useGalaxyStore } from "@/store/useGalaxyStore";
import { spatialAudioEngine } from "@/engine/SpatialAudioEngine";
import { iTunesCoverUrl } from "@/lib/itunesImage";

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// 곡 클릭 시 별 대신 화면 정중앙에 뜨는 앨범 커버 + 재생바.
// AudioController가 이미 재생 중인 <audio>를 SpatialAudioEngine에서 가져와
// 200ms 간격으로 진행률만 읽어온다 (컴포넌트 마운트 순서에 의존하지 않는
// 폴링 방식 — Canvas 내부/외부 컴포넌트 간 effect 순서를 보장할 수 없어서).
export default function TrackDetailPanel() {
  const selectedTrackId = useGalaxyStore((state) => state.selectedTrackId);
  const setSelectedTrackId = useGalaxyStore((state) => state.setSelectedTrackId);
  const nodes = useGalaxyStore((state) => state.nodes);
  const selected = nodes.find((n) => n.trackId === selectedTrackId);

  const [playback, setPlayback] = useState({ currentTime: 0, duration: 0, paused: true });
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedTrackId) return;
    const tick = () => {
      const state = spatialAudioEngine.getPlaybackState(selectedTrackId);
      if (state) setPlayback(state);
    };
    tick();
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, [selectedTrackId]);

  if (!selected) return null;

  const progress = playback.duration > 0 ? playback.currentTime / playback.duration : 0;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!barRef.current || playback.duration <= 0 || !selectedTrackId) return;
    const rect = barRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    spatialAudioEngine.seek(selectedTrackId, ratio * playback.duration);
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
      <div className="pointer-events-auto flex w-72 flex-col items-center gap-4 border border-black bg-[#E0F2E9]/50 p-6 font-mono text-black shadow-lg backdrop-blur-sm">
        <button
          onClick={() => setSelectedTrackId(null)}
          className="self-end text-[11px] opacity-50 hover:opacity-100"
        >
          ✕
        </button>

        {selected.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- 외부(iTunes) 원격 이미지, 표시 크기(192px)의 2배 정도로 요청
          <img
            src={iTunesCoverUrl(selected.coverUrl, 400)!}
            alt=""
            decoding="async"
            className="h-48 w-48 border border-black object-cover"
          />
        ) : (
          <div className="flex h-48 w-48 items-center justify-center border border-black text-2xl opacity-20">
            ♩
          </div>
        )}

        <div className="w-full text-center">
          <div className="truncate text-[13px] font-bold">{selected.title}</div>
          <div className="truncate text-[12px] opacity-60">{selected.artist}</div>
        </div>

        <div className="flex w-full items-center gap-3">
          <button
            onClick={() => selectedTrackId && spatialAudioEngine.togglePlay(selectedTrackId)}
            className="flex h-7 w-7 shrink-0 items-center justify-center border border-black text-[11px]"
          >
            {playback.paused ? "▶" : "❚❚"}
          </button>

          <div
            ref={barRef}
            onClick={handleSeek}
            className="relative h-1 flex-1 cursor-pointer bg-black/15"
          >
            <div
              className="absolute inset-y-0 left-0 bg-black"
              style={{ width: `${progress * 100}%` }}
            />
          </div>

          <div className="w-16 shrink-0 text-right text-[10px] opacity-50">
            {formatTime(playback.currentTime)} / {formatTime(playback.duration)}
          </div>
        </div>
      </div>
    </div>
  );
}
