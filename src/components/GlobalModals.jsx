"use client";

import { useUI } from "@/context/UIContext";
import OnboardingModal from "@/components/OnboardingModal";
import TierSelectionModal from "@/components/TierSelectionModal";

export default function GlobalModals() {
  const { isOnboardingOpen, closeOnboarding } = useUI();

  return (
    <>
      <TierSelectionModal />
      <OnboardingModal 
        isOpen={isOnboardingOpen} 
        onClose={closeOnboarding}
      />
    </>
  );
}
