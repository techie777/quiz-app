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

  // BottomNavBar is hidden only during interactive full-screen gameplay, timed exam tests, or admin panel:
  const isQuizPlaying =
    pathname?.startsWith("/quiz/") ||
    pathname?.startsWith("/live/") ||
    pathname?.startsWith("/t/") ||
    pathname?.startsWith("/institute");
  const isTimedExam = pathname?.includes("/mock-tests/paper/");
  const isAdmin = pathname?.startsWith("/admin");

  const hasBottomNav = !isQuizPlaying && !isTimedExam && !isAdmin;

  return (
    <main
      className="flex-1 w-full max-w-full overflow-x-hidden"
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
