import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  scrapeUrl,
  transcribeWithElevenLabs,
  transcribeWithGemini,
  transcribeWithAssemblyAI,
  transcribeWithWhisper,
} from "@/server/import.server";

export const importFromUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      url: z.string().url().max(2000),
    }).parse,
  )
  .handler(async ({ data }) => {
    try {
    return scrapeUrl(data.url);
  } catch (e: any) {
      console.error('[server-fn] error:', e);
      if (e instanceof Response) {
        const txt = await e.text().catch(() => e.statusText || 'Request failed');
        throw new Error(txt || 'Request failed');
      }
      throw new Error(e?.message || (typeof e === 'string' ? e : 'Something went wrong. Please try again.'));
    }
  });

export const transcribeAudio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      audioBase64: z.string().min(100).max(15_000_000),
      mimeType: z.string().min(3).max(100),
      preferProvider: z.enum(["auto", "elevenlabs", "gemini", "assemblyai", "whisper"]).optional(),
    }).parse,
  )
  .handler(async ({ data }) => {
    try {
    const p = data.preferProvider || "auto";

    if (p === "assemblyai" && process.env.ASSEMBLYAI_API_KEY) {
      return transcribeWithAssemblyAI(data.audioBase64, data.mimeType);
    }
    if (p === "whisper" && (process.env.Openai_api || process.env.OPENAI_API_KEY)) {
      return transcribeWithWhisper(data.audioBase64, data.mimeType);
    }
    if (p === "elevenlabs" && process.env.ELEVENLABS_API_KEY) {
      return transcribeWithElevenLabs(data.audioBase64, data.mimeType);
    }
    if (p === "gemini") {
      return transcribeWithGemini(data.audioBase64, data.mimeType);
    }

    // auto: prefer best diarization → AssemblyAI, then Whisper, then ElevenLabs, then Gemini
    if (process.env.ASSEMBLYAI_API_KEY) {
      const r = await transcribeWithAssemblyAI(data.audioBase64, data.mimeType);
      if (r.text) return r;
    }
    if (process.env.Openai_api || process.env.OPENAI_API_KEY) {
      const r = await transcribeWithWhisper(data.audioBase64, data.mimeType);
      if (r.text) return r;
    }
    if (process.env.ELEVENLABS_API_KEY) {
      const r = await transcribeWithElevenLabs(data.audioBase64, data.mimeType);
      if (r.text) return r;
    }
    return transcribeWithGemini(data.audioBase64, data.mimeType);
  } catch (e: any) {
      console.error('[server-fn] error:', e);
      if (e instanceof Response) {
        const txt = await e.text().catch(() => e.statusText || 'Request failed');
        throw new Error(txt || 'Request failed');
      }
      throw new Error(e?.message || (typeof e === 'string' ? e : 'Something went wrong. Please try again.'));
    }
  });

export const checkProviders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    try {
    return {
      elevenlabs: !!process.env.ELEVENLABS_API_KEY,
      gemini: !!process.env.LOVABLE_API_KEY,
      assemblyai: !!process.env.ASSEMBLYAI_API_KEY,
      whisper: !!(process.env.Openai_api || process.env.OPENAI_API_KEY),
    };
  } catch (e: any) {
      console.error('[server-fn] error:', e);
      if (e instanceof Response) {
        const txt = await e.text().catch(() => e.statusText || 'Request failed');
        throw new Error(txt || 'Request failed');
      }
      throw new Error(e?.message || (typeof e === 'string' ? e : 'Something went wrong. Please try again.'));
    }
  });
