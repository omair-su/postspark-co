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

async function callImageAI(messages: any[]): Promise<ImageGenResult> {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  if (!LOVABLE_API_KEY) return { imageUrl: "", error: "AI service not configured" };

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages,
        modalities: ["image", "text"],
      }),
    });

    if (response.status === 429)
      return { imageUrl: "", error: "Rate limit reached. Try again shortly." };
    if (response.status === 402) return { imageUrl: "", error: "AI credits exhausted." };
    if (!response.ok) {
      const text = await response.text();
      console.error("Image AI error:", response.status, text);
      return { imageUrl: "", error: "Image generation failed." };
    }

    const data = await response.json();
    const url = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!url) {
      console.error("No image in response:", JSON.stringify(data).slice(0, 500));
      return { imageUrl: "", error: "No image returned." };
    }
    return { imageUrl: url };
  } catch (err) {
    console.error("Image gen error:", err);
    return { imageUrl: "", error: "Failed to connect to AI service." };
  }
}

export async function generateSocialImage(
  prompt: string,
  style: string,
  aspect: string,
  template?: string,
): Promise<ImageGenResult> {
  const fullPrompt = buildPrompt(prompt, style, aspect, template);
  return callImageAI([{ role: "user", content: fullPrompt }]);
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
  const tasks = Array.from({ length: count }).map((_, i) => {
    const variantHint = variants[i % variants.length];
    const finalPrompt = buildPrompt(
      variantHint ? `${prompt} (${variantHint})` : prompt,
      style,
      aspect,
      template,
    );
    return callImageAI([{ role: "user", content: finalPrompt }]);
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
