/**
 * Canva design operations (server-only). Each op retries once after a forced
 * token refresh when Canva reports an expired session.
 */
import {
  CANVA_PRESETS,
  canvaEditUrl,
  canvaFetch,
  exchangeCanvaCode,
  deriveCodeVerifier,
  verifyCanvaState,
} from "./canva.server";
import {
  forceRefreshCanvaToken,
  getCanvaAccessToken,
  saveCanvaAccount,
} from "./canvaAccount.server";

async function withToken<T>(
  userId: string,
  run: (token: string) => Promise<{ data?: T; status: number; error?: string }>,
): Promise<{ data?: T; error?: string }> {
  const first = await getCanvaAccessToken(userId);
  if (!first.token) return { error: first.error || "CANVA_NOT_CONNECTED" };

  let res = await run(first.token);
  if (res.error === "CANVA_TOKEN_EXPIRED") {
    const refreshed = await forceRefreshCanvaToken(userId);
    if (!refreshed.token) return { error: refreshed.error };
    res = await run(refreshed.token);
  }
  if (res.error) return { error: res.error };
  return { data: res.data };
}

export async function completeCanvaOAuth(
  code: string,
  state: string,
): Promise<{ ok: boolean; error?: string }> {
  const verified = await verifyCanvaState(state);
  if (!verified) return { ok: false, error: "invalid_state" };

  const verifier = await deriveCodeVerifier(verified.payload);
  const { tokens, error } = await exchangeCanvaCode(code, verifier);
  if (!tokens?.access_token) return { ok: false, error: error || "token_failed" };

  const profileRes = await canvaFetch<any>("/users/me", tokens.access_token);
  const profileMetaRes = await canvaFetch<any>("/users/me/profile", tokens.access_token);
  const canvaUserId = profileRes.data?.team_user?.user_id || "unknown";
  const displayName = profileMetaRes.data?.profile?.display_name || null;

  try {
    await saveCanvaAccount(verified.userId, tokens, {
      userId: canvaUserId,
      displayName,
      avatarUrl: null,
    });
  } catch (e: any) {
    console.error("[canva] failed to save account", e);
    return { ok: false, error: "save_failed" };
  }
  return { ok: true };
}

export async function fetchBrandTemplates(userId: string, query?: string) {
  const q = query?.trim() ? `&query=${encodeURIComponent(query.trim())}` : "";
  const res = await withToken<any>(userId, (t) => canvaFetch(`/brand-templates?limit=50${q}`, t));
  if (res.error) return { error: res.error };
  return { templates: res.data?.items ?? [] };
}

export async function createDesign(
  userId: string,
  opts: {
    title: string;
    presetKey?: string;
    width?: number;
    height?: number;
    designType: string;
    slideCount?: number;
    assetId?: string;
  },
) {
  const preset = opts.presetKey ? CANVA_PRESETS[opts.presetKey] : undefined;
  const width = opts.width ?? preset?.width ?? 1080;
  const height = opts.height ?? preset?.height ?? 1080;

  const body: Record<string, any> = {
    design_type: { type: "custom", width, height },
    title: opts.title,
  };
  if (opts.assetId) body.asset_id = opts.assetId;

  const res = await withToken<any>(userId, (t) =>
    canvaFetch("/designs", t, { method: "POST", body: JSON.stringify(body) }),
  );
  if (res.error) return { error: res.error };

  const design = res.data?.design;
  const designId: string | undefined = design?.id;
  if (!designId) return { error: "Canva did not return a design id." };

  const editUrl = design?.urls?.edit_url || canvaEditUrl(designId);
  const thumbnail = design?.thumbnail?.url ?? null;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: row } = await supabaseAdmin
    .from("user_canva_designs")
    .insert({
      user_id: userId,
      canva_design_id: designId,
      design_title: opts.title,
      design_type: opts.designType,
      platform: preset?.platform ?? null,
      format_width: width,
      format_height: height,
      thumbnail_url: thumbnail,
      slide_count: opts.slideCount ?? 1,
      canva_edit_url: editUrl,
      status: "draft",
    })
    .select("*")
    .maybeSingle();

  return { design: { id: designId, editUrl, thumbnail }, row };
}

export async function exportDesign(
  userId: string,
  designId: string,
  format: "png" | "pdf" | "jpg",
) {
  const formatBody: Record<string, any> = { type: format };
  if (format === "jpg") formatBody.quality = 90;

  const created = await withToken<any>(userId, (t) =>
    canvaFetch("/exports", t, {
      method: "POST",
      body: JSON.stringify({ design_id: designId, format: formatBody }),
    }),
  );
  if (created.error) return { error: created.error };

  const jobId = created.data?.job?.id;
  if (!jobId) return { error: "Canva did not start the export job." };

  for (let attempt = 0; attempt < 20; attempt++) {
    await new Promise((r) => setTimeout(r, 2000));
    const status = await withToken<any>(userId, (t) => canvaFetch(`/exports/${jobId}`, t));
    if (status.error) return { error: status.error };
    const job = status.data?.job;
    if (job?.status === "success") {
      const urls: string[] = job.urls ?? [];
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin
        .from("user_canva_designs")
        .update({ export_urls: urls, status: "exported" })
        .eq("user_id", userId)
        .eq("canva_design_id", designId);
      return { urls };
    }
    if (job?.status === "failed") {
      return { error: job?.error?.message || "Canva export failed. Please try again." };
    }
  }
  return { error: "Canva export timed out. Try exporting again from Canva." };
}

export async function uploadAsset(userId: string, imageUrl: string, name: string) {
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) return { error: "Could not read that image before uploading to Canva." };
  const bytes = new Uint8Array(await imgRes.arrayBuffer());

  const metadata = btoa(
    JSON.stringify({ name_base64: btoa(unescape(encodeURIComponent(name.slice(0, 80)))) }),
  );

  const attempt = async (token: string) => {
    const res = await fetch("https://api.canva.com/rest/v1/asset-uploads", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/octet-stream",
        "Asset-Upload-Metadata": metadata,
      },
      body: bytes,
    });
    const text = await res.text();
    if (res.status === 401) return { status: 401, error: "CANVA_TOKEN_EXPIRED" };
    if (!res.ok) {
      console.error("[canva] asset upload failed", res.status, text.slice(0, 300));
      return { status: res.status, error: `Canva upload failed (${res.status}).` };
    }
    return { status: res.status, data: JSON.parse(text) };
  };

  const res = await withToken<any>(userId, attempt);
  if (res.error) return { error: res.error };

  const jobId = res.data?.job?.id;
  for (let i = 0; i < 15 && jobId; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    const poll = await withToken<any>(userId, (t) => canvaFetch(`/asset-uploads/${jobId}`, t));
    if (poll.error) return { error: poll.error };
    const job = poll.data?.job;
    if (job?.status === "success") return { assetId: job.asset?.id as string };
    if (job?.status === "failed") return { error: "Canva could not process that image." };
  }
  return { error: "Canva upload timed out." };
}

export async function listDesigns(userId: string, designType?: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  let query = supabaseAdmin
    .from("user_canva_designs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(60);
  if (designType && designType !== "all") query = query.eq("design_type", designType);
  const { data, error } = await query;
  if (error) return { error: error.message };
  return { designs: data ?? [] };
}

export async function removeDesign(userId: string, id: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin
    .from("user_canva_designs")
    .delete()
    .eq("user_id", userId)
    .eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}
