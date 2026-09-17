import { toReadableError } from "./serverErrors";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { rateLimitedDurable } from "@/lib/rateLimit.server";
import {
  WA_OTP_MAX_ATTEMPTS,
  WA_OTP_TTL_MINUTES,
  generateWhatsAppOtp,
  hashWhatsAppOtp,
  normalizePhone,
  renderNotificationBody,
  renderWhatsAppOtpBody,
  sendWhatsAppText,
  type WaEventType,
} from "@/lib/whatsapp.server";

const EVENT_TYPES = [
  "post_published",
  "post_failed",
  "scheduled_reminder",
  "approval_request",
  "account_connected",
  "subscription",
] as const;

export const getWhatsAppPrefs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    return { prefs: data };
  
    } catch (thrown) {
      throw await toReadableError(thrown, "whatsapp");
    }
  });

export const saveWhatsAppPrefs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      post_published: z.boolean().optional(),
      post_failed: z.boolean().optional(),
      scheduled_reminder: z.boolean().optional(),
      approval_request: z.boolean().optional(),
      account_connected: z.boolean().optional(),
      subscription: z.boolean().optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    try {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("notification_preferences")
      .upsert({ user_id: userId, ...data }, { onConflict: "user_id" });
    if (error) return { success: false, error: error.message };
    return { success: true };
  
    } catch (thrown) {
      throw await toReadableError(thrown, "whatsapp");
    }
  });

/**
 * Step 1 of connecting WhatsApp: send a verification code to the number.
 *
 * The caller being signed in proves nothing about who owns the number they
 * typed, so the only thing we ever send to an unverified number is a short
 * code — never a "you're connected" message and never any account content.
 * The number is not saved as connected here.
 */
export const startWhatsAppVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ phone: z.string().min(8).max(20) }).parse)
  .handler(async ({ data, context }) => {
    try {
      const { supabase, userId } = context;
      const phone = normalizePhone(data.phone);
      if (phone.length < 8 || phone.length > 15) {
        return { success: false, error: "Enter a valid number with country code" };
      }

      // Cap how often one account can make us message a new number, so the
      // verification step itself cannot be turned into a spam channel.
      const limitedUser = await rateLimitedDurable(`wa:verify:user:${userId}`, "wa_verify", 3, 900);
      if (limitedUser) {
        return {
          success: false,
          error: "Too many verification attempts. Please wait a few minutes and try again.",
        };
      }
      const limitedPhone = await rateLimitedDurable(`wa:verify:phone:${phone}`, "wa_verify", 3, 3600);
      if (limitedPhone) {
        return {
          success: false,
          error: "This number has been sent too many codes recently. Please try again later.",
        };
      }

      const code = generateWhatsAppOtp();
      const otpHash = await hashWhatsAppOtp(code);
      const expiresAt = new Date(Date.now() + WA_OTP_TTL_MINUTES * 60_000).toISOString();

      const { error } = await supabase.from("notification_preferences").upsert(
        {
          user_id: userId,
          whatsapp_pending_phone: phone,
          whatsapp_otp_hash: otpHash,
          whatsapp_otp_expires_at: expiresAt,
          whatsapp_otp_attempts: 0,
        },
        { onConflict: "user_id" },
      );
      if (error) return { success: false, error: error.message };

      const sent = await sendWhatsAppText({ to: phone, body: renderWhatsAppOtpBody(code) });
      if (!sent.ok) {
        return { success: false, error: sent.error || "Could not send the verification code" };
      }

      return { success: true, expiresInMinutes: WA_OTP_TTL_MINUTES };
    } catch (thrown) {
      throw await toReadableError(thrown, "whatsapp");
    }
  });

/**
 * Step 2: the user proves ownership by returning the code we sent. Only now
 * is the number persisted as their notification destination.
 */
export const confirmWhatsAppVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ code: z.string().min(4).max(10) }).parse)
  .handler(async ({ data, context }) => {
    try {
      const { supabase, userId } = context;
      const { data: prefs } = await supabase
        .from("notification_preferences")
        .select("whatsapp_pending_phone, whatsapp_otp_hash, whatsapp_otp_expires_at, whatsapp_otp_attempts")
        .eq("user_id", userId)
        .maybeSingle();

      const pendingPhone = (prefs as any)?.whatsapp_pending_phone as string | null;
      const otpHash = (prefs as any)?.whatsapp_otp_hash as string | null;
      const expiresAt = (prefs as any)?.whatsapp_otp_expires_at as string | null;
      const attempts = Number((prefs as any)?.whatsapp_otp_attempts ?? 0);

      if (!pendingPhone || !otpHash || !expiresAt) {
        return { success: false, error: "Start again — no verification is in progress." };
      }
      if (new Date(expiresAt).getTime() < Date.now()) {
        await supabase
          .from("notification_preferences")
          .update({ whatsapp_pending_phone: null, whatsapp_otp_hash: null, whatsapp_otp_expires_at: null })
          .eq("user_id", userId);
        return { success: false, error: "That code expired. Request a new one." };
      }
      if (attempts >= WA_OTP_MAX_ATTEMPTS) {
        await supabase
          .from("notification_preferences")
          .update({ whatsapp_pending_phone: null, whatsapp_otp_hash: null, whatsapp_otp_expires_at: null })
          .eq("user_id", userId);
        return { success: false, error: "Too many wrong codes. Request a new one." };
      }

      const submitted = await hashWhatsAppOtp(data.code.replace(/\D/g, ""));
      if (submitted !== otpHash) {
        await supabase
          .from("notification_preferences")
          .update({ whatsapp_otp_attempts: attempts + 1 })
          .eq("user_id", userId);
        return {
          success: false,
          error: "That code doesn't match.",
          attemptsLeft: Math.max(0, WA_OTP_MAX_ATTEMPTS - (attempts + 1)),
        };
      }

      const { error } = await supabase
        .from("notification_preferences")
        .update({
          whatsapp_phone: pendingPhone,
          whatsapp_connected_at: new Date().toISOString(),
          whatsapp_pending_phone: null,
          whatsapp_otp_hash: null,
          whatsapp_otp_expires_at: null,
          whatsapp_otp_attempts: 0,
        })
        .eq("user_id", userId);
      if (error) return { success: false, error: error.message };

      await supabase.from("whatsapp_notifications").insert({
        user_id: userId,
        event_type: "account_connected",
        recipient: pendingPhone,
        status: "sent",
        payload: { verified: true },
      });

      return { success: true };
    } catch (thrown) {
      throw await toReadableError(thrown, "whatsapp");
    }
  });

export const disconnectWhatsApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
    const { supabase, userId } = context;
    await supabase
      .from("notification_preferences")
      .update({ whatsapp_phone: null, whatsapp_connected_at: null })
      .eq("user_id", userId);
    return { success: true };
  
    } catch (thrown) {
      throw await toReadableError(thrown, "whatsapp");
    }
  });

export const testWhatsApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
    const { supabase, userId } = context;
    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("whatsapp_phone")
      .eq("user_id", userId)
      .maybeSingle();
    if (!prefs?.whatsapp_phone) return { success: false, error: "No phone on file" };
    const body = renderNotificationBody("account_connected", { platform: "PostSpark" });
    const res = await sendWhatsAppText({ to: prefs.whatsapp_phone, body });
    await supabase.from("whatsapp_notifications").insert({
      user_id: userId,
      event_type: "account_connected",
      recipient: prefs.whatsapp_phone,
      status: res.ok ? "sent" : "failed",
      message_id: res.messageId || null,
      error_message: res.error || null,
      payload: { test: true },
    });
    return { success: res.ok, error: res.error };
  
    } catch (thrown) {
      throw await toReadableError(thrown, "whatsapp");
    }
  });

export const listWhatsAppNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("whatsapp_notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    return { notifications: data || [] };
  
    } catch (thrown) {
      throw await toReadableError(thrown, "whatsapp");
    }
  });

// Called by other server code (e.g. publish cron) to fire a notification
// respecting the user's preferences.
export const notifyWhatsApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      event: z.enum(EVENT_TYPES),
      data: z.record(z.string(), z.string()).optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    try {
    const { supabase, userId } = context;
    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (!prefs?.whatsapp_phone) return { success: false, error: "not_connected" };
    if (!(prefs as any)[data.event]) return { success: false, error: "disabled" };

    const body = renderNotificationBody(data.event as WaEventType, data.data || {});
    const res = await sendWhatsAppText({ to: prefs.whatsapp_phone, body });
    await supabase.from("whatsapp_notifications").insert({
      user_id: userId,
      event_type: data.event,
      recipient: prefs.whatsapp_phone,
      status: res.ok ? "sent" : "failed",
      message_id: res.messageId || null,
      error_message: res.error || null,
      payload: data.data || {},
    });
    return { success: res.ok, error: res.error };
  
    } catch (thrown) {
      throw await toReadableError(thrown, "whatsapp");
    }
  });
