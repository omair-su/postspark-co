import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getReferralStats } from "@/lib/referrals.functions";
import { Gift, Copy, Check, Users, Sparkles, Loader2, Twitter, Linkedin, Mail } from "lucide-react";
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

      {link && <ShareKit link={link} />}

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

const TEMPLATES = [
  {
    label: "Short & punchy",
    copy: (link: string) =>
      `I turned 1 blog post into 30 platform-ready posts in 90 seconds with @PostSparkApp.\n\nGame-changer for creators who hate rewriting:\n${link}`,
  },
  {
    label: "Founder story",
    copy: (link: string) =>
      `Been using PostSpark to repurpose my long-form content into LinkedIn, Twitter, and IG posts — saves me ~6 hours/week.\n\nFree to try here: ${link}`,
  },
  {
    label: "Curiosity hook",
    copy: (link: string) =>
      `One blog post = 30 posts across every platform.\n\nThat's PostSpark. I'm now publishing 5x more content without writing 5x more.\n\nTry it: ${link}`,
  },
];

function ShareKit({ link }: { link: string }) {
  const [active, setActive] = useState(0);
  const [text, setText] = useState(TEMPLATES[0].copy(link));

  useEffect(() => { setText(TEMPLATES[active].copy(link)); }, [active, link]);

  const tweet = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  const linkedin = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`;
  const mail = `mailto:?subject=${encodeURIComponent("You should try PostSpark")}&body=${encodeURIComponent(text)}`;

  const copyText = async () => {
    await navigator.clipboard.writeText(text);
    toast.success("Post copied — paste anywhere");
  };

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold text-foreground">Share kit — ready-made posts</h3>
      <p className="mt-1 text-xs text-muted-foreground">Pick a tone, tweak the words, share in one click.</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {TEMPLATES.map((t, i) => (
          <button
            key={t.label}
            onClick={() => setActive(i)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              i === active
                ? "bg-primary text-primary-foreground"
                : "border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="mt-3 min-h-[120px] w-full resize-y rounded-xl border border-input bg-muted/30 p-3 text-sm leading-relaxed text-foreground focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={tweet}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:opacity-90"
        >
          <Twitter className="h-3.5 w-3.5" /> Post to X
        </a>
        <a
          href={linkedin}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a66c2] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
        >
          <Linkedin className="h-3.5 w-3.5" /> Share on LinkedIn
        </a>
        <a
          href={mail}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary hover:text-primary"
        >
          <Mail className="h-3.5 w-3.5" /> Email a friend
        </a>
        <button
          onClick={copyText}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary hover:text-primary"
        >
          <Copy className="h-3.5 w-3.5" /> Copy text
        </button>
      </div>
    </div>
  );
}
