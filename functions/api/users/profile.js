import { verifySession, getCookie } from "../../_lib/auth.js";

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const id = (url.searchParams.get("id") || "").trim();
  if (!id) {
    return new Response(JSON.stringify({ error: "参数不对" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const raw = await env.FEED_KV.get(`user:${id}`);
  if (!raw) {
    return new Response(JSON.stringify({ error: "找不到这个用户" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }
  const u = JSON.parse(raw);

  const token = getCookie(request, "session");
  const payload = await verifySession(token, env.SESSION_SECRET);
  const myId = payload && payload.uid ? payload.uid : null;

  const [followersPage, followingPage] = await Promise.all([
    env.FEED_KV.list({ prefix: `follower:${id}:`, limit: 1000 }),
    env.FEED_KV.list({ prefix: `following:${id}:`, limit: 1000 }),
  ]);

  let isFollowing = false;
  let isFriend = false;
  if (myId && myId !== id) {
    const [f1, f2] = await Promise.all([
      env.FEED_KV.get(`following:${myId}:${id}`),
      env.FEED_KV.get(`friend:${myId}:${id}`),
    ]);
    isFollowing = !!f1;
    isFriend = !!f2;
  }

  return new Response(
    JSON.stringify({
      user: {
        id: u.id || id,
        name: u.name || id,
        avatarUrl: u.avatarUrl || null,
        bannerUrl: u.bannerUrl || null,
        color: u.color || null,
        role: u.role || "user",
        bio: u.bio || "",
        hobby: u.hobby || "",
        ipLocation: u.ipLocation || "",
        createdAt: u.createdAt || null,
      },
      followersCount: followersPage.keys.length,
      followingCount: followingPage.keys.length,
      isSelf: myId === id,
      isFollowing,
      isFriend,
    }),
    { headers: { "content-type": "application/json" } }
  );
}
