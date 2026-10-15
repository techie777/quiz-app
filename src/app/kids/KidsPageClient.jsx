"use client";

import React, { useEffect } from "react";
import { useTier, TIERS } from "@/context/TierContext";
import KidsZoneView from "@/components/kids/KidsZoneView";

export default function KidsPageClient() {
  const { setTier } = useTier();

  useEffect(() => {
    // Synchronize global experience mode to Kids once on mount
    try {
      const saved = localStorage.getItem("quizweb_experience_tier");
      if (saved !== "kids" && setTier) {
        setTier(TIERS.KIDS);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-sky-50/60 via-amber-50/40 to-purple-50/50 flex flex-col items-center">
      <KidsZoneView />
    </div>
  );
}
