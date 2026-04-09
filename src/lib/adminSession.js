import crypto from "crypto";

const COOKIE_NAME = "admin_session";

function b64urlEncode(buf) {
  return Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function b64urlDecodeToBuffer(str) {
  const s = String(str || "").replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return Buffer.from(s + pad, "base64");
}

function hmac(secret, data) {
  return crypto.createHmac("sha256", secret).update(data).digest();
}

export function createAdminSessionToken({ adminId, role, username }, { secret, ttlSeconds }) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    v: 1,
    adminId,
    role,
    username,
    iat: now,
    exp: now + ttlSeconds,
    nonce: crypto.randomBytes(8).toString("hex"),
  };
  const body = b64urlEncode(JSON.stringify(payload));
  const sig = b64urlEncode(hmac(secret, body));
  return `${body}.${sig}`;
}

export function verifyAdminSessionToken(token, { secret }) {
  const raw = String(token || "");
  const parts = raw.split(".");
  if (parts.length !== 2) return { ok: false };
  const [body, sig] = parts;
  const expected = b64urlEncode(hmac(secret, body));
  const a = Buffer.from(expected);
  const b = Buffer.from(String(sig));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return { ok: false };

  let payload;
  try {
    payload = JSON.parse(b64urlDecodeToBuffer(body).toString("utf8"));
  } catch {
    return { ok: false };
  }
  const now = Math.floor(Date.now() / 1000);
  if (!payload?.adminId || !payload?.exp || payload.exp < now) return { ok: false };
  return { ok: true, payload };
}

export function adminSessionCookieName() {
  return COOKIE_NAME;
}

