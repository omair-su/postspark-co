export interface ImageGenResult {
  imageUrl: string; // data: URL
  error?: string;
}

export async function generateSocialImage(
  prompt: string,
  style: string,
  aspect: string
): Promise<ImageGenResult> {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  if (!LOVABLE_API_KEY) return { imageUrl: "", error: "AI service not configured" };

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

  const fullPrompt = `${prompt}. ${styleHints[style] || ""}. ${aspectHints[aspect] || ""}. High quality, professional, share-worthy social media visual.`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content: fullPrompt }],
        modalities: ["image", "text"],
      }),
    });

    if (response.status === 429) return { imageUrl: "", error: "Rate limit reached. Try again shortly." };
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
