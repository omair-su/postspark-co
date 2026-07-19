import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY = "https://connector-gateway.lovable.dev/replicate/v1";
const BUCKET = "shorts-videos";
const MODEL = "fofr/toolkit"; // CPU ffmpeg toolkit; task=convert_to_mp4

function gatewayHeaders() {
  const lk = process.env.LOVABLE_API_KEY;
  const rk = process.env.REPLICATE_API_KEY;
  if (!lk || !rk) throw new Error("Replicate connector not configured");
  return {
    Authorization: `Bearer ${lk}`,
    "X-Connection-Api-Key": rk,
    "Content-Type": "application/json",
  } as Record<string, string>;
}

export const startMp4Render = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ webmPath: z.string().min(1).max(512) }).parse)
  .handler(async ({ data, context }) => {
    try {
    const { supabase, userId } = context;
    if (!data.webmPath.startsWith(`${userId}/`)) {
      throw new Error("Forbidden path");
    }
    // sign source so Replicate can fetch
    const { data: signed, error: signErr } = await supabase
      .storage.from(BUCKET).createSignedUrl(data.webmPath, 60 * 60);
    if (signErr || !signed?.signedUrl) throw new Error(signErr?.message || "Could not sign source");

    const resp = await fetch(`${GATEWAY}/models/${MODEL}/predictions`, {
      method: "POST",
      headers: gatewayHeaders(),
      body: JSON.stringify({
        input: { task: "convert_to_mp4", input_file: signed.signedUrl },
      }),
    });
    const json: any = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(json?.detail || json?.error || `Replicate ${resp.status}`);
    return { predictionId: json.id as string, status: json.status as string };
  } catch (e: any) {
      console.error('[server-fn] error:', e);
      const msg = e?.message || (typeof e === 'string' ? e : 'Something went wrong. Please try again.');
      return { error: msg } as any;
    }
  });

export const pollMp4Render = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ predictionId: z.string().min(1).max(128) }).parse)
  .handler(async ({ data, context }) => {
    try {
    const { supabase, userId } = context;
    const resp = await fetch(`${GATEWAY}/predictions/${data.predictionId}`, {
      headers: gatewayHeaders(),
    });
    const json: any = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(json?.detail || `Replicate ${resp.status}`);

    const status = json.status as string;
    if (status !== "succeeded") {
      return { status, mp4Url: null as string | null, error: json.error || null };
    }
    const out = json.output;
    const mp4SourceUrl: string | null = Array.isArray(out) ? out[0] : (typeof out === "string" ? out : null);
    if (!mp4SourceUrl) throw new Error("No output URL");

    // download and store in bucket
    const file = await fetch(mp4SourceUrl);
    if (!file.ok) throw new Error(`download ${file.status}`);
    const buf = new Uint8Array(await file.arrayBuffer());
    const path = `${userId}/render-output/${data.predictionId}.mp4`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, buf, {
      contentType: "video/mp4", upsert: true,
    });
    if (upErr) throw new Error(upErr.message);

    const { data: signed, error: sErr } = await supabase
      .storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24);
    if (sErr || !signed?.signedUrl) throw new Error(sErr?.message || "sign output failed");
    return { status, mp4Url: signed.signedUrl, mp4Path: path, error: null };
  } catch (e: any) {
      console.error('[server-fn] error:', e);
      const msg = e?.message || (typeof e === 'string' ? e : 'Something went wrong. Please try again.');
      return { error: msg } as any;
    }
  });