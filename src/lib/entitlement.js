/**
 * entitlement.js
 * Step 10: Server-side Entitlement, Free Limits & Access Control
 * 
 * - access_settings in DB:
 *     freeSetsPerWindow = 2
 *     windowMode = "rolling24h" (or "midnightIST")
 *     limitScope = "global" (or "perTier")
 * - A set counts once the user answers its first question.
 * - Daily Quiz and Learn content are permanently exempt.
 * - Pro users see no limits, no locks, and no ads across all 4 modules.
 * - Explorer & Arena can watch rewarded ads to unlock locked sets beyond the free limit.
 * - Kids & Students have no ad option (only countdown and Go Pro with parent gate).
 * - Guests are tracked by device_id and merged into user account on sign-in.
 */

import { getDb } from "./mongoDb.js";
import { ObjectId } from "mongodb";

export const DEFAULT_ACCESS_SETTINGS = {
  freeSetsPerWindow: 2,
  windowMode: "rolling24h", // "rolling24h" | "midnightIST"
  limitScope: "global",     // "global" | "perTier"
  maxAdMomentsPerSet: 5,
  gateChallengeInvite: false,
};

let cachedSettings = null;
let lastSettingsFetch = 0;

/**
 * Fetch access settings from DB with 60s in-memory caching
 */
export async function getAccessSettings() {
  const now = Date.now();
  if (cachedSettings && now - lastSettingsFetch < 60000) {
    return cachedSettings;
  }

  try {
    const db = await getDb();
    const doc = await db.collection("access_settings").findOne({ key: "default" });
    if (doc) {
      cachedSettings = {
        freeSetsPerWindow: typeof doc.freeSetsPerWindow === "number" ? doc.freeSetsPerWindow : DEFAULT_ACCESS_SETTINGS.freeSetsPerWindow,
        windowMode: doc.windowMode || DEFAULT_ACCESS_SETTINGS.windowMode,
        limitScope: doc.limitScope || DEFAULT_ACCESS_SETTINGS.limitScope,
        maxAdMomentsPerSet: doc.maxAdMomentsPerSet || DEFAULT_ACCESS_SETTINGS.maxAdMomentsPerSet,
        gateChallengeInvite: doc.gateChallengeInvite || false,
      };
    } else {
      cachedSettings = { ...DEFAULT_ACCESS_SETTINGS };
      // Seed default in DB
      await db.collection("access_settings").updateOne(
        { key: "default" },
        { $setOnInsert: { key: "default", ...DEFAULT_ACCESS_SETTINGS, createdAt: new Date(), updatedAt: new Date() } },
        { upsert: true }
      );
    }
    lastSettingsFetch = now;
    return cachedSettings;
  } catch (err) {
    console.error("Error fetching access_settings:", err);
    return DEFAULT_ACCESS_SETTINGS;
  }
}

/**
 * Format milliseconds remaining into human friendly countdown
 */
export function formatRemainingTime(ms, isHindi = false) {
  if (!ms || ms <= 0) return isHindi ? "उपलब्ध" : "Available";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return isHindi ? `${hours} घंटे ${minutes} मिनट` : `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return isHindi ? `${minutes} मिनट ${seconds} सेकंड` : `${minutes}m ${seconds}s`;
  }
  return isHindi ? `${seconds} सेकंड` : `${seconds}s`;
}

/**
 * Get IST Midnight bounds
 */
export function getISTMidnightBounds() {
  const now = new Date();
  // IST is UTC + 5:30
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffset);
  
  const istYear = istNow.getUTCFullYear();
  const istMonth = istNow.getUTCMonth();
  const istDate = istNow.getUTCDate();
  
  const istMidnightStart = new Date(Date.UTC(istYear, istMonth, istDate) - istOffset);
  const istMidnightEnd = new Date(istMidnightStart.getTime() + 24 * 60 * 60 * 1000);

  return { istMidnightStart, istMidnightEnd };
}

/**
 * Check user or device entitlement
 */
export async function checkEntitlement({
  userId = null,
  deviceId = null,
  tier = "adults",
  moduleId = "quiz",
  setId = null,
}) {
  const settings = await getAccessSettings();
  const db = await getDb();

  // 1. Exemptions check (Daily Quiz and Learn are exempt from limits)
  const isDaily = moduleId === "daily" || String(setId || "").startsWith("daily-");
  const isLearn = moduleId === "learn" || String(setId || "").startsWith("learn-");
  if (isDaily || isLearn) {
    return {
      isPro: false,
      isExempt: true,
      isLocked: false,
      remainingSets: Infinity,
      freeSetsPerWindow: settings.freeSetsPerWindow,
      usedSetsCount: 0,
      windowResetTime: null,
      countdownFormatted: "",
      canWatchAd: false,
      settings,
    };
  }

  // 2. Check Pro Subscription
  let isPro = false;
  if (userId) {
    try {
      const user = await db.collection("users").findOne({
        _id: ObjectId.isValid(userId) ? new ObjectId(userId) : userId
      });
      if (user?.isPro) {
        if (!user.proExpiresAt || new Date(user.proExpiresAt) > new Date()) {
          isPro = true;
        }
      }

      if (!isPro) {
        // Also check subscriptions collection
        const activeSub = await db.collection("subscriptions").findOne({
          userId: String(userId),
          status: "active",
          end: { $gt: new Date() }
        });
        if (activeSub) isPro = true;
      }
    } catch (e) {
      console.error("Pro check error:", e);
    }
  }

  if (isPro) {
    return {
      isPro: true,
      isExempt: false,
      isLocked: false,
      remainingSets: Infinity,
      freeSetsPerWindow: settings.freeSetsPerWindow,
      usedSetsCount: 0,
      windowResetTime: null,
      countdownFormatted: "",
      canWatchAd: false,
      settings,
    };
  }

  // 3. Quota Evaluation for Free Users & Guests
  const identifier = userId ? String(userId) : (deviceId ? String(deviceId) : "anonymous");
  const now = new Date();
  let windowStart = null;
  let windowEnd = null;

  if (settings.windowMode === "rolling24h") {
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Find all attempts in the last 24h
    const matchQuery = {
      userOrDeviceId: identifier,
      moduleId: { $nin: ["daily", "learn"] },
      firstAnsweredAt: { $gte: twentyFourHoursAgo }
    };
    if (settings.limitScope === "perTier") {
      matchQuery.tier = tier;
    }

    const recentAttempts = await db.collection("attempts")
      .find(matchQuery)
      .sort({ firstAnsweredAt: 1 })
      .toArray();

    if (recentAttempts.length > 0) {
      // The window started when the user answered the first question of their first set
      windowStart = new Date(recentAttempts[0].firstAnsweredAt);
      windowEnd = new Date(windowStart.getTime() + 24 * 60 * 60 * 1000);

      // Distinct set count in this window
      const distinctSets = new Set(
        recentAttempts
          .filter(a => new Date(a.firstAnsweredAt) <= windowEnd)
          .map(a => a.setId)
      );
      var usedSetsCount = distinctSets.size;
    } else {
      var usedSetsCount = 0;
    }
  } else {
    // midnightIST mode
    const { istMidnightStart, istMidnightEnd } = getISTMidnightBounds();
    windowStart = istMidnightStart;
    windowEnd = istMidnightEnd;

    const matchQuery = {
      userOrDeviceId: identifier,
      moduleId: { $nin: ["daily", "learn"] },
      firstAnsweredAt: { $gte: istMidnightStart, $lt: istMidnightEnd }
    };
    if (settings.limitScope === "perTier") {
      matchQuery.tier = tier;
    }

    const todayAttempts = await db.collection("attempts").find(matchQuery).toArray();
    var usedSetsCount = new Set(todayAttempts.map(a => a.setId)).size;
  }

  const freeSetsPerWindow = settings.freeSetsPerWindow;
  const remainingSets = Math.max(0, freeSetsPerWindow - usedSetsCount);
  const isLocked = remainingSets <= 0;

  let msRemaining = 0;
  if (windowEnd && now < windowEnd) {
    msRemaining = windowEnd.getTime() - now.getTime();
  }

  const countdownFormatted = msRemaining > 0 ? formatRemainingTime(msRemaining, false) : "";
  const countdownFormattedHi = msRemaining > 0 ? formatRemainingTime(msRemaining, true) : "";

  // Ad option is only allowed for Explorer (adults) and Arena, never Kids or Students
  const canWatchAd = isLocked && (tier === "adults" || tier === "explorer" || moduleId === "arena");

  // Check all setIds unlocked via ad in the last 24h
  let unlockedSetIds = [];
  try {
    const unlockedAttempts = await db.collection("attempts").find({
      userOrDeviceId: identifier,
      gatesPassed: "start",
      createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
    }).toArray();
    unlockedSetIds = unlockedAttempts.map(a => a.setId);
  } catch (e) {
    console.error("Error querying unlockedAttempts:", e);
  }

  const isCurrentSetUnlockedViaAd = setId ? unlockedSetIds.includes(String(setId)) : false;

  return {
    isPro: false,
    isExempt: false,
    isLocked: isLocked && !isCurrentSetUnlockedViaAd,
    isCurrentSetUnlockedViaAd,
    unlockedSetIds,
    remainingSets,
    usedSetsCount,
    freeSetsPerWindow,
    windowResetTime: windowEnd ? windowEnd.toISOString() : null,
    msRemaining,
    countdownFormatted,
    countdownFormattedHi,
    canWatchAd,
    tier,
    settings,
  };
}

/**
 * Record when a user answers the FIRST question of a set.
 * Master prompt requirement: "A set counts once the user answers its first question."
 */
export async function recordAttemptFirstAnswer({
  userId = null,
  deviceId = null,
  tier = "adults",
  moduleId = "quiz",
  setId,
  gatePassed = "start"
}) {
  if (!setId) return null;
  const db = await getDb();
  const identifier = userId ? String(userId) : (deviceId ? String(deviceId) : "anonymous");
  const now = new Date();

  // Exemption: Daily and Learn don't count towards sets
  if (moduleId === "daily" || moduleId === "learn" || String(setId).startsWith("daily-") || String(setId).startsWith("learn-")) {
    return { recorded: true, exempt: true };
  }

  try {
    // Check if an attempt for this set already exists in the last 6 hours
    const existing = await db.collection("attempts").findOne({
      userOrDeviceId: identifier,
      setId: String(setId),
      firstAnsweredAt: { $gte: new Date(now.getTime() - 6 * 60 * 60 * 1000) }
    });

    if (existing) {
      // Set already started, ensure gate is marked
      if (gatePassed && !existing.gatesPassed?.includes(gatePassed)) {
        await db.collection("attempts").updateOne(
          { _id: existing._id },
          { $addToSet: { gatesPassed: gatePassed } }
        );
      }
      return { recorded: true, attemptId: existing._id.toString(), isNew: false };
    }

    const doc = {
      userOrDeviceId: identifier,
      setId: String(setId),
      tier: tier || "adults",
      moduleId: moduleId || "quiz",
      gatesPassed: gatePassed ? [gatePassed] : ["start"],
      firstAnsweredAt: now,
      completedAt: null,
      createdAt: now,
    };

    const result = await db.collection("attempts").insertOne(doc);
    return { recorded: true, attemptId: result.insertedId.toString(), isNew: true };
  } catch (err) {
    console.error("recordAttemptFirstAnswer error:", err);
    return { recorded: false, error: err.message };
  }
}

/**
 * Mark a gate as passed on an attempt (e.g. "start", "mid", "result", "review")
 */
export async function recordGatePassed({
  userId = null,
  deviceId = null,
  setId,
  gate,
  tier = "adults",
  moduleId = "quiz",
}) {
  if (!setId || !gate) return false;
  const db = await getDb();
  const identifier = userId ? String(userId) : (deviceId ? String(deviceId) : "anonymous");
  const now = new Date();

  try {
    const res = await db.collection("attempts").updateOne(
      {
        userOrDeviceId: identifier,
        setId: String(setId),
        createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
      },
      {
        $addToSet: { gatesPassed: gate },
        $setOnInsert: {
          userOrDeviceId: identifier,
          setId: String(setId),
          tier: tier || "adults",
          moduleId: moduleId || "quiz",
          createdAt: now,
        }
      },
      { upsert: true }
    );
    return res.modifiedCount > 0 || res.matchedCount > 0 || res.upsertedCount > 0;
  } catch (err) {
    console.error("recordGatePassed error:", err);
    return false;
  }
}

/**
 * Merge guest attempts to user account on sign in
 */
export async function mergeGuestAttempts(deviceId, userId) {
  if (!deviceId || !userId) return;
  try {
    const db = await getDb();
    await db.collection("attempts").updateMany(
      { userOrDeviceId: String(deviceId) },
      { $set: { userOrDeviceId: String(userId) } }
    );
  } catch (err) {
    console.error("mergeGuestAttempts error:", err);
  }
}
