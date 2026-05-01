import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  scrapeUrl,
  transcribeWithElevenLabs,
  transcribeWithGemini,
} from "./import.server";

export const importFromUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      url: z.string().url().max(2000),
    }).parse,
  )
  .handler(async ({ data }) => {
    return scrapeUrl(data.url);
  });

export const transcribeAudio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      audioBase64: z.string().min(100).max(15_000_000), // ~10MB base64 cap
      mimeType: z.string().min(3).max(100),
      preferProvider: z.enum(["auto", "elevenlabs", "gemini"]).optional(),
    }).parse,
  )
  .handler(async ({ data }) => {
    const wantsEleven =
      data.preferProvider === "elevenlabs" ||
      (data.preferProvider !== "gemini" && !!process.env.ELEVENLABS_API_KEY);

    if (wantsEleven && process.env.ELEVENLABS_API_KEY) {
      const r = await transcribeWithElevenLabs(data.audioBase64, data.mimeType);
      if (r.text) return r;
      // fall through to Gemini if ElevenLabs failed
    }
    return transcribeWithGemini(data.audioBase64, data.mimeType);
  });

export const checkProviders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    return {
      elevenlabs: !!process.env.ELEVENLABS_API_KEY,
      gemini: !!process.env.LOVABLE_API_KEY,
    };
  });
