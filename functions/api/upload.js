// Cloudflare Pages Function.
// Forwards an uploaded image (server-to-server, no CORS issues) to
// freeimage.host using their public demo API key — no signup or account
// needed on your end at all. Returns the hosted image URL.

const MAX_BYTES = 12 * 1024 * 1024; // 12MB safety cap
const PUBLIC_DEMO_KEY = "6d207e02198a847aa98d0a2a901485a5";

export async function onRequestPost({ request }) {
  let form;
  try {
    form = await request.formData();
  } catch (e) {
    return json({ error: "invalid form data" }, 400);
  }

  const file = form.get("file");
  if (!file || typeof file === "string") {
    return json({ error: "no file provided" }, 400);
  }
  if (file.size > MAX_BYTES) {
    return json({ error: "file too large (max 12MB)" }, 400);
  }
  if (!file.type || !file.type.startsWith("image/")) {
    return json({ error: "only image files are allowed" }, 400);
  }

  const forwardForm = new FormData();
  forwardForm.append("key", PUBLIC_DEMO_KEY);
  forwardForm.append("action", "upload");
  forwardForm.append("format", "json");
  forwardForm.append("source", file, file.name || "upload.jpg");

  let res;
  try {
    res = await fetch("https://freeimage.host/api/1/upload", {
      method: "POST",
      body: forwardForm,
    });
  } catch (e) {
    return json({ error: "upload host unreachable" }, 502);
  }

  let data;
  try {
    data = await res.json();
  } catch (e) {
    return json({ error: "upload host returned invalid response" }, 502);
  }

  const url = data && data.image && data.image.url;
  if (!res.ok || !url) {
    return json({ error: "upload failed", detail: JSON.stringify(data).slice(0, 300) }, 502);
  }

  return json({ url });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}
