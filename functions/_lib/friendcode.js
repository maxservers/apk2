// Unique, randomly-assigned per-user ID in the form "max123-456".
// Used for adding friends and for official-only access grants, so
// people don't have to type someone's raw username/email.

const CODE_CHANGE_COOLDOWN_MS = 180 * 24 * 60 * 60 * 1000; // ~6 months

function randomDigits(n) {
  let s = "";
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10);
  return s;
}

export function generateCandidateCode() {
  return `max${randomDigits(3)}-${randomDigits(3)}`;
}

function normalizeCode(code) {
  return (code || "").trim().toLowerCase();
}

// Reserve a fresh, unused code for `uid`. Retries on collision.
export async function reserveNewCode(env, uid, { maxAttempts = 20 } = {}) {
  for (let i = 0; i < maxAttempts; i++) {
    const candidate = generateCandidateCode();
    const key = `code:${candidate}`;
    const existing = await env.FEED_KV.get(key);
    if (!existing) {
      await env.FEED_KV.put(key, uid);
      return candidate;
    }
  }
  throw new Error("无法分配唯一ID，请重试");
}

export async function releaseCode(env, code) {
  if (!code) return;
  await env.FEED_KV.delete(`code:${normalizeCode(code)}`);
}

// Ensure the given user record has a friendCode; assigns and persists
// one (plus the code:<code> -> uid index) if missing. Returns the
// (possibly updated) user object.
export async function ensureFriendCode(env, uid, user) {
  if (user && user.friendCode) return user;
  const code = await reserveNewCode(env, uid);
  const next = { ...user, friendCode: code };
  await env.FEED_KV.put(`user:${uid}`, JSON.stringify(next));
  return next;
}

// Given whatever the client typed (could be a raw uid/username/email,
// or one of these friend codes), resolve it to the canonical uid.
// Returns null if nothing matches.
export async function resolveTargetToUid(env, rawTarget) {
  const target = (rawTarget || "").trim();
  if (!target) return null;
  const direct = await env.FEED_KV.get(`user:${target.toLowerCase()}`);
  if (direct) return target.toLowerCase();

  const codeKey = `code:${normalizeCode(target)}`;
  const uid = await env.FEED_KV.get(codeKey);
  if (uid) return uid;

  return null;
}

export function canChangeCode(user) {
  const last = user && user.friendCodeChangedAt;
  if (!last) return { allowed: true };
  const elapsed = Date.now() - last;
  if (elapsed >= CODE_CHANGE_COOLDOWN_MS) return { allowed: true };
  const remainingMs = CODE_CHANGE_COOLDOWN_MS - elapsed;
  const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
  return { allowed: false, remainingDays };
}

export { CODE_CHANGE_COOLDOWN_MS };
