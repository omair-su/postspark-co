import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Crown, User, Sparkles, ArrowRight, ExternalLink, Trash2, Mic } from "lucide-react";
import { getMonthlyUsage } from "@/lib/repurpose.functions";
import { useSubscription } from "@/hooks/useSubscription";
import { deleteAccount } from "@/lib/payments.functions";
import { PLANS } from "@/lib/plans";
import { PublicShowcaseSettings } from "@/components/PublicShowcaseSettings";
import { ConnectedAccountsCard } from "@/components/ConnectedAccountsCard";
import { XAnalyticsCard } from "@/components/publish/XAnalyticsCard";
import { HeroArt } from "@/components/dashboard/HeroArt";
import { GoogleGIcon } from "@/components/google/GoogleIcons";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const location = useLocation();
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
  if (location.pathname !== "/dashboard/settings") return <Outlet />;

  return (
    <div className="mx-auto max-w-xl animate-fade-in space-y-5">
      <section className="ds-page-hero">
        <HeroArt art="hero" />
        <span className="ds-page-hero-eyebrow">⚙︎ Account</span>
        <h1 className="ds-page-hero-title">Your <span className="grad">Settings</span></h1>
        <p className="ds-page-hero-sub">Profile, plan, and preferences — all in one place.</p>
      </section>


      {/* Profile card */}
      <div className="ps-liquid mt-6 p-5">
        <div className="flex items-center gap-4 mb-5">
          {avatarUrl ? (
            <img src={avatarUrl} alt="User profile photo" className="h-12 w-12 rounded-full object-cover" />
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

      <PublicShowcaseSettings />
      <ConnectedAccountsCard />
      <XAnalyticsCard />
      <WeeklyDigestToggle />

      {/* Password */}
      <div className="ps-liquid mt-4 p-5">
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
        className="ps-liquid ps-liquid-link mt-4 flex items-center justify-between p-5"
      >
        <div className="flex items-center gap-3">
          <div className="ps-liquid-icon">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Brand Kit</p>
            <p className="text-xs text-muted-foreground">Logo, colors, fonts & preferred tone — auto-applied to every generation.</p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </Link>

      {/* Brand Voice shortcut — used by Spark Copilot, Repurpose, Reply Generator */}
      <Link
        to="/dashboard/brand-voice"
        className="ps-liquid ps-liquid-link mt-4 flex items-center justify-between p-5"
      >
        <div className="flex items-center gap-3">
          <div className="ps-liquid-icon">
            <Mic className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Brand Voice / Style</p>
            <p className="text-xs text-muted-foreground">Train Spark to write replies and content in your exact tone.</p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </Link>

      {/* Google Workspace shortcut */}
      <Link
        to="/dashboard/settings/google"
        className="ps-liquid ps-liquid-link mt-4 flex items-center justify-between p-5"
      >
        <div className="flex items-center gap-3">
          <div className="ps-liquid-icon">
            <GoogleGIcon size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Google Workspace</p>
            <p className="text-xs text-muted-foreground">
              Import from Drive & Docs as content sources, export finished content back to Google Docs.
            </p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </Link>

      <SubscriptionCard usage={usage} />
    </div>
  );
}
function SubscriptionCard({ usage }: { usage: { used: number; limit: number; plan?: string } | null }) {
  const { subscription, plan, cadence, lifetime, isActive } = useSubscription();
  const isUnlimited = plan !== "free";
  const renewal = subscription?.current_period_end ? new Date(subscription.current_period_end) : null;

  return (
    <div className="ps-liquid mt-4 p-5">
      <div className="flex items-center gap-2">
        <Crown className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Subscription</h2>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
            plan === "free" ? "bg-accent text-accent-foreground" : "gradient-electric text-primary-foreground"
          }`}
        >
          {PLANS[plan].name.toUpperCase()}
        </span>
        {cadence && !lifetime && (
          <span className="text-xs capitalize text-muted-foreground">{cadence} billing</span>
        )}
        {isUnlimited ? (
          <span className="text-xs text-muted-foreground">Unlimited repurposes</span>
        ) : (
          <span className="text-xs text-muted-foreground">
            {usage?.used ?? 0} / {usage?.limit ?? 3} repurposes this month
          </span>
        )}
      </div>

      {subscription?.status === "trialing" && renewal && (
        <p className="mt-3 text-xs font-medium text-primary">
          Free trial — ends {renewal.toLocaleDateString()}. You'll be charged unless you cancel before then.
        </p>
      )}

      {subscription?.status === "past_due" && (
        <p className="mt-3 text-xs font-medium text-destructive">
          Payment failed. Update your card on the billing page to keep your subscription active.
        </p>
      )}

      {isActive && subscription?.cancel_at_period_end && renewal && (
        <p className="mt-3 text-xs text-orange-600 dark:text-orange-400">
          Subscription ends on {renewal.toLocaleDateString()} — you keep access until then.
        </p>
      )}

      <Link
        to="/dashboard/billing"
        className={`mt-4 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
          plan === "free"
            ? "gradient-electric text-primary-foreground glow-electric"
            : "border border-border text-foreground hover:bg-accent"
        }`}
      >
        {plan === "free" ? <Sparkles className="h-3.5 w-3.5" /> : <ExternalLink className="h-3.5 w-3.5" />}
        {plan === "free" ? "See plans & start free trial" : "Manage plan & billing"}
      </Link>
      <p className="mt-2 text-center text-[10px] text-muted-foreground">
        Plans, pricing, upgrades and invoices all live on the billing page.
      </p>
      <DangerZone />
    </div>
  );
}

function DangerZone() {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [deleting, setDeleting] = useState(false);

  const onDelete = async () => {
    if (!session || !user) return;
    setDeleting(true);
    try {
      await deleteAccount({
        data: { confirmationEmail: confirmEmail.trim() },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      await supabase.auth.signOut();
      toast.success("Account deleted");
      navigate({ to: "/" });
    } catch (e: any) {
      toast.error(e?.message || "Could not delete account");
      setDeleting(false);
    }
  };

  return (
    <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-5">
      <div className="flex items-center gap-2">
        <Trash2 className="h-4 w-4 text-destructive" />
        <h2 className="text-sm font-semibold text-foreground">Danger zone</h2>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Permanently delete your account and cancel any active subscription. This cannot be undone.
      </p>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="mt-3 rounded-lg border border-destructive/40 px-3 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10"
        >
          Delete my account
        </button>
      ) : (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-foreground">Type <span className="font-mono font-semibold">{user?.email}</span> to confirm:</p>
          <input
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            placeholder={user?.email}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
          />
          <div className="flex gap-2">
            <button
              onClick={() => { setOpen(false); setConfirmEmail(""); }}
              disabled={deleting}
              className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:bg-accent disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onDelete}
              disabled={deleting || confirmEmail.trim().toLowerCase() !== (user?.email ?? "").toLowerCase()}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-destructive px-3 py-2 text-sm font-semibold text-destructive-foreground hover:opacity-90 disabled:opacity-50"
            >
              {deleting && <Loader2 className="h-3 w-3 animate-spin" />}Delete forever
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function WeeklyDigestToggle() {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (supabase as any)
      .from("profiles")
      .select("weekly_digest_enabled")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: any) => setEnabled(data?.weekly_digest_enabled ?? true));
  }, [user]);

  const handleToggle = async () => {
    if (!user || enabled === null) return;
    setSaving(true);
    const next = !enabled;
    const { error } = await (supabase as any)
      .from("profiles")
      .update({ weekly_digest_enabled: next })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Could not update preference");
    } else {
      setEnabled(next);
      toast.success(next ? "Weekly digest enabled" : "Weekly digest disabled");
    }
  };

  return (
    <div className="ps-liquid mt-4 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Weekly digest email</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Every Monday, get a summary of your scheduled drafts and recent generations with a quick CTA to review and edit.
          </p>
        </div>
        <button
          onClick={handleToggle}
          disabled={enabled === null || saving}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${enabled ? "bg-primary" : "bg-muted"}`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              enabled ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
