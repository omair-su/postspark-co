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

// Replicate Flux 1.1 Pro — premium photorealistic generation
async function callReplicateFlux(
  prompt: string,
  aspect: "square" | "portrait" | "landscape" = "square",
): Promise<ImageGenResult> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return { imageUrl: "", error: "REPLICATE_API_TOKEN not configured" };

  try {
    const createRes = await fetch(
      "https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Prefer: "wait=60",
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
    );

    if (!createRes.ok) {
      const text = await createRes.text();
      console.error("Replicate create error:", createRes.status, text.slice(0, 300));
      if (createRes.status === 401 || createRes.status === 403)
        return { imageUrl: "", error: "Replicate authentication failed. Check REPLICATE_API_TOKEN." };
      if (createRes.status === 402)
        return { imageUrl: "", error: "Replicate billing issue — please add credits at replicate.com." };
      if (createRes.status === 429)
        return { imageUrl: "", error: "Replicate rate limit reached. Try again shortly." };
      return { imageUrl: "", error: `Replicate error (${createRes.status})` };
    }

    let prediction: any = await createRes.json();

    // Poll until finished if Prefer:wait didn't complete it
    const started = Date.now();
    while (
      prediction?.status &&
      prediction.status !== "succeeded" &&
      prediction.status !== "failed" &&
      prediction.status !== "canceled" &&
      Date.now() - started < 90_000
    ) {
      await new Promise((r) => setTimeout(r, 1500));
      const pollRes = await fetch(prediction.urls?.get, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!pollRes.ok) break;
      prediction = await pollRes.json();
    }

    if (prediction?.status === "succeeded") {
      const out = prediction.output;
      const url = Array.isArray(out) ? out[0] : typeof out === "string" ? out : null;
      if (url) return { imageUrl: url };
      return { imageUrl: "", error: "Replicate returned no image URL" };
    }
    if (prediction?.status === "failed")
      return { imageUrl: "", error: prediction.error || "Replicate generation failed" };
    return { imageUrl: "", error: "Replicate timed out" };
  } catch (err) {
    console.error("Replicate request error:", err);
    return { imageUrl: "", error: "Failed to reach Replicate" };
  }
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

// Premium text-to-image: try Replicate Flux 1.1 Pro first, fall back to Lovable AI.
async function generateFromPrompt(
  fullPrompt: string,
  aspect: "square" | "portrait" | "landscape",
): Promise<ImageGenResult> {
  if (process.env.REPLICATE_API_TOKEN) {
    const r = await callReplicateFlux(fullPrompt, aspect);
    if (r.imageUrl) return r;
    console.warn("Replicate failed, falling back to Lovable AI:", r.error);
  }
  return callImageAI([{ role: "user", content: fullPrompt }]);
}

export async function generateSocialImage(
  prompt: string,
  style: string,
  aspect: string,
  template?: string,
): Promise<ImageGenResult> {
  const fullPrompt = buildPrompt(prompt, style, aspect, template);
  const a = (aspect as "square" | "portrait" | "landscape") || "square";
  return generateFromPrompt(fullPrompt, a);
}

export async function generateVariations(
  prompt: string,
  style: string,
  aspect: string,
  template: string | undefined,
  count: number,
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
    return generateFromPrompt(finalPrompt, a);
  });
  return Promise.all(tasks);
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
    return callImageAI([{ role: "user", content: slidePrompt }]);
  });

  const results = await Promise.all(tasks);
  return { results, slides };
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
