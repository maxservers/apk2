import { verifySession, getCookie } from "../../_lib/auth.js";
import { ensureFriendCode } from "../../_lib/friendcode.js";

export async function onRequestGet({ request, env }) {
  const token = getCookie(request, "session");
  const payload = await verifySession(token, env.SESSION_SECRET);
  if (!payload || !payload.uid) {
    return new Response(JSON.stringify({ user: null }), {
      headers: { "content-type": "application/json" },
    });
  }

  try {
    const raw = await env.FEED_KV.get(`user:${payload.uid}`);
    if (!raw) {
      return new Response(JSON.stringify({ user: null }), {
        headers: { "content-type": "application/json" },
      });
    }
    let full = JSON.parse(raw);
    try {
      full = await ensureFriendCode(env, payload.uid, full);
    } catch {
      // non-fatal — user just won't have a code yet this time
    }
    const { passwordHash, salt, ...safeUser } = full;
    return new Response(JSON.stringify({ user: safeUser }), {
      headers: { "content-type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ user: null }), {
      headers: { "content-type": "application/json" },
    });
  }
}
