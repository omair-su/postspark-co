import { useState } from "react";
import { toast } from "sonner";
import { initializePaddle, getPaddlePriceId } from "@/lib/paddle";
import { useAuth } from "@/hooks/useAuth";
import { track } from "@/lib/analytics";

export function usePaddleCheckout() {
  const [loading, setLoading] = useState(false);
  const { session } = useAuth();

  const openCheckout = async (options: {
    priceId: string;
    customerEmail?: string;
    userId: string;
    successUrl?: string;
    /** Optional analytics context: plan, cadence, trigger surface. */
    meta?: Record<string, string | number | boolean | null>;
  }): Promise<boolean> => {
    if (!session) {
      toast.error("Please sign in again to start checkout.");
      track("checkout_failed", { price_id: options.priceId, reason: "no_session", ...options.meta });
      return false;
    }
    setLoading(true);
    try {
      await initializePaddle();
      const paddlePriceId = await getPaddlePriceId(options.priceId, session.access_token);

      track("checkout_open", { price_id: options.priceId, ...options.meta });

      window.Paddle.Checkout.open({
        items: [{ priceId: paddlePriceId, quantity: 1 }],
        customer: options.customerEmail ? { email: options.customerEmail } : undefined,
        customData: { userId: options.userId },
        settings: {
          displayMode: "overlay",
          successUrl:
            options.successUrl ||
            `${window.location.origin}/dashboard/billing?checkout=success&price=${encodeURIComponent(options.priceId)}`,
          allowLogout: false,
          variant: "one-page",
        },
      });
      return true;
    } catch (e: any) {
      const message = e?.message || "Checkout could not be opened. Please try again.";
      console.error("[checkout] failed:", e);
      toast.error(message);
      track("checkout_failed", { price_id: options.priceId, reason: message.slice(0, 120), ...options.meta });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { openCheckout, loading };
}
