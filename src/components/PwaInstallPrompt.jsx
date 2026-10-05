"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useQuiz } from "@/context/QuizContext";
import {
  Download,
  X,
  Sparkles,
  Zap,
  WifiOff,
  Bell,
  Smartphone,
  Share2,
  PlusSquare,
  CheckCircle2,
  ChevronRight,
  Monitor,
  HelpCircle,
  Apple,
  ExternalLink,
} from "lucide-react";
import Image from "next/image";
import confetti from "canvas-confetti";
import styles from "@/styles/PwaWizard.module.css";

export default function PwaInstallPrompt() {
  const { isFullscreen } = useQuiz();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wizardTab, setWizardTab] = useState("perks"); // 'perks' | 'guide' | 'installed'
  const [selectedPlatform, setSelectedPlatform] = useState("android"); // 'android' | 'ios' | 'desktop'

  // Device & Platform Detection
  useEffect(() => {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const ios = /iphone|ipad|ipod/i.test(ua);
    const android = /android/i.test(ua);
    setIsIos(ios);
    setIsAndroid(android);

    if (ios) {
      setSelectedPlatform("ios");
    } else if (android) {
      setSelectedPlatform("android");
    } else {
      setSelectedPlatform("desktop");
    }

    const standalone =
      (typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(display-mode: standalone)").matches) ||
      (typeof navigator !== "undefined" && navigator.standalone === true);
    setIsStandalone(standalone);

    // Initial check: if already installed, do not show
    if (standalone) {
      setInstalled(true);
      return;
    }

    // Check if dismissed previously
    const wasDismissed =
      typeof localStorage !== "undefined" &&
      localStorage.getItem("quizweb_pwa_banner_minimized") === "true";

    if (!wasDismissed) {
      // Show banner after brief pleasant delay
      const timer = setTimeout(() => {
        setIsBannerVisible(true);
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen for beforeinstallprompt & appinstalled
  useEffect(() => {
    const onBeforeInstallPrompt = (e) => {
      e.preventDefault();
      window.deferredPrompt = e;
      setDeferredPrompt(e);
      // If user hasn't explicitly dismissed, ensure banner is visible
      const wasDismissed =
        typeof localStorage !== "undefined" &&
        localStorage.getItem("quizweb_pwa_banner_minimized") === "true";
      if (!wasDismissed) {
        setIsBannerVisible(true);
      }
    };

    const onAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      window.deferredPrompt = null;
      setIsBannerVisible(false);
      setWizardTab("installed");
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    // Global listener for custom trigger: window.dispatchEvent(new CustomEvent('open-pwa-wizard'))
    const handleOpenWizardEvent = () => {
      setIsModalOpen(true);
      setWizardTab("guide");
    };
    window.addEventListener("open-pwa-wizard", handleOpenWizardEvent);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
      window.removeEventListener("open-pwa-wizard", handleOpenWizardEvent);
    };
  }, []);

  // Trigger Native Install Prompt
  const handleNativeInstall = useCallback(async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice?.outcome === "accepted") {
          setInstalled(true);
          setDeferredPrompt(null);
          setIsBannerVisible(false);
          setIsPillVisible(false);
          setWizardTab("installed");
          try {
            confetti({
              particleCount: 100,
              spread: 80,
              origin: { y: 0.6 },
            });
          } catch {}
        }
      } catch (err) {
        console.error("Install prompt error:", err);
      }
    } else {
      // If native prompt is unavailable (e.g. iOS or manual browser), open the interactive wizard guide!
      setIsModalOpen(true);
      setWizardTab("guide");
    }
  }, [deferredPrompt]);

  // Dismiss Banner
  const handleMinimizeBanner = useCallback(() => {
    setIsBannerVisible(false);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("quizweb_pwa_banner_minimized", "true");
    }
  }, []);

  // Open Full Wizard Modal
  const handleOpenWizard = useCallback((tab = "perks") => {
    setWizardTab(tab);
    setIsModalOpen(true);
  }, []);

  // Close Wizard Modal
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // Route check: suppress during focused quiz / exam
  const isQuizOrExamRoute =
    typeof window !== "undefined" &&
    (window.location.pathname?.startsWith("/quiz/") ||
      window.location.pathname?.includes("/mock-tests/paper/") ||
      window.location.pathname?.startsWith("/live/"));

  if (installed || isStandalone || isQuizOrExamRoute) {
    return null;
  }

  return (
    <>
      {/* 2. Floating Smart Banner: modern, card-styled, with quick actions */}
      {isBannerVisible && !isModalOpen && (
        <div className={styles.bannerPrompt} role="dialog" aria-label="Install App Prompt">
          <button
            onClick={handleMinimizeBanner}
            className={styles.closeButton}
            title="Minimize"
            aria-label="Minimize prompt"
          >
            <X size={14} />
          </button>

          <div className={styles.bannerHeader}>
            <div className={styles.appIconWrap}>
              <Image
                src="/android-chrome-192x192.png"
                alt="QuizWeb App"
                width={46}
                height={46}
                className={styles.appIconImage}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>

            <div className={styles.bannerInfo}>
              <div className={styles.bannerTitleRow}>
                <span className={styles.bannerTitle}>QuizWeb App</span>
                <span className={styles.verifiedBadge}>Free</span>
              </div>
              <div className={styles.bannerSubtitle}>
                {isIos && !deferredPrompt
                  ? "Install on iPhone / iPad for instant access"
                  : "Install for offline practice & 0s loading"}
              </div>
              <div className={styles.bannerPerkTags}>
                <span className={styles.perkPill}>⚡ 0s Load</span>
                <span className={styles.perkPill}>📴 Offline Ready</span>
                <span className={styles.perkPill}>⭐ 4.9 Rating</span>
              </div>
            </div>
          </div>

          <div className={styles.bannerActionRow}>
            <button
              onClick={deferredPrompt ? handleNativeInstall : () => handleOpenWizard("guide")}
              className={styles.btnPrimary}
            >
              <Download size={15} strokeWidth={2.4} />
              {deferredPrompt ? "Install Now" : "Install App"}
            </button>

            <button
              onClick={() => handleOpenWizard("perks")}
              className={styles.btnWizardGuide}
            >
              <span>Features & Guide</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* 3. Interactive PWA Wizard Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div
            className={styles.modalDialog}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-wizard-title"
          >
            {/* Header */}
            <div className={styles.modalHeader}>
              <button
                onClick={handleCloseModal}
                className={styles.modalCloseBtn}
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>

              <div className={styles.modalIconBox}>
                <Image
                  src="/android-chrome-192x192.png"
                  alt="QuizWeb App"
                  width={54}
                  height={54}
                  className={styles.appIconImage}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>

              <div>
                <div id="pwa-wizard-title" className={styles.modalAppTitle}>
                  <span>QuizWeb App</span>
                  <span className={styles.verifiedBadge}>Verified PWA</span>
                </div>
                <div className={styles.modalRatingRow}>
                  <span className={styles.ratingStars}>★★★★★</span>
                  <span>4.9 • 50,000+ Quiz Lovers</span>
                </div>
              </div>
            </div>

            {/* Stepper Tabs */}
            <div className={styles.stepperTabs}>
              <button
                onClick={() => setWizardTab("perks")}
                className={`${styles.stepTab} ${wizardTab === "perks" ? styles.stepTabActive : ""}`}
              >
                <span className={styles.stepNumber}>1</span>
                <span>Why Install</span>
              </button>

              <button
                onClick={() => setWizardTab("guide")}
                className={`${styles.stepTab} ${wizardTab === "guide" ? styles.stepTabActive : ""}`}
              >
                <span className={styles.stepNumber}>2</span>
                <span>Install Guide</span>
              </button>

              {wizardTab === "installed" && (
                <button
                  onClick={() => setWizardTab("installed")}
                  className={`${styles.stepTab} ${styles.stepTabActive}`}
                >
                  <span className={styles.stepNumber}>✓</span>
                  <span>Installed!</span>
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div className={styles.modalBody}>
              {/* TAB 1: Superpowers / Perks */}
              {wizardTab === "perks" && (
                <>
                  <div className="text-center mb-1">
                    <h3 className="text-base font-bold text-white mb-1">
                      Experience QuizWeb at Full Power
                    </h3>
                    <p className="text-xs text-slate-400">
                      Supercharge your learning journey with our native Progressive Web App.
                    </p>
                  </div>

                  <div className={styles.featuresGrid}>
                    <div className={styles.featureCard}>
                      <div
                        className={styles.featureIconWrap}
                        style={{ background: "rgba(234, 179, 8, 0.15)", color: "#facc15" }}
                      >
                        <Zap size={18} />
                      </div>
                      <div className={styles.featureTitle}>Instant 0-Second Launch</div>
                      <div className={styles.featureDesc}>
                        High-speed Service Worker caching ensures quizzes open instantaneously without lag.
                      </div>
                    </div>

                    <div className={styles.featureCard}>
                      <div
                        className={styles.featureIconWrap}
                        style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa" }}
                      >
                        <WifiOff size={18} />
                      </div>
                      <div className={styles.featureTitle}>100% Offline Quizzes</div>
                      <div className={styles.featureDesc}>
                        Practice GK, History, and Daily Sets anytime on trains, flights, or without data.
                      </div>
                    </div>

                    <div className={styles.featureCard}>
                      <div
                        className={styles.featureIconWrap}
                        style={{ background: "rgba(236, 72, 153, 0.15)", color: "#f472b6" }}
                      >
                        <Bell size={18} />
                      </div>
                      <div className={styles.featureTitle}>Daily Streak Protection</div>
                      <div className={styles.featureDesc}>
                        Receive timely quiz streak & XP alerts so you never lose your hard-earned progress.
                      </div>
                    </div>

                    <div className={styles.featureCard}>
                      <div
                        className={styles.featureIconWrap}
                        style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}
                      >
                        <Smartphone size={18} />
                      </div>
                      <div className={styles.featureTitle}>Clean Fullscreen UI</div>
                      <div className={styles.featureDesc}>
                        No browser URL bars or distracting buttons. A pure native app feel on your device.
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* TAB 2: Device-Specific Guided Installation */}
              {wizardTab === "guide" && (
                <>
                  <div className={styles.platformSwitcher}>
                    <button
                      onClick={() => setSelectedPlatform("android")}
                      className={`${styles.platformChip} ${
                        selectedPlatform === "android" ? styles.platformChipActive : ""
                      }`}
                    >
                      <Smartphone size={14} />
                      <span>Android</span>
                    </button>

                    <button
                      onClick={() => setSelectedPlatform("ios")}
                      className={`${styles.platformChip} ${
                        selectedPlatform === "ios" ? styles.platformChipActive : ""
                      }`}
                    >
                      <span>🍎 iPhone / iPad</span>
                    </button>

                    <button
                      onClick={() => setSelectedPlatform("desktop")}
                      className={`${styles.platformChip} ${
                        selectedPlatform === "desktop" ? styles.platformChipActive : ""
                      }`}
                    >
                      <Monitor size={14} />
                      <span>PC / Laptop</span>
                    </button>
                  </div>

                  {/* Android Guide */}
                  {selectedPlatform === "android" && (
                    <div className={styles.walkthroughList}>
                      <div className={styles.walkthroughStep}>
                        <div className={styles.walkthroughBadge}>1</div>
                        <div className={styles.walkthroughText}>
                          <div className={styles.walkthroughTitle}>Tap "Install Now"</div>
                          <div className={styles.walkthroughDesc}>
                            Click the button below to prompt Google Chrome or your Android browser.
                          </div>
                        </div>
                      </div>

                      <div className={styles.walkthroughStep}>
                        <div className={styles.walkthroughBadge}>2</div>
                        <div className={styles.walkthroughText}>
                          <div className={styles.walkthroughTitle}>Confirm Installation</div>
                          <div className={styles.walkthroughDesc}>
                            Tap <span className={styles.keyHighlight}>"Install"</span> or{" "}
                            <span className={styles.keyHighlight}>"Add to Home screen"</span> when prompted.
                          </div>
                        </div>
                      </div>

                      <div className={styles.walkthroughStep}>
                        <div className={styles.walkthroughBadge}>3</div>
                        <div className={styles.walkthroughText}>
                          <div className={styles.walkthroughTitle}>Launch from Home Screen</div>
                          <div className={styles.walkthroughDesc}>
                            The QuizWeb icon will appear on your Home Screen and App Drawer for 1-tap play!
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* iOS / Safari Guide */}
                  {selectedPlatform === "ios" && (
                    <div className={styles.walkthroughList}>
                      <div className={styles.walkthroughStep}>
                        <div className={styles.walkthroughBadge}>1</div>
                        <div className={styles.walkthroughText}>
                          <div className={styles.walkthroughTitle}>Tap the Share Button</div>
                          <div className={styles.walkthroughDesc}>
                            In <span className={styles.keyHighlight}>Apple Safari</span>, tap the{" "}
                            <span className={styles.keyHighlight}>Share icon</span> (square with arrow pointing up) in the bottom toolbar.
                          </div>
                        </div>
                      </div>

                      <div className={styles.walkthroughStep}>
                        <div className={styles.walkthroughBadge}>2</div>
                        <div className={styles.walkthroughText}>
                          <div className={styles.walkthroughTitle}>Select 'Add to Home Screen'</div>
                          <div className={styles.walkthroughDesc}>
                            Scroll down the action list and tap{" "}
                            <span className={styles.keyHighlight}>"Add to Home Screen" (➕)</span>.
                          </div>
                        </div>
                      </div>

                      <div className={styles.walkthroughStep}>
                        <div className={styles.walkthroughBadge}>3</div>
                        <div className={styles.walkthroughText}>
                          <div className={styles.walkthroughTitle}>Tap 'Add' at Top Right</div>
                          <div className={styles.walkthroughDesc}>
                            Tap <span className={styles.keyHighlight}>"Add"</span> in the top-right corner. QuizWeb will now be on your Home Screen!
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Desktop / Laptop Guide */}
                  {selectedPlatform === "desktop" && (
                    <div className={styles.walkthroughList}>
                      <div className={styles.walkthroughStep}>
                        <div className={styles.walkthroughBadge}>1</div>
                        <div className={styles.walkthroughText}>
                          <div className={styles.walkthroughTitle}>Look at the Browser Address Bar</div>
                          <div className={styles.walkthroughDesc}>
                            In Chrome, Edge, or Brave, click the{" "}
                            <span className={styles.keyHighlight}>Install icon</span> (computer screen with down arrow) on the right side of the address bar.
                          </div>
                        </div>
                      </div>

                      <div className={styles.walkthroughStep}>
                        <div className={styles.walkthroughBadge}>2</div>
                        <div className={styles.walkthroughText}>
                          <div className={styles.walkthroughTitle}>Or Click "Install Desktop App" Below</div>
                          <div className={styles.walkthroughDesc}>
                            We'll directly trigger the desktop prompt if your browser supports it.
                          </div>
                        </div>
                      </div>

                      <div className={styles.walkthroughStep}>
                        <div className={styles.walkthroughBadge}>3</div>
                        <div className={styles.walkthroughText}>
                          <div className={styles.walkthroughTitle}>Pin to Taskbar</div>
                          <div className={styles.walkthroughDesc}>
                            QuizWeb runs in its own window and can be pinned to your Windows Taskbar or Mac Dock.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* TAB 3: Installed State */}
              {wizardTab === "installed" && (
                <div className={styles.successContainer}>
                  <div className={styles.successIcon}>
                    <CheckCircle2 size={38} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-lg font-bold text-white">QuizWeb App Installed!</h3>
                  <p className="text-xs text-slate-300 max-w-xs">
                    You're all set! Launch QuizWeb directly from your Home Screen or App Drawer anytime for offline learning.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className={styles.modalFooter}>
              {wizardTab === "perks" ? (
                <>
                  <button onClick={handleCloseModal} className={styles.modalSecondaryBtn}>
                    Later
                  </button>
                  <button
                    onClick={() => {
                      if (deferredPrompt) {
                        handleNativeInstall();
                      } else {
                        setWizardTab("guide");
                      }
                    }}
                    className={styles.modalInstallBtn}
                  >
                    <Download size={16} strokeWidth={2.4} />
                    <span>{deferredPrompt ? "Install Now (Free)" : "Installation Guide ➔"}</span>
                  </button>
                </>
              ) : wizardTab === "guide" ? (
                <>
                  <button onClick={() => setWizardTab("perks")} className={styles.modalSecondaryBtn}>
                    ← Back
                  </button>
                  {deferredPrompt ? (
                    <button onClick={handleNativeInstall} className={styles.modalInstallBtn}>
                      <Download size={16} strokeWidth={2.4} />
                      <span>Install QuizWeb App</span>
                    </button>
                  ) : (
                    <button onClick={handleCloseModal} className={styles.modalInstallBtn}>
                      <CheckCircle2 size={16} />
                      <span>Got It, Thanks!</span>
                    </button>
                  )}
                </>
              ) : (
                <button onClick={handleCloseModal} className={styles.modalInstallBtn} style={{ width: "100%" }}>
                  <span>Start Playing Quizzes</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
