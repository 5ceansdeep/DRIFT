"use client";

import { useEffect, useRef, useState } from "react";
import { spatialAudioEngine } from "@/engine/SpatialAudioEngine";
import { iTunesCoverUrl } from "@/lib/itunesImage";
import type { TrackNode } from "@/types";

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface TrackDetailPanelProps {
  node: TrackNode | null;
  onClose: () => void;
  /** Explore의 MATCH %, Twin의 GAP NODE 표시처럼 라우트마다 다른 부가 정보 */
  badge?: React.ReactNode;
}

// 곡 클릭 시 별 대신 화면 정중앙에 뜨는 앨범 커버 + 재생바.
// Galaxy/Explore/Twin 공통 컴포넌트 — 스토어를 직접 구독하지 않고 선택된
// 노드를 props로 받는다(각 스토어가 서로 다르기 때문). 재생 상태는
// AudioController(Canvas 내부, 역시 공통)가 이미 틀어놓은 <audio>를
// SpatialAudioEngine에서 200ms 간격으로 폴링해 읽어온다 — Canvas 내부/외부
// 컴포넌트 간 effect 실행 순서를 보장할 수 없어서 구독 대신 폴링을 쓴다.
export default function TrackDetailPanel({ node, onClose, badge }: TrackDetailPanelProps) {
  const [playback, setPlayback] = useState({ currentTime: 0, duration: 0, paused: true });
  const barRef = useRef<HTMLDivElement>(null);
  const trackId = node?.trackId ?? null;

  useEffect(() => {
    if (!trackId) return;
    const tick = () => {
      const state = spatialAudioEngine.getPlaybackState(trackId);
      if (state) setPlayback(state);
    };
    tick();
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, [trackId]);

  if (!node) return null;

  const progress = playback.duration > 0 ? playback.currentTime / playback.duration : 0;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!barRef.current || playback.duration <= 0 || !trackId) return;
    const rect = barRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    spatialAudioEngine.seek(trackId, ratio * playback.duration);
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
      <div className="drift-panel-in pointer-events-auto flex w-72 flex-col items-center gap-4 border border-black bg-paper/50 p-6 font-mono text-black shadow-lg backdrop-blur-sm">
        <button onClick={onClose} className="self-end text-[11px] opacity-50 hover:opacity-100">
          ✕
        </button>

        {node.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- 외부(iTunes) 원격 이미지, 표시 크기(192px)의 2배 정도로 요청
          <img
            src={iTunesCoverUrl(node.coverUrl, 400)!}
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
          <div className="truncate text-[13px] font-bold">{node.title}</div>
          <div className="truncate text-[12px] opacity-60">{node.artist}</div>
          {badge && <div className="mt-1">{badge}</div>}
        </div>

        <div className="flex w-full items-center gap-3">
          <button
            onClick={() => trackId && spatialAudioEngine.togglePlay(trackId)}
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
