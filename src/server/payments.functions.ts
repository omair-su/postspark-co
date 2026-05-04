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
