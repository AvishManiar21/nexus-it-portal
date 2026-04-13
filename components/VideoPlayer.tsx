"use client";

import { useEffect, useRef } from "react";

interface VideoPlayerProps {
  videoUrl: string;
  productName: string;
  productId: number;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function VideoPlayer({
  videoUrl,
  productName,
  productId,
}: VideoPlayerProps) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasTrackedStart = useRef(false);
  const hasTrackedCompletion = useRef(false);
  const startTime = useRef<number>(0);
  const totalWatchedTime = useRef<number>(0);

  // Extract video ID from YouTube URL
  const getYouTubeVideoId = (url: string): string | null => {
    const match = url.match(
      /(?:youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]+)/
    );
    return match ? match[1] : null;
  };

  // Get or create session ID
  const getSessionId = (): string => {
    let sessionId = localStorage.getItem("session_id");
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("session_id", sessionId);
    }
    return sessionId;
  };

  // Track demo events silently
  const trackDemoEvent = async (
    action: string,
    secondsWatched?: number
  ) => {
    try {
      const sessionId = getSessionId();

      const payload: any = {
        action,
        product_name: productName,
        product_id: productId,
        session_id: sessionId,
        timestamp: new Date().toISOString(),
      };

      if (secondsWatched !== undefined) {
        payload.seconds_watched = secondsWatched;
      }

      fetch("/api/engagement/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {
        // Silently fail to not interrupt user
      });
    } catch {
      // Silently fail
    }
  };

  useEffect(() => {
    const videoId = getYouTubeVideoId(videoUrl);
    if (!videoId) return;

    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = initializePlayer;
    } else {
      initializePlayer();
    }

    function initializePlayer() {
      if (!containerRef.current) return;

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: videoId,
        playerVars: {
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onStateChange: onPlayerStateChange,
        },
      });
    }

    function onPlayerStateChange(event: any) {
      // YT.PlayerState.PLAYING = 1
      if (event.data === 1) {
        if (!hasTrackedStart.current) {
          trackDemoEvent("demo_started");
          hasTrackedStart.current = true;
        }
        startTime.current = Date.now();
      }

      // YT.PlayerState.PAUSED = 2
      if (event.data === 2) {
        if (startTime.current > 0) {
          const watchedSeconds = Math.floor(
            (Date.now() - startTime.current) / 1000
          );
          totalWatchedTime.current += watchedSeconds;
          startTime.current = 0;
        }
      }

      // YT.PlayerState.ENDED = 0
      if (event.data === 0) {
        if (!hasTrackedCompletion.current) {
          if (startTime.current > 0) {
            const watchedSeconds = Math.floor(
              (Date.now() - startTime.current) / 1000
            );
            totalWatchedTime.current += watchedSeconds;
          }

          trackDemoEvent("demo_completed", totalWatchedTime.current);
          hasTrackedCompletion.current = true;
        }
      }
    }

    // Track time when user leaves page
    const handleBeforeUnload = () => {
      if (hasTrackedStart.current && !hasTrackedCompletion.current) {
        if (startTime.current > 0) {
          const watchedSeconds = Math.floor(
            (Date.now() - startTime.current) / 1000
          );
          totalWatchedTime.current += watchedSeconds;
        }

        if (totalWatchedTime.current > 0) {
          trackDemoEvent("demo_partial_view", totalWatchedTime.current);
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
    };
  }, [videoUrl, productName, productId]);

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-zinc-800 dark:text-white mb-3">
        Product Demo
      </h2>
      <div className="aspect-video rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 shadow-md">
        <div ref={containerRef} className="w-full h-full" />
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
        Watch this demo to see {productName} in action
      </p>
    </div>
  );
}
