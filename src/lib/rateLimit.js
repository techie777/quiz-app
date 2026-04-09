import { NextResponse } from "next/server";

// Simple in-memory rate limit (per instance). For multi-instance/prod, swap to Redis/Upstash.
const buckets = new Map();

function nowMs() {
  return Date.now();
}

function getClientIp(req) {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  const xr = req.headers.get("x-real-ip");
  if (xr) return xr.trim();
  return "unknown";
}

export function rateLimitKey(req, suffix = "") {
  const ip = getClientIp(req);
  return suffix ? `${ip}:${suffix}` : ip;
}

export function enforceRateLimit(key, { windowMs, max }) {
  const t = nowMs();
  const item = buckets.get(key);
  if (!item || t - item.resetAt >= windowMs) {
    buckets.set(key, { count: 1, resetAt: t });
    return { ok: true, remaining: max - 1, retryAfterSeconds: 0 };
  }
  if (item.count >= max) {
    const retryAfterSeconds = Math.ceil((windowMs - (t - item.resetAt)) / 1000);
    return { ok: false, remaining: 0, retryAfterSeconds };
  }
  item.count += 1;
  return { ok: true, remaining: Math.max(0, max - item.count), retryAfterSeconds: 0 };
}

export function rateLimitResponse(retryAfterSeconds, message = "Too many requests") {
  const res = NextResponse.json({ error: message }, { status: 429 });
  res.headers.set("Retry-After", String(Math.max(1, retryAfterSeconds || 1)));
  return res;
}

