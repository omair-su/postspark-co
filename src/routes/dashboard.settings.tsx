import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Crown, User, Sparkles, ArrowRight, ExternalLink } from "lucide-react";
import { getMonthlyUsage } from "@/server/repurpose.functions";
import { useSubscription } from "@/hooks/useSubscription";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { createPortalSession } from "@/server/payments.functions";
import { getPaddleEnvironment } from "@/lib/paddle";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user, session } = useAuth();
  const [name, setName] = useState(user?.user_metadata?.full_name || user?.user_metadata?.name || "");
  const [email] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [usage, setUsage] = useState<{ used: number; limit: number; plan?: string } | null>(null);

  useEffect(() => {
    if (!session) return;

    getMonthlyUsage({ headers: { Authorization: `Bearer ${session.access_token}` } })
      .then(setUsage)
      .catch(() => {});
  }, [session]);

  const plan = usage?.plan || "free";
  const isUnlimited = usage?.limit === -1;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: name },
    });
    setSavingProfile(false);
    if (error) toast.error(error.message);
    else toast.success("Profile updated!");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSavingPassword(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Password updated!");
      setPassword("");
    }
  };

  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <div className="mx-auto max-w-xl animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">Manage your account and subscription.</p>

      {/* Profile card */}
      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-4 mb-5">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div>
            <p className="font-semibold text-foreground">{name || "User"}</p>
            <p className="text-xs text-muted-foreground">{email}</p>
          </div>
        </div>

        <h2 className="text-sm font-semibold text-foreground">Profile</h2>
        <form onSubmit={handleUpdateProfile} className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-foreground">Full Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground">Email</label>
            <input
              value={email}
              disabled
              className="mt-1 w-full rounded-lg border border-input bg-muted px-3 py-2 text-sm text-muted-foreground"
            />
          </div>
          <button
            type="submit"
            disabled={savingProfile}
            className="flex items-center gap-2 rounded-lg gradient-electric px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {savingProfile && <Loader2 className="h-3 w-3 animate-spin" />}
            Save Changes
          </button>
        </form>
      </div>

      {/* Password */}
      <div className="mt-4 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">Change Password</h2>
        <form onSubmit={handleChangePassword} className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-foreground">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            type="submit"
            disabled={savingPassword}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent disabled:opacity-50"
          >
            {savingPassword && <Loader2 className="h-3 w-3 animate-spin" />}
            Update Password
          </button>
        </form>
      </div>

      {/* Brand Kit shortcut */}
      <Link
        to="/dashboard/brand-kit"
        className="mt-4 flex items-center justify-between rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-electric">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Brand Kit</p>
            <p className="text-xs text-muted-foreground">Logo, colors, fonts & preferred tone — auto-applied to every generation.</p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </Link>

      <SubscriptionCard usage={usage} />
    </div>
  );
}

function SubscriptionCard({ usage }: { usage: { used: number; limit: number; plan?: string } | null }) {
  const { user, session } = useAuth();
  const { subscription, tier, isActive } = useSubscription();
  const { openCheckout, loading: checkoutLoading } = usePaddleCheckout();
  const [portalLoading, setPortalLoading] = useState(false);

  const plan = tier ?? usage?.plan ?? "free";
  const isUnlimited = plan !== "free";

  const handleUpgrade = async (priceId: string) => {
    if (!user) return;
    await openCheckout({ priceId, userId: user.id, customerEmail: user.email });
  };

  const handleManageBilling = async () => {
    if (!user || !session) return;
    setPortalLoading(true);
    try {
      const result = await createPortalSession({
        data: { environment: getPaddleEnvironment() },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      window.open(result.overviewUrl, "_blank");
    } catch (e: any) {
      toast.error(e?.message || "Could not open billing portal");
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <Crown className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Subscription</h2>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
          plan === "free"
            ? "bg-accent text-accent-foreground"
            : "gradient-electric text-primary-foreground"
        }`}>
          {plan.toUpperCase()}
        </span>
        {isUnlimited ? (
          <span className="text-xs text-muted-foreground">Unlimited repurposes</span>
        ) : (
          <span className="text-xs text-muted-foreground">
            {usage?.used ?? 0} / {usage?.limit ?? 3} repurposes this month
          </span>
        )}
      </div>

      {subscription?.status === "trialing" && subscription.current_period_end && (
        <p className="mt-3 text-xs font-medium text-primary">
          🎉 Free trial — ends {new Date(subscription.current_period_end).toLocaleDateString()}. You'll be charged automatically unless you cancel.
        </p>
      )}

      {subscription?.status === "past_due" && (
        <p className="mt-3 text-xs font-medium text-destructive">
          ⚠️ Payment failed. Update your card via Manage billing to keep your subscription active.
        </p>
      )}

      {subscription && subscription.cancel_at_period_end && subscription.current_period_end && (
        <p className="mt-3 text-xs text-orange-600 dark:text-orange-400">
          Subscription ends on {new Date(subscription.current_period_end).toLocaleDateString()}.
        </p>
      )}

      {plan === "free" ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm font-semibold text-foreground">Pro</p>
            <p className="mt-1 text-xs text-muted-foreground">Unlimited repurposes & priority generation.</p>
            <button
              onClick={() => handleUpgrade("pro_monthly_trial")}
              disabled={checkoutLoading}
              className="mt-3 flex items-center justify-center gap-2 w-full rounded-lg gradient-electric px-3 py-2 text-sm font-semibold text-primary-foreground glow-electric disabled:opacity-50"
            >
              {checkoutLoading && <Loader2 className="h-3 w-3 animate-spin" />}
              Start 14-day free trial
            </button>
            <p className="mt-2 text-center text-[10px] text-muted-foreground">Then $19/mo · cancel anytime</p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <p className="text-sm font-semibold text-foreground">Agency</p>
            <p className="mt-1 text-xs text-muted-foreground">Team seats, multi-brand & white-label.</p>
            <button
              onClick={() => handleUpgrade("agency_monthly_trial")}
              disabled={checkoutLoading}
              className="mt-3 flex items-center justify-center gap-2 w-full rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent disabled:opacity-50"
            >
              {checkoutLoading && <Loader2 className="h-3 w-3 animate-spin" />}
              Start 14-day free trial
            </button>
            <p className="mt-2 text-center text-[10px] text-muted-foreground">Then $49/mo · cancel anytime</p>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {plan === "pro" && isActive && (
            <button
              onClick={() => handleUpgrade("agency_monthly")}
              disabled={checkoutLoading}
              className="flex items-center justify-center gap-2 w-full rounded-lg gradient-electric px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {checkoutLoading && <Loader2 className="h-3 w-3 animate-spin" />}
              Upgrade to Agency — $49/mo
            </button>
          )}
          <button
            onClick={handleManageBilling}
            disabled={portalLoading}
            className="flex items-center justify-center gap-2 w-full rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent disabled:opacity-50"
          >
            {portalLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ExternalLink className="h-3 w-3" />}
            Manage billing
          </button>
        </div>
      )}
    </div>
  );
}
