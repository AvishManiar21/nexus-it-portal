"use client";

import { BACKEND_API_URL } from "@/lib/backend";
import { useEffect, useRef, useCallback } from "react";

interface Props {
  productId: number;
  videoUrl: string;
  productName: string;
}

declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

function getSessionId(): string | undefined {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith("visitor_session_id="))
    ?.split("=")[1];
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

function sendEvent(
  productId: number,
  eventType: "start" | "complete",
  watchDurationSeconds: number
) {
  const sessionId = getSessionId();
  console.log("[SEND] sessionId:", sessionId, "eventType:", eventType);
  if (!sessionId) {
    console.log("[SEND] No session ID found, skipping");
    return;
  }
  console.log("[SEND] Making fetch request...");
  fetch(`${BACKEND_API_URL}/events/video-engagement`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sessionId,
      product_id: productId,
      event_type: eventType,
      watch_duration_seconds: Math.round(watchDurationSeconds),
    }),
  }).catch(() => {});
}

export default function DemoVideoTracker({
  productId,
  videoUrl,
  productName,
}: Props) {
  const playerRef = useRef<YT.Player | null>(null);
  const hasStartedRef = useRef(false);
  const watchStartRef = useRef<number | null>(null);
  const totalWatchRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const onStateChange = useCallback(
    (event: YT.OnStateChangeEvent) => {
      console.log("[TRACKER] State changed:", event.data);
      const state = event.data;

      if (state === YT.PlayerState.PLAYING) {
        console.log("[TRACKER] PLAYING detected, hasStarted:", hasStartedRef.current);
        if (!hasStartedRef.current) {
          hasStartedRef.current = true;
          sendEvent(productId, "start", 0);
        }
        watchStartRef.current = Date.now();
      }

      if (
        state === YT.PlayerState.PAUSED ||
        state === YT.PlayerState.ENDED
      ) {
        if (watchStartRef.current) {
          totalWatchRef.current +=
            (Date.now() - watchStartRef.current) / 1000;
          watchStartRef.current = null;
        }
      }

      if (state === YT.PlayerState.ENDED) {
        sendEvent(productId, "complete", totalWatchRef.current);
      }
    },
    [productId]
  );

  useEffect(() => {
    const videoId = extractYouTubeId(videoUrl);
    if (!videoId) return;

    const initPlayer = () => {
      if (!containerRef.current) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: { rel: 0, modestbranding: 1 },
        events: { onStateChange },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      const existingScript = document.querySelector(
        'script[src="https://www.youtube.com/iframe_api"]'
      );
      if (!existingScript) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (watchStartRef.current) {
        totalWatchRef.current +=
          (Date.now() - watchStartRef.current) / 1000;
        watchStartRef.current = null;
      }
      if (totalWatchRef.current > 0 && hasStartedRef.current) {
        sendEvent(productId, "complete", totalWatchRef.current);
      }
      playerRef.current?.destroy();
    };
  }, [videoUrl, onStateChange, productId]);

  const videoId = extractYouTubeId(videoUrl);

  if (!videoId) {
    return (
      <iframe
        src={videoUrl}
        className="w-full h-full"
        allowFullScreen
        loading="lazy"
        title={`${productName} demo video`}
      />
    );
  }

  return <div ref={containerRef} className="w-full h-full" />;
}
