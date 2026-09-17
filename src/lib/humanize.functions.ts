import { toReadableError } from "./serverErrors";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  runHumanize,
  rerollOneSentence,
  fetchHumanizerRuns,
  removeHumanizerRun,
  fetchRunVersions,
} from "./humanize.ops.server";

const settingsSchema = {
  intensity: z.enum(["light", "medium", "strong"]).default("medium"),
  purpose: z.string().max(60).optional(),
  style: z.string().max(40).optional(),
  preserve: z.array(z.string().max(40)).max(8).optional(),
  useBrandVoice: z.boolean().default(true),
};

export const humanizeRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      text: z.string().min(20).max(30000),
      ...settingsSchema,
      /** Long-form batch: index of this chunk and total chunk count. */
      chunkIndex: z.number().int().min(0).max(199).default(0),
      chunkTotal: z.number().int().min(1).max(200).default(1),
      /** Groups versions of the same source together in history. */
      sourceHash: z.string().max(80).optional(),
      /** Skip persisting history (used for intermediate chunks). */
      persist: z.boolean().default(true),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    try {
      return await runHumanize(context, data);
    } catch (thrown) {
      throw await toReadableError(thrown, "humanize");
    }
  });

export const rerollSentence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      sentence: z.string().min(1).max(2000),
      original: z.string().min(1).max(2000),
      before: z.string().max(2000).default(""),
      afterCtx: z.string().max(2000).default(""),
      avoid: z.array(z.string().max(2000)).max(6).default([]),
      ...settingsSchema,
    }).parse,
  )
  .handler(async ({ data, context }) => {
    try {
      return await rerollOneSentence(context, data);
    } catch (thrown) {
      throw await toReadableError(thrown, "humanize");
    }
  });

export const listHumanizerRuns = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ limit: z.number().int().min(1).max(50).default(25) }).parse)
  .handler(async ({ data, context }) => {
    try {
      return await fetchHumanizerRuns(context, data.limit);
    } catch (thrown) {
      throw await toReadableError(thrown, "humanize");
    }
  });

export const listRunVersions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ sourceHash: z.string().min(4).max(80) }).parse)
  .handler(async ({ data, context }) => {
    try {
      return await fetchRunVersions(context, data.sourceHash);
    } catch (thrown) {
      throw await toReadableError(thrown, "humanize");
    }
  });

export const deleteHumanizerRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    try {
      return await removeHumanizerRun(context, data.id);
    } catch (thrown) {
      throw await toReadableError(thrown, "humanize");
    }
  });
