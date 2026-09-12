import {
  signSession,
  makeSessionCookie,
  SESSION_MAX_AGE,
  randomColor,
} from "../../../_lib/auth.js";

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) {
    return Response.redirect(`${url.origin}/?login=failed`, 302);
  }
  const redirectUri = `${url.origin}/api/auth/google/callback`;

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) {
      return Response.redirect(`${url.origin}/?login=failed`, 302);
    }
    const tokenData = await tokenRes.json();

    const userRes = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    );
    if (!userRes.ok) {
      return Response.redirect(`${url.origin}/?login=failed`, 302);
    }
    const profile = await userRes.json();
    const email = (profile.email || "").toLowerCase().trim();
    if (!email) {
      return Response.redirect(`${url.origin}/?login=failed`, 302);
    }

    const userKey = `user:${email}`;
    const userRaw = await env.FEED_KV.get(userKey);
    let user;
    if (userRaw) {
      user = JSON.parse(userRaw);
    } else {
      // New Google account: leave name blank on purpose — the app will
      // ask the person to pick a display name the first time they land.
      user = {
        id: email,
        email,
        name: "",
        provider: "google",
        avatarUrl: null,
        color: randomColor(),
        createdAt: Date.now(),
      };
      await env.FEED_KV.put(userKey, JSON.stringify(user));
    }

    const token = await signSession(
      { uid: email, exp: Date.now() + SESSION_MAX_AGE * 1000 },
      env.SESSION_SECRET
    );

    return new Response(null, {
      status: 302,
      headers: {
        Location: `${url.origin}/`,
        "Set-Cookie": makeSessionCookie(token, SESSION_MAX_AGE),
      },
    });
  } catch (e) {
    return Response.redirect(`${url.origin}/?login=failed`, 302);
  }
}
