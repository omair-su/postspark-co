import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildGoogleAuthUrl, extractGoogleDocId, googleCredentials } from "@/lib/google.server";
import { deleteGoogleAccount, getGoogleAccount } from "@/lib/googleAccount.server";
import {
  createGoogleDoc,
  extractDriveFileText,
  listDriveFiles,
  replaceGoogleDocContent,
} from "@/lib/googleOps.server";

function toError(e: any): Error {
  console.error("[google-fn] error:", e);
  const msg = e?.message || (typeof e === "string" ? e : "Something went wrong with Google.");
  if (msg === "GOOGLE_NOT_CONNECTED") {
    return new Error("Connect your Google account first (Settings → Google Workspace).");
  }
  if (msg === "GOOGLE_REAUTH_REQUIRED") {
    return new Error("Your Google access expired — please reconnect Google Workspace.");
  }
  return new Error(msg);
}

export const getGoogleStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { clientId, clientSecret, redirectUri } = googleCredentials();
    const account = await getGoogleAccount(context.userId).catch(() => null);
    return {
      configured: !!(clientId && clientSecret),
      connected: !!account,
      email: account?.platform_username ?? account?.metadata?.email ?? null,
      displayName: (account?.metadata?.display_name as string | null) ?? null,
      avatarUrl: (account?.metadata?.avatar_url as string | null) ?? null,
      tokenExpiresAt: account?.token_expires_at ?? null,
      hasRefreshToken: !!account?.refresh_token,
      redirectUri,
    };
  });

export const getGoogleAuthUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z
      .object({ returnTo: z.string().max(300).optional() })
      .optional()
      .transform((v) => v ?? {}).parse,
  )
  .handler(async ({ data, context }) => {
    const returnTo = data?.returnTo?.startsWith("/") ? data.returnTo : undefined;
    const { url, error } = await buildGoogleAuthUrl(context.userId, [], returnTo);
    if (!url) throw new Error(error || "Could not start Google sign-in.");
    return { url };
  });

export const disconnectGoogle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      await deleteGoogleAccount(context.userId);
      return { ok: true };
    } catch (e) {
      throw toError(e);
    }
  });

export const listGoogleDriveFiles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      search: z.string().max(200).optional(),
      folderId: z.string().max(200).nullable().optional(),
      pageToken: z.string().max(4000).nullable().optional(),
      foldersOnly: z.boolean().optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    try {
      return await listDriveFiles(context.userId, data);
    } catch (e) {
      throw toError(e);
    }
  });

export const importGoogleDriveFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ fileId: z.string().min(5).max(300) }).parse)
  .handler(async ({ data, context }) => {
    try {
      return await extractDriveFileText(context.userId, extractGoogleDocId(data.fileId));
    } catch (e) {
      throw toError(e);
    }
  });

export const exportToGoogleDocs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      title: z.string().min(1).max(200),
      content: z.string().min(1).max(400_000),
      sourceTool: z.string().max(60).optional(),
      folderId: z.string().max(200).nullable().optional(),
      /** When set, overwrite this existing doc instead of creating a new one. */
      documentId: z.string().max(300).optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    try {
      if (data.documentId) {
        const updated = await replaceGoogleDocContent(
          context.userId,
          extractGoogleDocId(data.documentId),
          data.content,
        );
        return { ...updated, title: data.title, updated: true };
      }

      const doc = await createGoogleDoc(context.userId, {
        title: data.title,
        content: data.content,
        folderId: data.folderId ?? null,
      });

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("google_doc_exports").insert({
        user_id: context.userId,
        google_doc_id: doc.documentId,
        google_doc_url: doc.url,
        document_title: doc.title,
        source_tool: data.sourceTool ?? null,
        content_preview: data.content.slice(0, 500),
      });

      return { ...doc, updated: false };
    } catch (e) {
      throw toError(e);
    }
  });

export const listGoogleDocExports = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("google_doc_exports")
      .select("id, google_doc_url, document_title, source_tool, created_at")
      .order("created_at", { ascending: false })
      .limit(25);
    return data ?? [];
  });
