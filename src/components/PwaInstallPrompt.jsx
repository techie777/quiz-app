"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuiz } from "@/context/QuizContext";

export default function PwaInstallPrompt() {
  const { isFullscreen } = useQuiz();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const ios = /iphone|ipad|ipod/i.test(ua);
    setIsIos(ios);

    const standalone =
      (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
      (typeof navigator !== "undefined" && navigator.standalone === true);
    setIsStandalone(standalone);
  }, []);

  useEffect(() => {
    const onBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const onAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const showPrompt = useMemo(() => {
    if (installed || isStandalone) return false;
    if (deferredPrompt) return true;
    // iOS Safari has no beforeinstallprompt; show helper hint.
    if (isIos) return true;
    return false;
  }, [installed, isStandalone, deferredPrompt, isIos]);

  if (!showPrompt || isFullscreen) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        left: 16,
        right: 16,
        zIndex: 2000,
        background: "rgba(15, 23, 42, 0.92)",
        color: "white",
        borderRadius: 16,
        padding: "12px 14px",
        boxShadow: "0 16px 50px rgba(0,0,0,0.25)",
        display: "flex",
        gap: 12,
        alignItems: "center",
        justifyContent: "space-between",
      }}
      role="dialog"
      aria-label="Install app prompt"
    >
      <div style={{ lineHeight: 1.2 }}>
        <div style={{ fontWeight: 900, fontSize: 14 }}>Install QuizWeb</div>
        <div style={{ fontSize: 12, opacity: 0.85 }}>
          {isIos && !deferredPrompt
            ? "On iPhone: Share → Add to Home Screen."
            : "Get the app for faster access and offline support."}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {deferredPrompt && (
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
              background: "white",
              color: "#0f172a",
              border: "none",
              borderRadius: 12,
              padding: "10px 12px",
              fontWeight: 900,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Install
          </button>
        )}

        <button
          onClick={() => setDeferredPrompt(null)}
          style={{
            background: "transparent",
            color: "rgba(255,255,255,0.9)",
            border: "1px solid rgba(255,255,255,0.25)",
            borderRadius: 12,
            padding: "10px 12px",
            fontWeight: 800,
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          Not now
        </button>
      </div>
    </div>
  );
}

