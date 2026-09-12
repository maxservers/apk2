// Firebase Cloud Messaging (HTTP v1) helper.
//
// Requires env.FCM_SERVICE_ACCOUNT_JSON — the full JSON contents of a Firebase
// service account key (Firebase Console -> Project settings -> Service accounts
// -> Generate new private key). Set it with:
//   wrangler pages secret put FCM_SERVICE_ACCOUNT_JSON
// (paste the whole JSON file content as the value)

const encoder = new TextEncoder();

function base64url(input) {
  const str = typeof input === "string" ? input : btoa(String.fromCharCode(...input));
  return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToBinary(pem) {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function getAccessToken(env) {
  const cacheKey = "fcm:access_token";
  if (env.FEED_KV) {
    const cached = await env.FEED_KV.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.exp > Date.now() + 60_000) return parsed.token;
    }
  }

  const sa = JSON.parse(env.FCM_SERVICE_ACCOUNT_JSON);
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const signInput = `${base64url(btoa(JSON.stringify(header)))}.${base64url(btoa(JSON.stringify(claim)))}`;

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    pemToBinary(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuf = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, encoder.encode(signInput));
  const jwt = `${signInput}.${base64url(new Uint8Array(sigBuf))}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: `grant_type=${encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer")}&assertion=${jwt}`,
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error("FCM 授权失败: " + JSON.stringify(data));
  }

  if (env.FEED_KV) {
    await env.FEED_KV.put(
      cacheKey,
      JSON.stringify({ token: data.access_token, exp: Date.now() + (data.expires_in - 60) * 1000 }),
      { expirationTtl: Math.max(60, data.expires_in - 30) }
    );
  }
  return data.access_token;
}

// Sends a push notification to every device token registered for `uid`.
// Silently does nothing if FCM isn't configured or the user has no tokens.
// Never throws — a push failure should never break the caller's main request.
export async function sendPushToUser(env, uid, { title, body, data = {} }) {
  if (!env.FCM_SERVICE_ACCOUNT_JSON || !env.FEED_KV) return;
  try {
    const raw = await env.FEED_KV.get(`push:${uid}`);
    const tokens = raw ? JSON.parse(raw) : [];
    if (!tokens.length) return;

    const sa = JSON.parse(env.FCM_SERVICE_ACCOUNT_JSON);
    const accessToken = await getAccessToken(env);
    const stringData = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)]));

    const results = await Promise.allSettled(
      tokens.map((tok) =>
        fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            message: {
              token: tok,
              notification: { title, body },
              data: stringData,
              android: { priority: "high" },
            },
          }),
        })
      )
    );

    const stillValid = tokens.filter((_, i) => {
      const r = results[i];
      // Drop tokens FCM reports as invalid/unregistered; keep on any other outcome.
      return !(r.status === "fulfilled" && (r.value.status === 404 || r.value.status === 400));
    });
    if (stillValid.length !== tokens.length) {
      await env.FEED_KV.put(`push:${uid}`, JSON.stringify(stillValid));
    }
  } catch (e) {
    console.error("push failed", e);
  }
}
