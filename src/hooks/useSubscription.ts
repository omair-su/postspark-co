import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getPaddleEnvironment } from "@/lib/paddle";
import { useAuth } from "@/hooks/useAuth";

export type SubscriptionRow = {
  id: string;
  status: string;
  product_id: string;
  price_id: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  paddle_subscription_id: string;
  paddle_customer_id: string;
  environment: string;
};

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSub = async (uid: string) => {
    const env = getPaddleEnvironment();
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", uid)
      .eq("environment", env)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setSubscription((data as SubscriptionRow | null) ?? null);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    fetchSub(user.id);

    const channelName = `subscriptions:${user.id}:${Math.random().toString(36).slice(2)}`;
    const channel = supabase.channel(channelName);
    channel
      .on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${user.id}` },
        () => fetchSub(user.id)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const lifetime = isLifetimePrice(subscription?.price_id);

  const isActive = !!subscription && (
    lifetime ||
    (["active", "trialing", "past_due"].includes(subscription.status) &&
      (!subscription.current_period_end || new Date(subscription.current_period_end) > new Date())) ||
    (subscription.status === "canceled" &&
      !!subscription.current_period_end &&
      new Date(subscription.current_period_end) > new Date())
  );

  const tier: PlanId = !isActive
    ? "free"
    : lifetime
      ? "pro"
      : planFromProductId(subscription?.product_id);

  const cadence = lifetime ? null : cadenceFromPriceId(subscription?.price_id);

  return {
    subscription,
    isActive,
    tier,
    plan: tier,
    cadence,
    lifetime,
    loading,
    can: (capability: Capability) => canDo(tier, capability),
  };
}

