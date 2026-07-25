import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  normalizePhone,
  renderNotificationBody,
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
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    return { prefs: data };
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
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("notification_preferences")
      .upsert({ user_id: userId, ...data }, { onConflict: "user_id" });
    if (error) return { success: false, error: error.message };
    return { success: true };
  });

export const connectWhatsApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ phone: z.string().min(8).max(20) }).parse)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const phone = normalizePhone(data.phone);
    if (phone.length < 8) return { success: false, error: "Invalid phone number" };

    // Attempt a test send (session message) to verify.
    const test = await sendWhatsAppText({
      to: phone,
      body: "🎉 PostSpark connected! You'll get updates about your posts here.",
    });

    const { error } = await supabase
      .from("notification_preferences")
      .upsert(
        {
          user_id: userId,
          whatsapp_phone: phone,
          whatsapp_connected_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
    if (error) return { success: false, error: error.message };

    await supabase.from("whatsapp_notifications").insert({
      user_id: userId,
      event_type: "account_connected",
      recipient: phone,
      status: test.ok ? "sent" : "failed",
      message_id: test.messageId || null,
      error_message: test.error || null,
    });

    return { success: true, sent: test.ok, warning: test.ok ? null : test.error };
  });

export const disconnectWhatsApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await supabase
      .from("notification_preferences")
      .update({ whatsapp_phone: null, whatsapp_connected_at: null })
      .eq("user_id", userId);
    return { success: true };
  });

export const testWhatsApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
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
  });

export const listWhatsAppNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("whatsapp_notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    return { notifications: data || [] };
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
  });
