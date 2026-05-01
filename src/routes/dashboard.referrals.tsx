import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getReferralStats } from "@/server/referrals.functions";
import { Gift, Copy, Check, Users, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/referrals")({
  component: ReferralsPage,
});

interface Stats {
  code: string | null;
  total: number;
  rewarded: number;
  pending: number;
  items: Array<{ id: string; status: string; created_at: string }>;
}

function ReferralsPage() {
  const { session } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!session) return;
    getReferralStats({ headers: { Authorization: `Bearer ${session.access_token}` } })
      .then((s) => setStats(s as Stats))
      .finally(() => setLoading(false));
  }, [session]);

  const link = stats?.code
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/signup?ref=${stats.code}`
    : "";

  const copy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl">
        <Loader2 className="mx-auto mt-20 h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">Refer & Earn</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Invite friends. When they upgrade to Pro, you both get rewards.
      </p>

      <div className="mt-6 rounded-2xl gradient-electric p-6 text-primary-foreground">
        <Gift className="h-6 w-6" />
        <h2 className="mt-3 text-lg font-bold">Your unique link</h2>
        <p className="mt-1 text-sm opacity-90">
          Share this link — earn 1 free month of Pro for every paid signup.
        </p>
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-background/10 p-2">
          <code className="flex-1 truncate text-xs sm:text-sm">{link || "—"}</code>
          <button
            onClick={copy}
            className="flex items-center gap-1 rounded-md bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-background/90"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon={<Users className="h-4 w-4" />} label="Total invites" value={stats?.total ?? 0} />
        <StatCard icon={<Sparkles className="h-4 w-4" />} label="Rewarded" value={stats?.rewarded ?? 0} />
        <StatCard icon={<Gift className="h-4 w-4" />} label="Pending" value={stats?.pending ?? 0} />
      </div>

      <div className="mt-8 rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground">How it works</h3>
        <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>1. Share your link with friends.</li>
          <li>2. They sign up and try PostSpark free.</li>
          <li>3. When they upgrade to Pro, you get a free month — they get 20% off.</li>
        </ol>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground">Recent invites</h3>
        {stats && stats.items.length > 0 ? (
          <ul className="mt-3 divide-y divide-border">
            {stats.items.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    r.status === "rewarded"
                      ? "bg-green-500/15 text-green-600"
                      : "bg-yellow-500/15 text-yellow-700"
                  }`}
                >
                  {r.status}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">No invites yet — share your link!</p>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground">{icon}<span className="text-xs">{label}</span></div>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
