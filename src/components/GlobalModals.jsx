"use client";

import { useUI } from "@/context/UIContext";
import OnboardingModal from "@/components/OnboardingModal";

export default function GlobalModals() {
  const { isOnboardingOpen, closeOnboarding } = useUI();

  return (
    <>
      <OnboardingModal 
        isOpen={isOnboardingOpen} 
        onClose={closeOnboarding}
      />
    </>
  );
}
