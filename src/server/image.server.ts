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
