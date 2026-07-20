"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuiz } from "@/context/QuizContext";
import { Download, X } from "lucide-react";
import Image from "next/image";

export default function PwaInstallPrompt() {
  const { isFullscreen } = useQuiz();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const ios = /iphone|ipad|ipod/i.test(ua);
    setIsIos(ios);

    const standalone =
      (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
      (typeof navigator !== "undefined" && navigator.standalone === true);
    setIsStandalone(standalone);
    
    // Check if previously dismissed
    if (typeof localStorage !== "undefined" && localStorage.getItem('pwa_prompt_dismissed') === 'true') {
      setDismissed(true);
    }
  }, []);

  useEffect(() => {
    const onBeforeInstallPrompt = (e) => {
      e.preventDefault();
      window.deferredPrompt = e;
      setDeferredPrompt(e);
    };
    const onAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      window.deferredPrompt = null;
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const showPrompt = useMemo(() => {
    if (installed || isStandalone || dismissed) return false;
    if (deferredPrompt) return true;
    // iOS Safari has no beforeinstallprompt; show helper hint.
    if (isIos) return true;
    return false;
  }, [installed, isStandalone, deferredPrompt, isIos, dismissed]);

  const handleDismiss = () => {
    setDeferredPrompt(null);
    setDismissed(true);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem('pwa_prompt_dismissed', 'true');
    }
  };

  const isQuizOrExamRoute = typeof window !== "undefined" && (window.location.pathname?.startsWith("/quiz/") || window.location.pathname?.includes("/mock-tests/paper/") || window.location.pathname?.startsWith("/live/"));
  if (!showPrompt || (isFullscreen && isQuizOrExamRoute)) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 32px)",
        maxWidth: "400px",
        zIndex: 2000,
        background: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        color: "white",
        borderRadius: "20px",
        padding: "16px",
        boxShadow: "0 20px 40px -10px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1) inset",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
      role="dialog"
      aria-label="Install app prompt"
    >
      <button 
        onClick={handleDismiss}
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          background: "rgba(255,255,255,0.1)",
          border: "none",
          color: "rgba(255,255,255,0.6)",
          borderRadius: "50%",
          width: 24,
          height: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          padding: 0
        }}
      >
        <X size={14} />
      </button>

      <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 4 }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: "linear-gradient(135deg, #6366f1, #a855f7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxShadow: "0 8px 16px rgba(99,102,241,0.3)"
        }}>
          <span style={{ fontSize: 24 }}>🧠</span>
        </div>
        <div style={{ lineHeight: 1.3, paddingRight: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.01em" }}>QuizWeb App</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
            {isIos && !deferredPrompt
              ? "On iPhone: Tap Share → Add to Home Screen"
              : "Install for offline access & faster loading"}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        {deferredPrompt ? (
          <button
            onClick={async () => {
              try {
                await deferredPrompt.prompt();
                const choice = await deferredPrompt.userChoice;
                if (choice?.outcome !== "accepted") {
                  // keep prompt available
                } else {
                  setDeferredPrompt(null);
                }
              } catch {}
            }}
            style={{
              flex: 1,
              background: "white",
              color: "#0f172a",
              border: "none",
              borderRadius: 12,
              padding: "12px",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "transform 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            <Download size={16} strokeWidth={2.5} />
            Install Now
          </button>
        ) : isIos && !deferredPrompt ? (
          <div style={{ flex: 1, background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: "10px", textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
            Tap the <b>Share</b> icon at the bottom of Safari
          </div>
        ) : null}
      </div>
    </div>
  );
}

