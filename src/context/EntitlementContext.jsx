"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useTier } from "@/context/TierContext";
import { getOrCreateDeviceId } from "@/lib/deviceId";
import toast from "react-hot-toast";

const EntitlementContext = createContext(null);

export function EntitlementProvider({ children }) {
  const { data: session } = useSession();
  const { tier } = useTier();

  const [entitlement, setEntitlement] = useState({
    isPro: false,
    isLocked: false,
    remainingSets: 2,
    freeSetsPerWindow: 2,
    usedSetsCount: 0,
    windowResetTime: null,
    countdownFormatted: "",
    canWatchAd: false,
    unlockedSetIds: [],
  });

  const [lockedSheetOpen, setLockedSheetOpen] = useState(false);
  const [lockedSet, setLockedSet] = useState(null);
  const [onStartAfterUnlock, setOnStartAfterUnlock] = useState(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  // Fetch Entitlement from Server
  const fetchEntitlement = useCallback(async (currentTier = tier, setId = null) => {
    try {
      const deviceId = getOrCreateDeviceId();
      const params = new URLSearchParams({
        tier: currentTier || "adults",
        moduleId: "quiz",
        deviceId,
      });
      if (setId) params.append("setId", setId);

      const res = await fetch(`/api/entitlement/check?${params.toString()}`, {
        headers: { "x-device-id": deviceId },
      });

      if (res.ok) {
        const data = await res.json();
        setEntitlement(prev => ({
          isPro: Boolean(data.isPro),
          isLocked: Boolean(data.isLocked),
          remainingSets: typeof data.remainingSets === "number" ? data.remainingSets : 2,
          freeSetsPerWindow: data.freeSetsPerWindow || 2,
          usedSetsCount: data.usedSetsCount || 0,
          windowResetTime: data.windowResetTime,
          countdownFormatted: data.countdownFormatted || "",
          countdownFormattedHi: data.countdownFormattedHi || "",
          canWatchAd: Boolean(data.canWatchAd),
          msRemaining: data.msRemaining || 0,
          unlockedSetIds: Array.from(new Set([...(prev.unlockedSetIds || []), ...(data.unlockedSetIds || [])])),
        }));
      }
    } catch (err) {
      console.error("fetchEntitlement error:", err);
    }
  }, [tier]);

  useEffect(() => {
    fetchEntitlement(tier);
  }, [tier, session, fetchEntitlement]);

  // Merge guest attempts on sign-in
  useEffect(() => {
    if (session?.user?.id) {
      const deviceId = getOrCreateDeviceId();
      fetch("/api/auth/merge-guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId }),
      }).catch(() => {});
    }
  }, [session]);

  // Live countdown ticker if windowResetTime is set
  useEffect(() => {
    if (!entitlement.windowResetTime) return;

    const tick = () => {
      const resetTime = new Date(entitlement.windowResetTime).getTime();
      const now = Date.now();
      const diff = Math.max(0, resetTime - now);

      if (diff <= 0) {
        // Window expired! Re-fetch fresh entitlement
        fetchEntitlement(tier);
        return;
      }

      const totalSec = Math.floor(diff / 1000);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      const formatted = h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`;
      const formattedHi = h > 0 ? `${h} घंटे ${m} मिनट` : `${m} मिनट ${s} सेकंड`;

      setEntitlement(prev => ({
        ...prev,
        msRemaining: diff,
        countdownFormatted: formatted,
        countdownFormattedHi: formattedHi,
      }));
    };

    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [entitlement.windowResetTime, tier, fetchEntitlement]);

  // Record First Question Answered
  const recordFirstAnswer = useCallback(async ({ setId, categoryId, setIndex }) => {
    try {
      const deviceId = getOrCreateDeviceId();
      const targetId = setId || `${categoryId || "quiz"}-${setIndex || 1}`;

      const res = await fetch("/api/attempts/record", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-device-id": deviceId,
        },
        body: JSON.stringify({
          setId: targetId,
          tier,
          moduleId: "quiz",
          deviceId,
          gatePassed: "start",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.entitlement) {
          setEntitlement(prev => ({
            ...prev,
            ...data.entitlement,
          }));
        }
      }
    } catch (err) {
      console.error("recordFirstAnswer error:", err);
    }
  }, [tier]);

  // Unlock via Ad (for Explorer/Arena beyond free limit)
  const unlockViaAd = useCallback(async (setObj) => {
    if (!setObj) return false;
    setLoading(true);
    try {
      const deviceId = getOrCreateDeviceId();
      const targetId = setObj.id || `${setObj.categorySlug || "quiz"}-${setObj.index || 1}`;

      const res = await fetch("/api/attempts/gate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-device-id": deviceId,
        },
        body: JSON.stringify({
          setId: targetId,
          gate: "start",
          tier,
          moduleId: "quiz",
          deviceId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setEntitlement(prev => ({
          ...prev,
          ...(data.entitlement || {}),
          unlockedSetIds: Array.from(new Set([
            ...(prev.unlockedSetIds || []),
            ...(data.entitlement?.unlockedSetIds || []),
            targetId,
            String(setObj.index)
          ])),
        }));
        setLockedSheetOpen(false);
        setLockedSet(null);
        toast.success("सेट अनलॉक हो गया! आनंद लें। / Set Unlocked!");
        if (onStartAfterUnlock) {
          const cb = onStartAfterUnlock;
          setOnStartAfterUnlock(null);
          cb(setObj);
        }
        return true;
      }
      return false;
    } catch (err) {
      toast.error("विज्ञापन लोड करने में विफल");
      return false;
    } finally {
      setLoading(false);
    }
  }, [tier, onStartAfterUnlock]);

  const openLockedSheet = useCallback((set, onStart = null) => {
    setLockedSet(set);
    setOnStartAfterUnlock(() => onStart);
    setLockedSheetOpen(true);
  }, []);

  const closeLockedSheet = useCallback(() => {
    setLockedSheetOpen(false);
    setLockedSet(null);
    setOnStartAfterUnlock(null);
  }, []);

  /**
   * Helper to determine if a given set is locked:
   * A set is locked if:
   * - User is NOT Pro
   * - Not previously unlocked via rewarded ad
   * - Set is beyond the free quota (setIndex > freeSetsPerWindow)
   */
  const isSetLocked = useCallback((setIndex, setId = null) => {
    if (entitlement.isPro) return false;
    const targetId = setId || String(setIndex);
    const unlocked = entitlement.unlockedSetIds || [];
    if (unlocked.includes(targetId) || unlocked.includes(String(setIndex))) {
      return false;
    }
    return setIndex > (entitlement.freeSetsPerWindow || 2);
  }, [entitlement.isPro, entitlement.unlockedSetIds, entitlement.freeSetsPerWindow]);

  const value = {
    ...entitlement,
    loading,
    lockedSheetOpen,
    lockedSet,
    openLockedSheet,
    closeLockedSheet,
    unlockViaAd,
    recordFirstAnswer,
    refreshEntitlement: () => fetchEntitlement(tier),
    isSetLocked,
  };

  return (
    <EntitlementContext.Provider value={value}>
      {children}
    </EntitlementContext.Provider>
  );
}

export function useEntitlement() {
  const context = useContext(EntitlementContext);
  if (!context) {
    throw new Error("useEntitlement must be used within EntitlementProvider");
  }
  return context;
}
