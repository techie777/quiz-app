"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useTier } from "@/context/TierContext";

/**
 * MainContentWrapper dynamically manages bottom padding.
 * When BottomNavBar is rendered, it applies bottom padding so content doesn't get obscured.
 * When BottomNavBar is hidden (e.g. Unset Landing Page, Quiz Playing, Timed Exams, Admin),
 * it removes the excess bottom padding to prevent large empty white spaces above the footer.
 */
export default function MainContentWrapper({ children }) {
  const pathname = usePathname();
  const { hasSavedTier, mounted } = useTier();

  // BottomNavBar is hidden on these routes:
  const isUnsetLanding = pathname === "/" && (!mounted || !hasSavedTier);
  const isQuizPlaying = pathname?.startsWith("/quiz") || pathname?.startsWith("/live");
  const isTimedExam = pathname?.includes("/mock-tests/paper/");
  const isAdmin = pathname?.startsWith("/admin");
  const isArena = pathname?.startsWith("/arena");

  const hasBottomNav = !isUnsetLanding && !isQuizPlaying && !isTimedExam && !isAdmin && !isArena;

  return (
    <main
      className="flex-1 w-full"
      style={{
        paddingBottom: hasBottomNav
          ? "calc(4.5rem + env(safe-area-inset-bottom, 0px))"
          : "0px",
      }}
    >
      {children}
    </main>
  );
}
