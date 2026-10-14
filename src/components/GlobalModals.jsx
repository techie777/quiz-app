"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useUI } from "@/context/UIContext";
import OnboardingModal from "@/components/OnboardingModal";
import TierSelectionModal from "@/components/TierSelectionModal";
import SplashScreen from "@/components/SplashScreen";
import OnboardingGuideModal from "@/components/OnboardingGuideModal";
import PlayMenuModal from "@/components/PlayMenuModal";

export default function GlobalModals() {
  const pathname = usePathname();
  const isBusinessOrLivePage =
    pathname?.startsWith("/live") ||
    pathname?.startsWith("/t/") ||
    pathname?.startsWith("/institute");

  const {
    isOnboardingOpen,
    closeOnboarding,
    isTutorialOpen,
    openTutorial,
    closeTutorial,
    isPlayMenuOpen,
    closePlayMenu,
  } = useUI();

  // On mount, if splash was already shown in this session but onboarding guide not seen yet
  useEffect(() => {
    if (isBusinessOrLivePage) return;
    try {
      const splashShown = sessionStorage.getItem("quizweb_splash_shown");
      const tutorialSeen = localStorage.getItem("onboardingSeen");
      if (splashShown && !tutorialSeen) {
        openTutorial();
      }
    } catch {}
  }, [openTutorial, isBusinessOrLivePage]);

  const handleSplashComplete = () => {
    if (isBusinessOrLivePage) return;
    try {
      const tutorialSeen = localStorage.getItem("onboardingSeen");
      if (!tutorialSeen) {
        openTutorial();
      }
    } catch {}
  };

  if (isBusinessOrLivePage) {
    return null;
  }

  return (
    <>
      <SplashScreen onComplete={handleSplashComplete} />
      <OnboardingGuideModal
        isOpen={isTutorialOpen}
        onClose={closeTutorial}
      />
      <TierSelectionModal />
      <OnboardingModal 
        isOpen={isOnboardingOpen} 
        onClose={closeOnboarding}
      />
      <PlayMenuModal
        isOpen={isPlayMenuOpen}
        onClose={closePlayMenu}
      />
    </>
  );
}
