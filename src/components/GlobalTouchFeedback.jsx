"use client";

import { useEffect } from "react";
import { playTouchFeedback } from "@/lib/sounds";

/**
 * GlobalTouchFeedback
 * Automatically triggers tactile vibration and a crisp touch sound
 * whenever the user taps or clicks any button, link, or clickable UI element.
 */
export default function GlobalTouchFeedback() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleGlobalClick = (e) => {
      // Find if clicked element is a button, link, or interactive control
      const interactiveEl = e.target?.closest?.(
        'button, a, [role="button"], [role="link"], [role="tab"], [role="menuitem"], input[type="button"], input[type="submit"], input[type="reset"], [data-clickable]'
      );

      if (interactiveEl) {
        playTouchFeedback();
      }
    };

    // Attach to window capture phase so it executes immediately on click/tap
    window.addEventListener("click", handleGlobalClick, { capture: true, passive: true });

    return () => {
      window.removeEventListener("click", handleGlobalClick, { capture: true });
    };
  }, []);

  return null;
}
