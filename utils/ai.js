// src/utils/ai.js
const BYOK_KEY = "qj_ai_byok_v1";

/** BYOK config از localStorage خوانده می‌شود */
function readBYOK() {
  try {
    const raw = localStorage.getItem(BYOK_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (!v?.apiKey || !v?.baseUrl) return null;
    // { enabled, apiKey, baseUrl, model }
    return v;
  } catch {
    return null;
  }
}

/** هدرهای BYOK را بر اساس ذخیره‌شده برمی‌گرداند (اگر فعال بود) */
function byokHeaders() {
  const cfg = readBYOK();
  if (!cfg || !cfg.enabled) return {};
  const h = {
    "x-api-key": cfg.apiKey,
    "x-base-url": cfg.baseUrl,
  };
  if (cfg.model) h["x-model"] = cfg.model;
  return h;
}

/** فراخوانی چت (OpenAI-compatible) از طریق پروکسی /api/ai/chat */
export async function askAI({ model, messages, temperature = 0.8, reasoning } = {}) {
  const r = await fetch("/api/ai/chat", {
    method: "POST",
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...byokHeaders(),
    },
    body: JSON.stringify({ model, messages, temperature, reasoning }),
  });

  const j = await r.json().catch(() => null);
  if (!r.ok) {
    const msg = j?.error || "AI request failed";
    throw new Error(typeof msg === "string" ? msg : "AI request failed");
  }
  const txt = (j?.content || "").trim();
  return txt;
}

/** داستان/شرح حماسی کوتاه برای یک تسک */
export async function epicifyTask(title, notes = "") {
  const sys =
    "You are a bard AI. Write a short, punchy, heroic vignette (60-120 words) about the user's quest. No bullet points.";
  const user =
    `Task title: "${title}"\nNotes: ${notes || "-"}\nTone: epic fantasy, adventurous, motivational.`;

  const out = await askAI({
    // اگر BYOK فعال باشد از همان مدل استفاده می‌شود؛ وگرنه از ENV (Grok از طریق OpenRouter)
    model: undefined,
    messages: [
      { role: "system", content: sys },
      { role: "user", content: user },
    ],
    temperature: 0.9,
  });
  return out;
}

/** تولید تصویر (اسکچ) از طریق پروکسی /api/ai/image — برای Journal */
export async function generateSketch(prompt, { model, size = "512x512", seed, negative_prompt } = {}) {
  const r = await fetch("/api/ai/image", {
    method: "POST",
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...byokHeaders(),
    },
    body: JSON.stringify({ prompt, model, size, seed, negative_prompt }),
  });

  const j = await r.json().catch(() => null);
  if (!r.ok) {
    const msg = j?.error || "Image generation failed";
    throw new Error(typeof msg === "string" ? msg : "Image generation failed");
  }
  // j: { image(dataURL), provider, model, size, seed }
  return j;
}
