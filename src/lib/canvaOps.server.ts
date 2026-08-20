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
import { safeFetch } from "./safeFetch";
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
      const { data: row } = await supabaseAdmin
        .from("user_canva_designs")
        .update({ export_urls: urls, status: "exported", updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("canva_design_id", designId)
        .select("*")
        .maybeSingle();
      if (row) await snapshotVersion(userId, row, "export", `Exported ${format.toUpperCase()}`);
      return { urls, pages: urls.length, row };
    }
    if (job?.status === "failed") {
      return { error: job?.error?.message || "Canva export failed. Please try again." };
    }
  }
  return { error: "Canva export timed out. Try exporting again from Canva." };
}

/** Append an immutable snapshot of a design row to its version history. */
export async function snapshotVersion(
  userId: string,
  row: any,
  source: "export" | "import" | "publish" | "restore",
  label?: string,
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: last } = await supabaseAdmin
    .from("canva_design_versions")
    .select("version_number")
    .eq("design_row_id", row.id)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const next = (last?.version_number ?? 0) + 1;
  const { error } = await supabaseAdmin.from("canva_design_versions").insert({
    user_id: userId,
    design_row_id: row.id,
    canva_design_id: row.canva_design_id,
    version_number: next,
    label: label ?? null,
    source,
    design_title: row.design_title,
    thumbnail_url: row.thumbnail_url,
    export_urls: row.export_urls ?? [],
    slide_count: row.slide_count ?? 1,
  });
  if (error) console.error("[canva] snapshot failed", error.message);
  return next;
}

/** Pull the latest Canva state (title, thumbnail, page count) back into PostSpark. */
export async function syncDesign(userId: string, rowId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: row } = await supabaseAdmin
    .from("user_canva_designs")
    .select("*")
    .eq("user_id", userId)
    .eq("id", rowId)
    .maybeSingle();
  if (!row) return { error: "That design is no longer in your PostSpark library." };

  const res = await withToken<any>(userId, (t) => canvaFetch(`/designs/${row.canva_design_id}`, t));
  if (res.error) return { error: res.error };

  const design = res.data?.design ?? res.data;
  const patch = {
    design_title: design?.title || row.design_title,
    thumbnail_url: design?.thumbnail?.url ?? row.thumbnail_url,
    slide_count: design?.page_count ?? row.slide_count,
    canva_edit_url: design?.urls?.edit_url || row.canva_edit_url,
    updated_at: new Date().toISOString(),
  };
  const { data: updated } = await supabaseAdmin
    .from("user_canva_designs")
    .update(patch)
    .eq("user_id", userId)
    .eq("id", rowId)
    .select("*")
    .maybeSingle();

  if (updated) await snapshotVersion(userId, updated, "import", "Imported latest Canva edits");
  return { row: updated };
}

/** Import designs that exist in Canva but aren't tracked in PostSpark yet. */
export async function importRecentDesigns(userId: string, designType = "imported") {
  const res = await withToken<any>(userId, (t) => canvaFetch(`/designs?limit=50`, t));
  if (res.error) return { error: res.error };
  const items: any[] = res.data?.items ?? [];
  if (items.length === 0) return { imported: 0, updated: 0 };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: existing } = await supabaseAdmin
    .from("user_canva_designs")
    .select("id, canva_design_id, design_title, thumbnail_url, slide_count, export_urls")
    .eq("user_id", userId);
  const byId = new Map((existing ?? []).map((r: any) => [r.canva_design_id, r]));

  let imported = 0;
  let updated = 0;
  for (const item of items) {
    const designId = item?.id;
    if (!designId) continue;
    const title = item?.title || "Untitled Canva design";
    const thumb = item?.thumbnail?.url ?? null;
    const pages = item?.page_count ?? 1;
    const editUrl = item?.urls?.edit_url || canvaEditUrl(designId);
    const known = byId.get(designId);

    if (known) {
      const changed =
        known.design_title !== title ||
        known.thumbnail_url !== thumb ||
        known.slide_count !== pages;
      if (!changed) continue;
      const { data: row } = await supabaseAdmin
        .from("user_canva_designs")
        .update({
          design_title: title,
          thumbnail_url: thumb,
          slide_count: pages,
          canva_edit_url: editUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("id", known.id)
        .select("*")
        .maybeSingle();
      if (row) {
        await snapshotVersion(userId, row, "import", "Imported latest Canva edits");
        updated++;
      }
      continue;
    }

    const { data: row } = await supabaseAdmin
      .from("user_canva_designs")
      .insert({
        user_id: userId,
        canva_design_id: designId,
        design_title: title,
        design_type: pages > 1 ? "carousel" : designType,
        thumbnail_url: thumb,
        slide_count: pages,
        canva_edit_url: editUrl,
        status: "draft",
      })
      .select("*")
      .maybeSingle();
    if (row) {
      await snapshotVersion(userId, row, "import", "Imported from Canva");
      imported++;
    }
  }
  return { imported, updated };
}

export async function listVersions(userId: string, rowId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("canva_design_versions")
    .select("*")
    .eq("user_id", userId)
    .eq("design_row_id", rowId)
    .order("version_number", { ascending: false })
    .limit(50);
  if (error) return { error: error.message };
  return { versions: data ?? [] };
}

export async function restoreVersion(userId: string, versionId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: version } = await supabaseAdmin
    .from("canva_design_versions")
    .select("*")
    .eq("user_id", userId)
    .eq("id", versionId)
    .maybeSingle();
  if (!version) return { error: "That version no longer exists." };

  const { data: row } = await supabaseAdmin
    .from("user_canva_designs")
    .update({
      design_title: version.design_title,
      thumbnail_url: version.thumbnail_url,
      export_urls: version.export_urls ?? [],
      slide_count: version.slide_count ?? 1,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("id", version.design_row_id)
    .select("*")
    .maybeSingle();
  if (!row) return { error: "That design is no longer in your library." };

  await snapshotVersion(userId, row, "restore", `Restored v${version.version_number}`);
  return { row };
}

/** Export a final version, store it on the account and mark the design published. */
export async function publishDesign(
  userId: string,
  rowId: string,
  format: "png" | "pdf" | "jpg" = "png",
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: row } = await supabaseAdmin
    .from("user_canva_designs")
    .select("*")
    .eq("user_id", userId)
    .eq("id", rowId)
    .maybeSingle();
  if (!row) return { error: "That design is no longer in your library." };

  const exported = await exportDesign(userId, row.canva_design_id, format);
  if (exported.error) return { error: exported.error };
  const urls = exported.urls ?? [];

  const { data: published } = await supabaseAdmin
    .from("user_canva_designs")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
      published_urls: urls,
      export_urls: urls,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("id", rowId)
    .select("*")
    .maybeSingle();

  if (published) await snapshotVersion(userId, published, "publish", "Published version");
  return { urls, row: published };
}


export async function uploadAsset(userId: string, imageUrl: string, name: string) {
  let imgRes: Response;
  try {
    imgRes = await safeFetch(imageUrl);
  } catch {
    return { error: "That image URL is not allowed." };
  }
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
