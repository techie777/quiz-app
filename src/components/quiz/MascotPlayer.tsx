"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import styles from "@/styles/MascotPlayer.module.css";
import { MASCOTS, MascotProfile, stopMascotSpeech, speakWithMascot } from "@/config/mascots";

export type MascotState = "idle" | "thinking" | "correct" | "wrong" | "celebrate" | "talking";

export interface MascotPlayerProps {
  characterId?: string; // sharma_sir | sharma-sir | didi | filmy_raj | etc.
  state?: MascotState;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | number;
  width?: number;
  height?: number;
  className?: string;
  isMuted?: boolean;
  allowAudioClick?: boolean;
  speechText?: string;
  language?: "hi" | "en";
  onClick?: () => void;
  onStateComplete?: (completedState: MascotState) => void;
  disableVideo?: boolean;
}

const SIZE_MAP: Record<string, { px: number; containerClass: string }> = {
  xs: { px: 36, containerClass: "w-9 h-9" },
  sm: { px: 52, containerClass: "w-13 h-13" },
  md: { px: 76, containerClass: "w-20 h-20" },
  lg: { px: 128, containerClass: "w-32 h-32" },
  xl: { px: 176, containerClass: "w-44 h-44" },
};

// Normalize character ID to underscore convention (sharma-sir -> sharma_sir)
export const normalizeCharacterId = (id?: string): string => {
  if (!id) return "sharma_sir";
  const cleaned = id.toLowerCase().replace(/-/g, "_").trim();
  if (cleaned.includes("sharma")) return "sharma_sir";
  if (cleaned.includes("didi")) return "didi";
  if (cleaned.includes("filmy") || cleaned.includes("raj")) return "filmy_raj";
  if (cleaned.includes("vikram") || cleaned.includes("coach")) return "coach_vikram";
  if (cleaned.includes("cosmo") || cleaned.includes("dr")) return "dr_cosmo";
  return "sharma_sir";
};

// In-memory cache for preloaded assets & video availability
const preloadedCache = new Set<string>();
const videoSourceCache = new Map<string, string | null>();

let manifestCache: Record<string, any> | null = null;
let manifestFetchPromise: Promise<Record<string, any> | null> | null = null;

async function getManifestData(): Promise<Record<string, any> | null> {
  if (manifestCache) return manifestCache;
  if (manifestFetchPromise) return manifestFetchPromise;
  if (typeof window === "undefined") return null;

  manifestFetchPromise = fetch("/mascots/manifest.json?_t=" + Date.now())
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      manifestCache = data;
      return data;
    })
    .catch(() => null);

  return manifestFetchPromise;
}

export default function MascotPlayer({
  characterId = "sharma_sir",
  state = "idle",
  size = "md",
  width,
  height,
  className = "",
  isMuted = true,
  allowAudioClick = false,
  speechText,
  language = "hi",
  onClick,
  onStateComplete,
  disableVideo = false,
}: MascotPlayerProps) {
  const normChar = useMemo(() => normalizeCharacterId(characterId), [characterId]);
  const hyphenChar = useMemo(() => normChar.replace(/_/g, "-"), [normChar]);
  
  const mascotProfile: MascotProfile = useMemo(() => {
    return MASCOTS[hyphenChar] || MASCOTS["sharma-sir"];
  }, [hyphenChar]);

  // Dimension sizing
  const dimensions = useMemo(() => {
    if (typeof size === "number") return { width: size, height: size };
    if (width && height) return { width, height };
    const conf = SIZE_MAP[size] || SIZE_MAP.md;
    return { width: conf.px, height: conf.px };
  }, [size, width, height]);

  // Internal state
  const [activeState, setActiveState] = useState<MascotState>(state);
  const [useVideo, setUseVideo] = useState(false);
  const [isWideVideo, setIsWideVideo] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>(`/mascots/${normChar}/${state}.mp4`);
  const [posterSrc, setPosterSrc] = useState<string>(`/mascots/${normChar}/${state}.webp`);
  const [isCrossFading, setIsCrossFading] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [fallbackStep, setFallbackStep] = useState(0); // 0: /mascots, 1: /assets, 2: idle, 3: badge

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync external state changes
  useEffect(() => {
    setActiveState(state);
    setFallbackStep(0);
    setImgFailed(false);
  }, [state, normChar]);

  // Asset paths based on character and active state
  const assetPaths = useMemo(() => {
    return {
      webm: `/mascots/${normChar}/${activeState}.webm`,
      mp4: `/mascots/${normChar}/${activeState}.mp4`,
      poster: `/mascots/${normChar}/${activeState}.webp`,
      legacyPoster: `/assets/characters/${mascotProfile.folder}/${
        activeState === "correct"
          ? "clapping.webp"
          : activeState === "wrong"
          ? "disappointed.webp"
          : activeState === "celebrate"
          ? "celebrating.webp"
          : activeState === "talking"
          ? "clapping.webp"
          : `${activeState}.webp`
      }`,
      idleFallback: `/assets/characters/${mascotProfile.folder}/idle.webp`,
      isLooping: activeState === "idle" || activeState === "talking",
    };
  }, [normChar, activeState, mascotProfile.folder]);

  // Determine poster path according to fallback step
  useEffect(() => {
    if (fallbackStep === 0) {
      setPosterSrc(assetPaths.poster);
    } else if (fallbackStep === 1) {
      setPosterSrc(assetPaths.legacyPoster);
    } else if (fallbackStep === 2) {
      setPosterSrc(assetPaths.idleFallback);
    } else {
      setImgFailed(true);
    }
  }, [fallbackStep, assetPaths]);

  // Detect transparent WebM playback capability (iOS Safari does not support alpha WebM)
  const canPlayTransparentWebM = useMemo(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return false;
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (isIOS) return false;

    const testVideo = document.createElement("video");
    const canPlay = testVideo.canPlayType('video/webm; codecs="vp9"');
    return canPlay === "probably" || canPlay === "maybe";
  }, []);

  // Check Data Saver, slow connection, and reduced motion preferences
  const shouldSkipVideo = useMemo(() => {
    if (disableVideo) return true;
    if (typeof window === "undefined") return true;

    // Prefers reduced motion
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return true;
    }

    // Network conditions check (Data Saver or 2G)
    const conn = (navigator as any).connection;
    if (conn) {
      if (conn.saveData) return true;
      if (conn.effectiveType === "slow-2g" || conn.effectiveType === "2g") return true;
    }

    return false;
  }, [disableVideo]);

  // Preload ONLY idle and talking for the active character on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const idlePoster = `/mascots/${normChar}/idle.webp`;
    const talkingPoster = `/mascots/${normChar}/talking.webp`;

    [idlePoster, talkingPoster].forEach((src) => {
      if (!preloadedCache.has(src)) {
        const img = new Image();
        img.src = src;
        preloadedCache.add(src);
      }
    });
  }, [normChar]);

  // Lazy-load other states on first use and cache them
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (activeState === "idle" || activeState === "talking") return;

    const statePoster = `/mascots/${normChar}/${activeState}.webp`;
    if (!preloadedCache.has(statePoster)) {
      const img = new Image();
      img.src = statePoster;
      preloadedCache.add(statePoster);
    }
  }, [normChar, activeState]);

  // 150ms crossfade when state changes
  useEffect(() => {
    setIsCrossFading(true);
    const fadeTimer = setTimeout(() => {
      setIsCrossFading(false);
    }, 150);
    return () => clearTimeout(fadeTimer);
  }, [activeState, normChar]);

  // Probe video availability & swap with 150ms crossfade
  useEffect(() => {
    if (shouldSkipVideo) {
      setUseVideo(false);
      return;
    }

    const checkKey = `${normChar}_${activeState}`;
    if (videoSourceCache.has(checkKey)) {
      const cachedSrc = videoSourceCache.get(checkKey);
      if (cachedSrc) {
        setCurrentSrc(cachedSrc);
        setUseVideo(true);
      } else {
        setUseVideo(false);
      }
      return;
    }

    let isMounted = true;
    const probeVideo = async () => {
      try {
        // 1. Check if manifest has an explicit videoUrl (e.g. /mascots/sharma_sir/correct.mp4)
        const manifest = await getManifestData();
        const charState = manifest?.[normChar]?.states?.[activeState];

        if (charState?.videoUrl && charState?.hasVideo !== false) {
          const directUrl = charState.videoUrl;
          if (isMounted) {
            videoSourceCache.set(checkKey, directUrl);
            setCurrentSrc(directUrl);
            setUseVideo(true);
          }
          return;
        }

        // 2. Probe .webm first if browser supports transparent webm
        if (canPlayTransparentWebM) {
          try {
            const resWebm = await fetch(assetPaths.webm, { method: "HEAD" });
            if (resWebm.ok && resWebm.status === 200) {
              if (isMounted) {
                videoSourceCache.set(checkKey, assetPaths.webm);
                setCurrentSrc(assetPaths.webm);
                setUseVideo(true);
              }
              return;
            }
          } catch {}
        }

        // 3. Probe .mp4 fallback (universally playable on all modern devices)
        try {
          const resMp4 = await fetch(assetPaths.mp4, { method: "HEAD" });
          if (resMp4.ok && resMp4.status === 200) {
            if (isMounted) {
              videoSourceCache.set(checkKey, assetPaths.mp4);
              setCurrentSrc(assetPaths.mp4);
              setUseVideo(true);
            }
            return;
          }
        } catch {}

        // 4. No video found
        if (isMounted) {
          videoSourceCache.set(checkKey, null);
          setUseVideo(false);
        }
      } catch {
        if (isMounted) {
          videoSourceCache.set(checkKey, null);
          setUseVideo(false);
        }
      }
    };
    probeVideo();

    return () => {
      isMounted = false;
    };
  }, [normChar, activeState, shouldSkipVideo, canPlayTransparentWebM, assetPaths.webm, assetPaths.mp4]);

  // Ensure video element plays reliably upon becoming active
  useEffect(() => {
    if (videoRef.current && useVideo) {
      try {
        videoRef.current.currentTime = 0;
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.debug("Mascot video autoplay caught:", err);
          });
        }
      } catch (e) {}
    }
  }, [useVideo, currentSrc, activeState]);

  // Page visibility: pause playback when tab is hidden
  useEffect(() => {
    if (typeof document === "undefined") return;

    const handleVisibility = () => {
      if (document.hidden) {
        if (videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
        }
      } else {
        if (videoRef.current && useVideo && assetPaths.isLooping) {
          videoRef.current.play().catch(() => {});
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [useVideo, assetPaths.isLooping]);

  // Handle animation completion for play-once states (correct, wrong, celebrate, thinking)
  // Holds last frame, then fires onStateComplete (or returns to idle).
  // Note: When a video is playing, video onEnded will drive completion!
  useEffect(() => {
    if (activeState === "idle" || activeState === "talking") return;
    if (useVideo) return; // Handled by video.onEnded

    const durations: Record<string, number> = {
      correct: 2500,
      wrong: 2200,
      celebrate: 2800,
      thinking: 3500,
    };

    const duration = durations[activeState] || 2500;
    timeoutRef.current = setTimeout(() => {
      if (onStateComplete) {
        onStateComplete(activeState);
      } else {
        setActiveState("idle");
      }
    }, duration);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [activeState, onStateComplete, useVideo]);

  // Handle image error fallback ladder
  const handleImageError = () => {
    setFallbackStep((prev) => prev + 1);
  };

  // CSS Animation class mapping for static fallback
  const animationClass = useMemo(() => {
    switch (activeState) {
      case "idle":
        return styles.animateIdle;
      case "thinking":
        return styles.animateThinking;
      case "correct":
        return styles.animateCorrect;
      case "wrong":
        return styles.animateWrong;
      case "celebrate":
        return styles.animateCelebrate;
      case "talking":
        return styles.animateTalking;
      default:
        return styles.animateIdle;
    }
  }, [activeState]);

  // Optional audio click handler
  const handleContainerClick = () => {
    if (allowAudioClick && speechText) {
      speakWithMascot(
        speechText,
        mascotProfile.ttsRate,
        mascotProfile.ttsPitch,
        () => setActiveState("talking"),
        () => setActiveState("idle"),
        language === "hi" ? "hi-IN" : "en-IN"
      );
    }
    if (onClick) onClick();
  };

  return (
    <div
      className={`${styles.container} ${className}`}
      style={{
        width: dimensions.width,
        height: dimensions.height,
      }}
      onClick={handleContainerClick}
      title={`${mascotProfile.name} (${activeState})`}
    >
      <div className={styles.stage}>
        {/* Soft Themed Ambient Glow */}
        <div
          className={styles.ambientGlow}
          style={{
            backgroundColor: mascotProfile.color,
            transform: activeState === "celebrate" || activeState === "correct" ? "scale(1.15)" : "scale(0.85)",
          }}
        />

        <div
          className={styles.mediaLayer}
          style={{
            opacity: isCrossFading ? 0.25 : 1,
            transition: "opacity 150ms ease-in-out",
          }}
        >
          {/* Reusable Video Element */}
          {useVideo ? (
            <video
              ref={videoRef}
              src={currentSrc}
              muted={isMuted}
              playsInline
              autoPlay
              loop={assetPaths.isLooping}
              className={`${styles.videoElement} ${isWideVideo ? styles.videoElementWide : ""}`}
              onLoadedMetadata={(e) => {
                const v = e.currentTarget;
                if (v.videoWidth && v.videoHeight) {
                  setIsWideVideo(v.videoWidth / v.videoHeight > 0.65);
                }
              }}
              onEnded={() => {
                if (!assetPaths.isLooping) {
                  if (onStateComplete) {
                    onStateComplete(activeState);
                  } else {
                    setActiveState("idle");
                  }
                }
              }}
              onError={() => {
                videoSourceCache.set(`${normChar}_${activeState}`, null);
                setUseVideo(false);
              }}
            />
          ) : !imgFailed ? (
            /* Poster Image with CSS Life Micro-Animation */
            <img
              src={posterSrc}
              alt={`${mascotProfile.name} - ${activeState}`}
              width={dimensions.width}
              height={dimensions.height}
              className={`${styles.posterImage} ${animationClass}`}
              onError={handleImageError}
              loading="lazy"
            />
          ) : (
            /* Safe Fallback Badge (Never Broken Image) */
            <div
              className={styles.fallbackBadge}
              style={{ backgroundColor: mascotProfile.color }}
            >
              {mascotProfile.name.charAt(0)}
            </div>
          )}
        </div>

        {/* Sparkle / Confetti Burst for Correct and Celebrate */}
        {(activeState === "correct" || activeState === "celebrate") && (
          <div className={styles.sparkleContainer}>
            <span
              className={styles.sparkle}
              style={{
                top: "20%",
                left: "15%",
                ["--dx" as any]: "-14px",
                ["--dy" as any]: "-16px",
                color: "#fbbf24",
                animationDelay: "0ms",
              }}
            >
              ✦
            </span>
            <span
              className={styles.sparkle}
              style={{
                top: "15%",
                right: "15%",
                ["--dx" as any]: "16px",
                ["--dy" as any]: "-18px",
                color: "#f59e0b",
                animationDelay: "80ms",
              }}
            >
              ★
            </span>
            <span
              className={styles.sparkle}
              style={{
                top: "40%",
                left: "8%",
                ["--dx" as any]: "-18px",
                ["--dy" as any]: "-6px",
                color: "#10b981",
                animationDelay: "120ms",
              }}
            >
              ✨
            </span>
            <span
              className={styles.sparkle}
              style={{
                top: "35%",
                right: "8%",
                ["--dx" as any]: "18px",
                ["--dy" as any]: "-8px",
                color: "#ec4899",
                animationDelay: "160ms",
              }}
            >
              {activeState === "celebrate" ? "🎉" : "✦"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
