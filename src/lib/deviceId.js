"use client";

/**
 * deviceId.js
 * Generates and caches a persistent unique device identifier for anonymous/guest tracking.
 */

const DEVICE_ID_KEY = "quizweb_device_id";

export function getOrCreateDeviceId() {
  if (typeof window === "undefined") return "server-side";

  try {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = "dev_" + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
      // Also store in cookie for server headers
      document.cookie = `${DEVICE_ID_KEY}=${deviceId}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    }
    return deviceId;
  } catch {
    return "guest-fallback";
  }
}
