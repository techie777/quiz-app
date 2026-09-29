// src/lib/adProvider.js
// Rewarded Ads Provider Adapter for Web (Google Publisher Tag + Fallback Simulator)

export const AD_MOMENTS = {
  START: "start",
  MID_QUIZ: "mid",
  RESULT: "result",
  REVIEW: "review",
  SHARE: "share",
};

export const AD_CONFIG = {
  maxAdMomentsPerSet: 5,
  midQuizMinQuestions: 10,
  fallbackTimeoutMs: 5000,
  gateChallengeInvite: false, // Challenge a friend invite links are NEVER gated
};

/**
 * Log ad event to server for admin analytics
 */
export async function logAdEvent({ trigger, tier, setId, status, deviceId }) {
  try {
    if (typeof window === "undefined") return;
    const devId = deviceId || localStorage.getItem("quiz_device_id") || "guest";
    await fetch("/api/admin/ad-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trigger,
        tier: tier || "explorer",
        setId: setId || "unknown",
        status, // 'requested', 'shown', 'completed', 'dismissed', 'blocked', 'no_fill'
        deviceId: devId,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {});
  } catch (e) {
    // Fail silently
  }
}

/**
 * Check if user is age-verified (18+)
 */
export function getAgeConsent() {
  if (typeof window === "undefined") return { asked: false, is18Plus: false };
  const val = localStorage.getItem("user_age_verified");
  if (!val) return { asked: false, is18Plus: false };
  return { asked: true, is18Plus: val === "true" };
}

export function setAgeConsent(is18Plus) {
  if (typeof window === "undefined") return;
  localStorage.setItem("user_age_verified", is18Plus ? "true" : "false");
}

/**
 * Detect ad blocker presence
 */
export async function detectAdBlocker() {
  if (typeof window === "undefined") return false;
  try {
    const testRequest = new Request(
      "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js",
      { method: "HEAD", mode: "no-cors" }
    );
    await fetch(testRequest);
    return false;
  } catch (e) {
    return true;
  }
}

/**
 * Show a rewarded ad with GPT adapter or graceful fallback simulation
 */
export async function showRewarded({
  trigger = AD_MOMENTS.START,
  tier = "explorer",
  setId = "",
  onReward = () => {},
  onDismiss = () => {},
  onError = () => {},
  onBlocked = () => {},
}) {
  // 1. Strict Exemption: Kids and Students NEVER see ads under any circumstances
  if (tier === "kids" || tier === "students") {
    onReward({ simulated: true, reason: "exempt_tier" });
    return;
  }

  // 2. Strict Exemption: Pro users never see ads
  if (typeof window !== "undefined") {
    const isPro = localStorage.getItem("user_is_pro") === "true";
    if (isPro) {
      onReward({ simulated: true, reason: "pro_user" });
      return;
    }
  }

  // 3. Strict Exemption: Daily Quiz & Learn content are exempt
  if (setId.startsWith("daily_") || setId.startsWith("learn_")) {
    onReward({ simulated: true, reason: "exempt_content" });
    return;
  }

  await logAdEvent({ trigger, tier, setId, status: "requested" });

  // 4. Check for Ad Blocker
  const isBlocked = await detectAdBlocker();
  if (isBlocked) {
    await logAdEvent({ trigger, tier, setId, status: "blocked" });
    if (onBlocked) {
      onBlocked();
      return;
    }
  }

  // 5. Try Google Publisher Tag (GPT) if initialized on window
  const gptAvailable = typeof window !== "undefined" && window.googletag && window.googletag.cmd;

  if (gptAvailable && window.__gptRewardedSlot) {
    let rewarded = false;
    let dismissed = false;

    // Timeout fallback if no-fill within 5 seconds
    const fallbackTimer = setTimeout(() => {
      if (!rewarded && !dismissed) {
        logAdEvent({ trigger, tier, setId, status: "no_fill" });
        // Fail-open per master prompt: let user continue if ad genuinely fails to load
        onReward({ simulated: true, reason: "no_fill_timeout" });
      }
    }, AD_CONFIG.fallbackTimeoutMs);

    try {
      window.googletag.cmd.push(() => {
        window.googletag.pubads().addEventListener("rewardedSlotGranted", () => {
          rewarded = true;
          clearTimeout(fallbackTimer);
          logAdEvent({ trigger, tier, setId, status: "completed" });
          onReward({ simulated: false });
        });

        window.googletag.pubads().addEventListener("rewardedSlotClosed", () => {
          dismissed = true;
          clearTimeout(fallbackTimer);
          if (!rewarded) {
            logAdEvent({ trigger, tier, setId, status: "dismissed" });
            onDismiss();
          }
        });

        window.googletag.display(window.__gptRewardedSlot);
      });
      return;
    } catch (err) {
      clearTimeout(fallbackTimer);
      console.warn("GPT rewarded slot error, falling back:", err);
    }
  }

  // 6. Graceful Web Fallback Simulator (Interactive sponsorship overlay)
  // Master prompt requirement: "Provider adapter (showRewarded) so the network can be swapped...
  // If an ad genuinely fails to load (no fill or error within 5 seconds), let the user continue and log it."
  if (typeof window !== "undefined") {
    dispatchRewardedSimulator({
      trigger,
      tier,
      setId,
      onReward: async () => {
        await logAdEvent({ trigger, tier, setId, status: "completed" });
        onReward({ simulated: true });
      },
      onDismiss: async () => {
        await logAdEvent({ trigger, tier, setId, status: "dismissed" });
        onDismiss();
      },
      onError: async (err) => {
        await logAdEvent({ trigger, tier, setId, status: "error" });
        onError(err);
      },
    });
  }
}

/**
 * Dispatch custom event to mount the Rewarded Ad Simulator Modal
 */
function dispatchRewardedSimulator(opts) {
  const event = new CustomEvent("quizweb_show_rewarded_sim", { detail: opts });
  window.dispatchEvent(event);
}
