const encoder = new TextEncoder();

function base64url(bytes) {
  let str = btoa(String.fromCharCode(...bytes));
  return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlToBytes(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const bin = atob(str);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function signSession(payload, secret) {
  const key = await hmacKey(secret);
  const json = JSON.stringify(payload);
  const payloadB64 = base64url(encoder.encode(json));
  const sigBuf = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadB64));
  const sigB64 = base64url(new Uint8Array(sigBuf));
  return `${payloadB64}.${sigB64}`;
}

export async function verifySession(token, secret) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;
  try {
    const key = await hmacKey(secret);
    const sigBytes = base64urlToBytes(sigB64);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      encoder.encode(payloadB64)
    );
    if (!valid) return null;
    const json = new TextDecoder().decode(base64urlToBytes(payloadB64));
    const payload = JSON.parse(json);
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  const match = header.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

export function makeSessionCookie(token, maxAgeSeconds) {
  // SameSite=None（配合 Secure）是因为离线打包的 App 加载的是 https://localhost，
  // 请求后端 API 时属于"跨站"请求，SameSite=Lax 会导致浏览器/WebView 不带上这个 Cookie。
  // 网页版直接访问 maxwrb.pages.dev 时是同源请求，不受 SameSite=None 影响，行为不变。
  return `session=${encodeURIComponent(
    token
  )}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${maxAgeSeconds}`;
}

export function clearSessionCookie() {
  return `session=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0`;
}

export function genCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

const PALETTE = [
  "#0f6e5c",
  "#2d3a63",
  "#a45a2a",
  "#5b4b8a",
  "#3d6b8a",
  "#8a3d55",
  "#6b8a3d",
  "#8a6a2a",
];

export function randomColor() {
  return PALETTE[Math.floor(Math.random() * PALETTE.length)];
}

function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function randomSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

export async function hashPassword(password, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: encoder.encode(salt), iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return bytesToHex(new Uint8Array(bits));
}

export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
