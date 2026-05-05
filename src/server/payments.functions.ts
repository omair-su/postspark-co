import { createServerFn } from "@tanstack/react-start";
import { gatewayFetch, getPaddleClient, type PaddleEnv } from "@/lib/paddle.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const resolvePaddlePrice = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { priceId: string; environment: PaddleEnv }) => {
    if (!data?.priceId || typeof data.priceId !== "string") {
      throw new Error("priceId is required");
    }
    if (data.environment !== "sandbox" && data.environment !== "live") {
      throw new Error("Invalid environment");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const response = await gatewayFetch(
      data.environment,
      `/prices?external_id=${encodeURIComponent(data.priceId)}`
    );
    const result = await response.json();
    if (!result.data?.length) throw new Error("Price not found");
    return result.data[0].id as string;
  });

export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: PaddleEnv }) => {
    if (data?.environment !== "sandbox" && data?.environment !== "live") {
      throw new Error("Invalid environment");
    }
    return { environment: data.environment };
  })
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const { data: sub, error } = await supabaseAdmin
      .from("subscriptions")
      .select("paddle_customer_id, paddle_subscription_id")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !sub) throw new Error("No subscription found");
    const paddle = getPaddleClient(data.environment);
    const portalSession = await paddle.customerPortalSessions.create(
      sub.paddle_customer_id as string,
      [sub.paddle_subscription_id as string]
    );
    return {
      overviewUrl: portalSession.urls.general.overview,
      subscriptionUrls: portalSession.urls.subscriptions,
    };
  });

// Preview an in-place plan change (e.g. Pro -> Agency) showing prorated charge
export const previewPlanChange = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: PaddleEnv; targetPriceId: string }) => {
    if (data?.environment !== "sandbox" && data?.environment !== "live") throw new Error("Invalid environment");
    if (!data?.targetPriceId) throw new Error("targetPriceId is required");
    return data;
  })
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const { data: sub } = await supabaseAdmin
      .from("subscriptions")
      .select("paddle_subscription_id, status")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!sub) throw new Error("No subscription found");

    const priceRes = await gatewayFetch(
      data.environment,
      `/prices?external_id=${encodeURIComponent(data.targetPriceId)}`
    );
    const priceJson = await priceRes.json();
    const paddlePriceId = priceJson?.data?.[0]?.id;
    if (!paddlePriceId) throw new Error("Target price not found");

    const previewRes = await gatewayFetch(
      data.environment,
      `/subscriptions/${sub.paddle_subscription_id}/preview`,
      {
        method: "PATCH",
        body: JSON.stringify({
          items: [{ price_id: paddlePriceId, quantity: 1 }],
          proration_billing_mode: "prorated_immediately",
        }),
      }
    );
    const previewJson = await previewRes.json();
    if (!previewRes.ok) throw new Error(previewJson?.error?.detail || "Preview failed");

    const txn = previewJson?.data?.immediate_transaction ?? previewJson?.data?.next_transaction;
    const total = txn?.details?.totals?.grand_total ?? "0";
    const currency = txn?.details?.totals?.currency_code ?? txn?.currency_code ?? "USD";
    const nextBilledAt = previewJson?.data?.next_billed_at ?? null;

    return {
      amountCents: Number(total),
      currency: String(currency),
      nextBilledAt,
    };
  });

// Apply the plan change (Pro -> Agency or downgrade)
export const applyPlanChange = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: PaddleEnv; targetPriceId: string }) => {
    if (data?.environment !== "sandbox" && data?.environment !== "live") throw new Error("Invalid environment");
    if (!data?.targetPriceId) throw new Error("targetPriceId is required");
    return data;
  })
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const { data: sub } = await supabaseAdmin
      .from("subscriptions")
      .select("paddle_subscription_id")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!sub) throw new Error("No subscription found");

    const priceRes = await gatewayFetch(
      data.environment,
      `/prices?external_id=${encodeURIComponent(data.targetPriceId)}`
    );
    const priceJson = await priceRes.json();
    const paddlePriceId = priceJson?.data?.[0]?.id;
    if (!paddlePriceId) throw new Error("Target price not found");

    const res = await gatewayFetch(
      data.environment,
      `/subscriptions/${sub.paddle_subscription_id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          items: [{ price_id: paddlePriceId, quantity: 1 }],
          proration_billing_mode: "prorated_immediately",
        }),
      }
    );
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error?.detail || "Plan change failed");
    return { success: true };
  });

// Self-serve account deletion: cancel any active Paddle sub, then delete auth user
export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { confirmationEmail: string }) => {
    if (!data?.confirmationEmail) throw new Error("Email confirmation required");
    return data;
  })
  .handler(async ({ data, context }) => {
    const userId = context.userId;

    const { data: userResp } = await supabaseAdmin.auth.admin.getUserById(userId);
    const realEmail = userResp?.user?.email?.toLowerCase();
    if (!realEmail || realEmail !== data.confirmationEmail.toLowerCase()) {
      throw new Error("Email does not match your account");
    }

    // Cancel any non-canceled Paddle subscriptions across both envs
    const { data: subs } = await supabaseAdmin
      .from("subscriptions")
      .select("paddle_subscription_id, environment, status")
      .eq("user_id", userId);

    for (const s of subs ?? []) {
      if (s.status === "canceled") continue;
      try {
        const paddle = getPaddleClient(s.environment as PaddleEnv);
        await paddle.subscriptions.cancel(s.paddle_subscription_id as string, { effectiveFrom: "immediately" });
      } catch (e) {
        console.error("Failed to cancel Paddle sub during account deletion:", e);
      }
    }

    // Send confirmation email (best-effort)
    try {
      const React = await import("react");
      const { render } = await import("@react-email/components");
      const { AccountDeletedEmail } = await import("@/lib/email-templates/account-deleted");
      const element = React.createElement(AccountDeletedEmail, {});
      const html = await render(element);
      const text = await render(element, { plainText: true });
      const messageId = crypto.randomUUID();
      await supabaseAdmin.from("email_send_log").insert({
        message_id: messageId,
        template_name: "account_deleted",
        recipient_email: realEmail,
        status: "pending",
      });
      await supabaseAdmin.rpc("enqueue_email", {
        queue_name: "transactional_emails",
        payload: {
          message_id: messageId,
          to: realEmail,
          from: "PostSpark <hello@postspark.co>",
          sender_domain: "hello.postspark.co",
          subject: "Your PostSpark account has been deleted",
          html,
          text,
          purpose: "transactional",
          label: "account_deleted",
          queued_at: new Date().toISOString(),
        },
      });
    } catch (e) {
      console.error("Failed to send account-deleted email:", e);
    }

    // Anonymize profile first (in case FK isn't cascade)
    await supabaseAdmin
      .from("profiles")
      .update({ display_name: "Deleted user", avatar_url: "", plan: "free" })
      .eq("user_id", userId);

    const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (delErr) throw new Error(delErr.message);

    return { success: true };
  });
