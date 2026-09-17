import { toReadableError } from "./serverErrors";
/**
 * Canva Connect — client-callable server functions.
 * Thin wrappers only: every runtime helper lives in *.server.ts modules.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  CANVA_AUTHORIZE_URL,
  CANVA_SCOPES,
  buildCanvaState,
  canvaCredentials,
  codeChallengeFor,
  deriveCodeVerifier,
} from "@/lib/canva.server";
import { deleteCanvaAccount, getCanvaAccount } from "@/lib/canvaAccount.server";
import {
  createDesign,
  exportDesign,
  fetchBrandTemplates,
  importRecentDesigns,
  listDesigns,
  listVersions,
  publishDesign,
  removeDesign,
  restoreVersion,
  syncDesign,
  uploadAsset,
} from "@/lib/canvaOps.server";

export const getCanvaStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
    const { clientId, clientSecret } = canvaCredentials();
    const configured = Boolean(clientId && clientSecret);
    const account = await getCanvaAccount(context.userId);
    return {
      configured,
      connected: Boolean(account),
      displayName: account?.platform_username ?? null,
      tokenExpiresAt: account?.token_expires_at ?? null,
    };
  
    } catch (thrown) {
      throw await toReadableError(thrown, "canva");
    }
  });

export const getCanvaAuthUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
    const { clientId, redirectUri } = canvaCredentials();
    if (!clientId) {
      return { error: "Canva is not configured yet — CANVA_CLIENT_ID is missing." };
    }
    const { state, payload } = await buildCanvaState(context.userId);
    const verifier = await deriveCodeVerifier(payload);
    const challenge = await codeChallengeFor(verifier);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: CANVA_SCOPES.join(" "),
      state,
      code_challenge: challenge,
      code_challenge_method: "S256",
    });
    return { url: `${CANVA_AUTHORIZE_URL}?${params.toString()}` };
  
    } catch (thrown) {
      throw await toReadableError(thrown, "canva");
    }
  });

export const disconnectCanva = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
    await deleteCanvaAccount(context.userId);
    return { ok: true };
  
    } catch (thrown) {
      throw await toReadableError(thrown, "canva");
    }
  });

export const listCanvaTemplates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { query?: string }) => z.object({ query: z.string().max(120).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    try {
      return await fetchBrandTemplates(context.userId, data.query);
    } catch (thrown) {
      throw await toReadableError(thrown, "canva");
    }
  });

export const createCanvaDesign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        title: z.string().min(1).max(200),
        presetKey: z.string().max(60).optional(),
        width: z.number().int().min(40).max(8000).optional(),
        height: z.number().int().min(40).max(8000).optional(),
        designType: z.string().max(40).default("thumbnail"),
        slideCount: z.number().int().min(1).max(20).optional(),
        assetId: z.string().max(200).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    try {
      return await createDesign(context.userId, data);
    } catch (thrown) {
      throw await toReadableError(thrown, "canva");
    }
  });

export const exportCanvaDesign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        designId: z.string().min(1).max(200),
        format: z.enum(["png", "pdf", "jpg"]).default("png"),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    try {
      return await exportDesign(context.userId, data.designId, data.format);
    } catch (thrown) {
      throw await toReadableError(thrown, "canva");
    }
  });

export const uploadImageToCanva = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ imageUrl: z.string().url().max(2000), name: z.string().min(1).max(120) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    try {
      return await uploadAsset(context.userId, data.imageUrl, data.name);
    } catch (thrown) {
      throw await toReadableError(thrown, "canva");
    }
  });

export const listCanvaDesigns = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { designType?: string }) =>
    z.object({ designType: z.string().max(40).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    try {
      return await listDesigns(context.userId, data.designType);
    } catch (thrown) {
      throw await toReadableError(thrown, "canva");
    }
  });

export const deleteCanvaDesign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    try {
      return await removeDesign(context.userId, data.id);
    } catch (thrown) {
      throw await toReadableError(thrown, "canva");
    }
  });

export const syncCanvaDesign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    try {
      return await syncDesign(context.userId, data.id);
    } catch (thrown) {
      throw await toReadableError(thrown, "canva");
    }
  });

export const importCanvaDesigns = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      return await importRecentDesigns(context.userId);
    } catch (thrown) {
      throw await toReadableError(thrown, "canva");
    }
  });

export const listCanvaDesignVersions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    try {
      return await listVersions(context.userId, data.id);
    } catch (thrown) {
      throw await toReadableError(thrown, "canva");
    }
  });

export const restoreCanvaDesignVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { versionId: string }) =>
    z.object({ versionId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    try {
      return await restoreVersion(context.userId, data.versionId);
    } catch (thrown) {
      throw await toReadableError(thrown, "canva");
    }
  });

export const publishCanvaDesign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({ id: z.string().uuid(), format: z.enum(["png", "pdf", "jpg"]).default("png") })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    try {
      return await publishDesign(context.userId, data.id, data.format);
    } catch (thrown) {
      throw await toReadableError(thrown, "canva");
    }
  });
