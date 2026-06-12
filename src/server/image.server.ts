export interface ImageGenResult {
  imageUrl: string; // data: URL or hosted URL
  error?: string;
}

const styleHints: Record<string, string> = {
  photorealistic: "ultra-realistic photography, natural lighting, depth of field, 8k",
  "3d-render": "modern 3D render, octane, soft lighting, vibrant colors",
  illustration: "clean vector illustration, flat design, bold colors",
  minimal: "minimalist design, lots of negative space, single focal subject",
  cinematic: "cinematic composition, dramatic lighting, film grain, moody",
  cyberpunk: "cyberpunk aesthetic, neon, holographic, futuristic",
};

const aspectHints: Record<string, string> = {
  square: "square 1:1 composition, perfectly centered",
  portrait: "vertical 9:16 composition for stories/reels",
  landscape: "horizontal 16:9 composition for blog/twitter cards",
};

const templateHints: Record<string, string> = {
  "quote-card":
    "Beautiful quote card design with elegant typography, the quote text rendered clearly and centered, decorative background, social-share ready",
  thumbnail:
    "YouTube thumbnail style, bold large text overlay, high-contrast subject, dramatic lighting, eye-catching colors, click-worthy composition",
  carousel:
    "Instagram carousel slide, bold heading at top, clean modern layout, brand-friendly, designed as slide 1 of a multi-slide post",
  "blog-cover":
    "Blog cover image, clean editorial style, subtle title space at top, professional and modern",
  "product-mockup":
    "Premium product mockup, studio lighting, clean background, marketing-grade",
};

function buildPrompt(prompt: string, style?: string, aspect?: string, template?: string) {
  const parts = [prompt];
  if (template && templateHints[template]) parts.push(templateHints[template]);
  if (style && styleHints[style]) parts.push(styleHints[style]);
  if (aspect && aspectHints[aspect]) parts.push(aspectHints[aspect]);
  parts.push("High quality, professional, share-worthy social media visual.");
  return parts.join(". ");
}

export type ImageModel = "auto" | "flux" | "gpt" | "gemini";

// Stable image models in fallback order. Lovable AI Gateway is used as the
// fallback when Replicate is unavailable or for image-edit (multimodal) calls.
const IMAGE_MODELS = [
  "google/gemini-2.5-flash-image",
  "google/gemini-3.1-flash-image-preview",
];

const REPLICATE_ASPECT: Record<string, string> = {
  square: "1:1",
  portrait: "9:16",
  landscape: "16:9",
};

const OPENAI_SIZE: Record<string, string> = {
  square: "1024x1024",
  portrait: "1024x1792",
  landscape: "1792x1024",
};

// OpenAI gpt-image-2 (text-perfect image generation). Falls back to
// gpt-image-1 if the requested model id is rejected.
async function callOpenAIImage(
  prompt: string,
  aspect: "square" | "portrait" | "landscape" = "square",
  quality: "standard" | "hd" = "standard",
): Promise<ImageGenResult> {
  const key = process.env.Openai_api || process.env.OPENAI_API_KEY;
  if (!key) return { imageUrl: "", error: "OpenAI key not configured" };

  const size = OPENAI_SIZE[aspect] || "1024x1024";
  const models = ["gpt-image-2", "gpt-image-1"];
  let lastErr = "OpenAI image generation failed";

  for (const model of models) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 55_000);
      const res = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        signal: ctrl.signal,
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          prompt: prompt.slice(0, 4000),
          n: 1,
          size,
          quality: quality === "hd" ? "high" : "medium",
        }),
      }).finally(() => clearTimeout(t));

      if (!res.ok) {
        const text = await res.text();
        console.error(`OpenAI ${model} error:`, res.status, text.slice(0, 300));
        if (res.status === 401) return { imageUrl: "", error: "OpenAI auth failed. Check Openai_api secret." };
        if (res.status === 429) return { imageUrl: "", error: "OpenAI rate limit reached. Try again shortly." };
        if (res.status === 402) return { imageUrl: "", error: "OpenAI billing issue — add credits at platform.openai.com." };
        // Unknown model → try fallback (gpt-image-1)
        if ((res.status === 400 || res.status === 404) && /model/i.test(text)) { lastErr = `OpenAI ${model} unavailable`; continue; }
        lastErr = `OpenAI error (${res.status})`;
        continue;
      }
      const j: any = await res.json();
      const item = j?.data?.[0];
      if (item?.b64_json) return { imageUrl: `data:image/png;base64,${item.b64_json}` };
      if (item?.url) return { imageUrl: item.url };
      lastErr = "OpenAI returned no image";
    } catch (err: any) {
      console.error(`OpenAI ${model} request error:`, err?.message || err);
      lastErr = "Failed to reach OpenAI";
    }
  }
  return { imageUrl: "", error: lastErr };
}

// Replicate Flux 1.1 Pro — premium photorealistic generation.
// Worker-friendly async pattern: create prediction (returns instantly with an ID),
// then poll with short, individually-timed subrequests inside the Worker's budget.
// Avoids Prefer: wait — that single long-lived subrequest is what was getting
// killed by Cloudflare Workers and producing "No image returned".
async function callReplicateFlux(
  prompt: string,
  aspect: "square" | "portrait" | "landscape" = "square",
): Promise<ImageGenResult> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return { imageUrl: "", error: "REPLICATE_API_TOKEN not configured" };

  // Wall-clock cap below Worker subrequest aggregate limit.
  const MAX_WAIT_MS = 55_000;
  const POLL_INTERVAL_MS = 1500;
  const SUBREQUEST_TIMEOUT_MS = 8000;

  const fetchWithTimeout = async (url: string, init: RequestInit, ms: number) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    try {
      return await fetch(url, { ...init, signal: ctrl.signal });
    } finally {
      clearTimeout(t);
    }
  };

  let prediction: any;
  try {
    const createRes = await fetchWithTimeout(
      "https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: {
            prompt: prompt.slice(0, 2000),
            aspect_ratio: REPLICATE_ASPECT[aspect] || "1:1",
            output_format: "jpg",
            output_quality: 90,
            safety_tolerance: 2,
            prompt_upsampling: true,
          },
        }),
      },
      SUBREQUEST_TIMEOUT_MS,
    );

    if (!createRes.ok) {
      const text = await createRes.text();
      console.error("Replicate create error:", createRes.status, text.slice(0, 300));
      if (createRes.status === 401 || createRes.status === 403)
        return { imageUrl: "", error: "Replicate authentication failed. Check REPLICATE_API_TOKEN." };
      if (createRes.status === 402)
        return { imageUrl: "", error: "Replicate billing issue — add credits at replicate.com." };
      if (createRes.status === 422)
        return { imageUrl: "", error: `Replicate rejected the prompt: ${text.slice(0, 200)}` };
      if (createRes.status === 429)
        return { imageUrl: "", error: "Replicate rate limit reached. Try again shortly." };
      return { imageUrl: "", error: `Replicate error (${createRes.status})` };
    }

    prediction = await createRes.json();
  } catch (err: any) {
    console.error("Replicate create request error:", err?.message || err);
    return { imageUrl: "", error: "Failed to reach Replicate (create timed out)" };
  }

  const getUrl: string | undefined = prediction?.urls?.get;
  if (!getUrl) {
    console.error("Replicate response missing urls.get:", JSON.stringify(prediction).slice(0, 300));
    return { imageUrl: "", error: "Replicate returned an unexpected response" };
  }

  // Short sleep helper
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const started = Date.now();
  while (
    prediction?.status !== "succeeded" &&
    prediction?.status !== "failed" &&
    prediction?.status !== "canceled"
  ) {
    if (Date.now() - started > MAX_WAIT_MS) {
      console.warn(
        `Replicate poll exceeded ${MAX_WAIT_MS}ms (last status=${prediction?.status}, id=${prediction?.id})`,
      );
      return {
        imageUrl: "",
        error:
          "Replicate is taking longer than expected. The image may still complete — check back in a moment, or try again.",
      };
    }
    await sleep(POLL_INTERVAL_MS);
    try {
      const pollRes = await fetchWithTimeout(
        getUrl,
        { headers: { Authorization: `Bearer ${token}` } },
        SUBREQUEST_TIMEOUT_MS,
      );
      if (!pollRes.ok) {
        const text = await pollRes.text();
        console.error("Replicate poll error:", pollRes.status, text.slice(0, 200));
        // brief transient errors -> keep polling
        if (pollRes.status >= 500) continue;
        return { imageUrl: "", error: `Replicate poll failed (${pollRes.status})` };
      }
      prediction = await pollRes.json();
    } catch (err: any) {
      console.warn("Replicate poll subrequest aborted:", err?.message || err);
      // single transient failure — keep going
      continue;
    }
  }

  if (prediction?.status === "succeeded") {
    const out = prediction.output;
    const url = Array.isArray(out) ? out[0] : typeof out === "string" ? out : null;
    if (url) return { imageUrl: url };
    console.error("Replicate succeeded with no output:", JSON.stringify(prediction).slice(0, 300));
    return { imageUrl: "", error: "Replicate returned no image URL" };
  }
  return {
    imageUrl: "",
    error: prediction?.error || `Replicate ${prediction?.status || "generation failed"}`,
  };
}

async function callImageAIOnce(
  model: string,
  messages: any[],
  apiKey: string,
): Promise<{ result: ImageGenResult; retriable: boolean }> {
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages, modalities: ["image", "text"] }),
    });

    if (response.status === 429)
      return { result: { imageUrl: "", error: "Rate limit reached. Try again shortly." }, retriable: false };
    if (response.status === 402)
      return { result: { imageUrl: "", error: "AI credits exhausted." }, retriable: false };
    if (!response.ok) {
      const text = await response.text();
      console.error(`Image AI error [${model}]:`, response.status, text.slice(0, 300));
      return { result: { imageUrl: "", error: `Image generation failed (${response.status}).` }, retriable: true };
    }

    const data = await response.json();
    const url = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!url) {
      console.error(`No image in response [${model}]:`, JSON.stringify(data).slice(0, 500));
      return { result: { imageUrl: "", error: "No image returned." }, retriable: true };
    }
    return { result: { imageUrl: url }, retriable: false };
  } catch (err) {
    console.error(`Image gen error [${model}]:`, err);
    return { result: { imageUrl: "", error: "Failed to connect to AI service." }, retriable: true };
  }
}

async function callImageAI(messages: any[]): Promise<ImageGenResult> {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  if (!LOVABLE_API_KEY) return { imageUrl: "", error: "AI service not configured" };

  let last: ImageGenResult = { imageUrl: "", error: "No image returned." };
  for (const model of IMAGE_MODELS) {
    const { result, retriable } = await callImageAIOnce(model, messages, LOVABLE_API_KEY);
    if (result.imageUrl) return result;
    last = result;
    if (!retriable) return result; // rate limit / no credits → don't try other models
  }
  return last;
}

// Text-to-image with explicit model routing.
//   flux   → Replicate Flux 1.1 Pro (photorealism, no required text)
//   gpt    → OpenAI gpt-image-2 (text-perfect overlays, thumbnails, carousels)
//   gemini → Lovable AI Gateway (Gemini Flash image — fast, free tier)
//   auto   → Gemini first, then Replicate Flux as fallback (legacy behavior)
async function generateFromPrompt(
  fullPrompt: string,
  aspect: "square" | "portrait" | "landscape",
  model: ImageModel = "auto",
  quality: "standard" | "hd" = "standard",
): Promise<ImageGenResult> {
  if (model === "gpt") {
    const r = await callOpenAIImage(fullPrompt, aspect, quality);
    if (r.imageUrl) return r;
    // Soft fallback to Gemini so users aren't blocked
    const fb = await callImageAI([{ role: "user", content: fullPrompt }]);
    if (fb.imageUrl) return fb;
    return r;
  }

  if (model === "flux") {
    if (process.env.REPLICATE_API_TOKEN) {
      const r = await callReplicateFlux(fullPrompt, aspect);
      if (r.imageUrl) return r;
      // Soft fallback to Gemini
      const fb = await callImageAI([{ role: "user", content: fullPrompt }]);
      if (fb.imageUrl) return fb;
      return r;
    }
    return callImageAI([{ role: "user", content: fullPrompt }]);
  }

  if (model === "gemini") {
    return callImageAI([{ role: "user", content: fullPrompt }]);
  }

  // auto: Gemini first, Replicate Flux as fallback
  const primary = await callImageAI([{ role: "user", content: fullPrompt }]);
  if (primary.imageUrl) return primary;
  if (primary.error && /credits|rate limit/i.test(primary.error)) return primary;
  if (process.env.REPLICATE_API_TOKEN) {
    const r = await callReplicateFlux(fullPrompt, aspect);
    if (r.imageUrl) return r;
    return r;
  }
  return primary;
}

export async function generateSocialImage(
  prompt: string,
  style: string,
  aspect: string,
  template?: string,
  model: ImageModel = "auto",
  quality: "standard" | "hd" = "standard",
  negativePrompt?: string,
): Promise<ImageGenResult> {
  let fullPrompt = buildPrompt(prompt, style, aspect, template);
  if (negativePrompt && negativePrompt.trim()) {
    fullPrompt += `. Avoid: ${negativePrompt.trim()}`;
  }
  const a = (aspect as "square" | "portrait" | "landscape") || "square";
  return generateFromPrompt(fullPrompt, a, model, quality);
}

export async function generateVariations(
  prompt: string,
  style: string,
  aspect: string,
  template: string | undefined,
  count: number,
  model: ImageModel = "auto",
  quality: "standard" | "hd" = "standard",
): Promise<ImageGenResult[]> {
  const variants = [
    "",
    "alternative composition, different angle",
    "different color palette, fresh mood",
    "different lighting and atmosphere",
  ];
  const a = (aspect as "square" | "portrait" | "landscape") || "square";
  const tasks = Array.from({ length: count }).map((_, i) => {
    const variantHint = variants[i % variants.length];
    const finalPrompt = buildPrompt(
      variantHint ? `${prompt} (${variantHint})` : prompt,
      style,
      aspect,
      template,
    );
    return generateFromPrompt(finalPrompt, a, model, quality);
  });
  return Promise.all(tasks);
}

// Enhance a basic prompt into a detailed one using a text model.
export async function enhanceImagePrompt(
  rawPrompt: string,
  model: ImageModel,
  style?: string,
): Promise<{ prompt: string; error?: string }> {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  if (!LOVABLE_API_KEY) return { prompt: rawPrompt, error: "AI not configured" };
  const target =
    model === "gpt"
      ? "OpenAI gpt-image-2 (great at rendering exact text overlays)"
      : model === "flux"
        ? "Flux Pro 1.1 (photorealistic; loves camera terms like f/2.8, golden hour, cinematic)"
        : "Gemini Flash image";
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              `You are an expert prompt engineer for AI image generation. Rewrite the user's basic prompt into a single detailed, vivid prompt for ${target}. Keep the core idea. Add lighting, composition, color, mood, lens/style details where helpful. ${style ? `Match this style: ${style}.` : ""} Max 120 words. Return ONLY the rewritten prompt, no preface, no quotes.`,
          },
          { role: "user", content: rawPrompt.slice(0, 1500) },
        ],
      }),
    });
    if (!res.ok) return { prompt: rawPrompt, error: `Enhancer error (${res.status})` };
    const j: any = await res.json();
    const out = (j.choices?.[0]?.message?.content || "").trim();
    return { prompt: out || rawPrompt };
  } catch (e: any) {
    return { prompt: rawPrompt, error: e?.message || "Enhancer failed" };
  }
}

export async function editImage(
  imageDataUrl: string,
  instruction: string,
): Promise<ImageGenResult> {
  return callImageAI([
    {
      role: "user",
      content: [
        { type: "text", text: instruction },
        { type: "image_url", image_url: { url: imageDataUrl } },
      ],
    },
  ]);
}

// Generate a 5-slide Instagram carousel with consistent style/typography
export async function generateCarouselSet(
  topic: string,
  style: string,
): Promise<{ results: ImageGenResult[]; slides: { title: string; body: string }[] }> {
  // Step 1: ask a text model for slide copy + a shared visual style descriptor
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  let slides: { title: string; body: string }[] = [];
  let visualLanguage =
    "consistent typography (bold sans-serif), unified color palette, identical layout grid, brand-cohesive";

  try {
    const planRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You design Instagram carousels. Reply with strict JSON only: {\"visualLanguage\":\"...\",\"slides\":[{\"title\":\"...\",\"body\":\"...\"}, x5]}. Slide 1 = hook cover. Slides 2-4 = value/insight. Slide 5 = CTA. Titles ≤6 words, body ≤16 words.",
          },
          { role: "user", content: `Topic: ${topic}` },
        ],
      }),
    });
    if (planRes.ok) {
      const j = await planRes.json();
      const txt = j.choices?.[0]?.message?.content || "";
      const match = txt.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed.slides)) slides = parsed.slides.slice(0, 5);
        if (parsed.visualLanguage) visualLanguage = parsed.visualLanguage;
      }
    }
  } catch (e) {
    console.error("carousel plan error", e);
  }

  // Fallback slides if planning failed
  if (slides.length < 5) {
    slides = [
      { title: topic, body: "Swipe →" },
      { title: "Why it matters", body: "Key insight one." },
      { title: "How it works", body: "Practical detail." },
      { title: "Pro tip", body: "Actionable takeaway." },
      { title: "Save & share", body: "Follow for more." },
    ];
  }

  // Step 2: generate 5 images in parallel, all sharing the same visual language
  const tasks = slides.map((s, i) => {
    const slidePrompt = [
      `Instagram carousel slide ${i + 1} of 5 about "${topic}".`,
      `Slide title text: "${s.title}". Body text: "${s.body}".`,
      `Render the title and body text clearly and legibly on the image.`,
      `Visual language (MUST stay consistent across the whole set): ${visualLanguage}.`,
      `Square 1:1 composition, identical typography, identical color palette and layout grid as the other slides in this set.`,
      styleHints[style] || styleHints.minimal,
      "Premium social-media design, share-worthy.",
    ].join(" ");
    return generateFromPrompt(slidePrompt, "square");
  });

  const results = await Promise.all(tasks);
  return { results, slides };
}

// Generic Replicate run-and-poll helper. Worker-safe (short subrequests).
async function runReplicateModel(
  modelPath: string, // e.g. "851-labs/background-remover" or "nightmareai/real-esrgan"
  input: Record<string, any>,
): Promise<ImageGenResult> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return { imageUrl: "", error: "REPLICATE_API_TOKEN not configured" };

  const MAX_WAIT_MS = 55_000;
  const POLL_INTERVAL_MS = 1500;
  const SUBREQUEST_TIMEOUT_MS = 8000;
  const fetchWithTimeout = async (url: string, init: RequestInit, ms: number) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    try { return await fetch(url, { ...init, signal: ctrl.signal }); }
    finally { clearTimeout(t); }
  };

  let prediction: any;
  try {
    const res = await fetchWithTimeout(
      `https://api.replicate.com/v1/models/${modelPath}/predictions`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      },
      SUBREQUEST_TIMEOUT_MS,
    );
    if (!res.ok) {
      const text = await res.text();
      console.error(`Replicate ${modelPath} create error:`, res.status, text.slice(0, 300));
      return { imageUrl: "", error: `Replicate error (${res.status})` };
    }
    prediction = await res.json();
  } catch (err: any) {
    console.error("Replicate create error:", err?.message || err);
    return { imageUrl: "", error: "Failed to reach Replicate" };
  }

  const getUrl: string | undefined = prediction?.urls?.get;
  if (!getUrl) return { imageUrl: "", error: "Replicate returned no poll URL" };

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const started = Date.now();
  while (
    prediction?.status !== "succeeded" &&
    prediction?.status !== "failed" &&
    prediction?.status !== "canceled"
  ) {
    if (Date.now() - started > MAX_WAIT_MS) {
      return { imageUrl: "", error: "Replicate is taking longer than expected. Try again." };
    }
    await sleep(POLL_INTERVAL_MS);
    try {
      const r = await fetchWithTimeout(
        getUrl,
        { headers: { Authorization: `Bearer ${token}` } },
        SUBREQUEST_TIMEOUT_MS,
      );
      if (!r.ok) {
        if (r.status >= 500) continue;
        return { imageUrl: "", error: `Replicate poll failed (${r.status})` };
      }
      prediction = await r.json();
    } catch { continue; }
  }

  if (prediction?.status === "succeeded") {
    const out = prediction.output;
    const url = Array.isArray(out) ? out[0] : typeof out === "string" ? out : null;
    if (url) return { imageUrl: url };
    return { imageUrl: "", error: "Replicate returned no image" };
  }
  return {
    imageUrl: "",
    error: prediction?.error || `Replicate ${prediction?.status || "failed"}`,
  };
}

export async function removeBackground(imageDataUrl: string): Promise<ImageGenResult> {
  return runReplicateModel("851-labs/background-remover", { image: imageDataUrl });
}

export async function upscaleImage(
  imageDataUrl: string,
  scale: 2 | 4 = 2,
): Promise<ImageGenResult> {
  return runReplicateModel("nightmareai/real-esrgan", {
    image: imageDataUrl,
    scale,
    face_enhance: false,
  });
}

// Lightweight content safety check using a text model on the prompt
export async function checkPromptSafety(
  prompt: string,
): Promise<{ safe: boolean; reason?: string }> {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  if (!LOVABLE_API_KEY) return { safe: true };
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content:
              'Classify a prompt for an image-generation tool. Reply ONLY strict JSON: {"safe":true|false,"reason":"..."}. Mark unsafe if it requests sexual content involving minors, real-person nudity/deepfakes, graphic gore, hate symbols, or instructions for weapons/violence. Otherwise safe.',
          },
          { role: "user", content: prompt.slice(0, 1500) },
        ],
      }),
    });
    if (!res.ok) return { safe: true };
    const j = await res.json();
    const txt = j.choices?.[0]?.message?.content || "";
    const m = txt.match(/\{[\s\S]*\}/);
    if (!m) return { safe: true };
    const parsed = JSON.parse(m[0]);
    return { safe: parsed.safe !== false, reason: parsed.reason };
  } catch (e) {
    console.error("safety check error", e);
    return { safe: true };
  }
}

// Generate a share-ready caption for an image prompt
export async function generateCaption(prompt: string): Promise<string> {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  if (!LOVABLE_API_KEY) return prompt;
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content:
              "Write a single share-ready Instagram/LinkedIn caption (<=280 chars) for the given image idea. Include a short hook, 1 line of value, one CTA, and 3-5 relevant hashtags at the end. Plain text only, no quotes.",
          },
          { role: "user", content: prompt.slice(0, 1500) },
        ],
      }),
    });
    if (!res.ok) return prompt;
    const j = await res.json();
    return (j.choices?.[0]?.message?.content || prompt).trim();
  } catch {
    return prompt;
  }
}
