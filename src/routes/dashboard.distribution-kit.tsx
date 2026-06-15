import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Copy, Check, ExternalLink, Rocket } from "lucide-react";
import { isCurrentUserAdmin } from "@/lib/blogAdmin.functions";

export const Route = createFileRoute("/dashboard/distribution-kit")({
  component: DistributionKitPage,
});

const SHORT_DESC = `PostSpark turns one piece of content into 30 platform-ready posts — LinkedIn, X, Instagram, TikTok, threads, carousels, shorts. AI repurposing built for solo creators and agencies.`;

const LONG_DESC = `PostSpark is the AI content repurposing platform for creators, founders and agencies who want to be everywhere without writing everything from scratch. Paste a blog post, YouTube video, or podcast — get 30 platform-native posts in 90 seconds: LinkedIn long-form, X threads, Instagram captions, TikTok scripts, LinkedIn carousels, newsletters, SEO blog drafts. Brand Voice AI trains on your real posts so the output sounds like you. Hook Lab scores hooks against viral patterns. Image Studio + Thumbnail Maker handle every visual. Free plan: 3 repurposes/month. Pro: $24/mo unlimited. Founding Lifetime: $97 once, first 50 only.`;

const TAGS = ["content repurposing", "AI writing", "social media tools", "creator tools", "LinkedIn AI", "Twitter AI", "TikTok script generator", "newsletter", "podcast tools", "marketing automation"];

const DIRECTORIES = [
  { name: "Futurepedia", url: "https://www.futurepedia.io/submit-tool" },
  { name: "There's An AI For That", url: "https://theresanaiforthat.com/submit/" },
  { name: "FutureTools", url: "https://www.futuretools.io/submit-a-tool" },
  { name: "AItoolsdirectory", url: "https://aitoolsdirectory.com/submit/" },
  { name: "Toolify.ai", url: "https://www.toolify.ai/submit-tool" },
  { name: "AI Library", url: "https://library.phygital.plus/" },
  { name: "Product Hunt", url: "https://www.producthunt.com/posts/new" },
  { name: "BetaList", url: "https://betalist.com/submit" },
  { name: "Indie Hackers", url: "https://www.indiehackers.com/products" },
  { name: "Perplexity Pages", url: "https://www.perplexity.ai/" },
];

function DistributionKitPage() {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!session) { navigate({ to: "/login" }); return; }
    (async () => {
      try {
        const r = await isCurrentUserAdmin({ headers: { Authorization: `Bearer ${session.access_token}` } });
        setIsAdmin(r.isAdmin);
      } catch { setIsAdmin(false); }
      setChecking(false);
    })();
    try {
      const raw = localStorage.getItem("postspark.distribution_checklist");
      if (raw) setDone(JSON.parse(raw));
    } catch {}
  }, [session, authLoading, navigate]);

  const toggle = (k: string) => {
    setDone((prev) => {
      const next = { ...prev, [k]: !prev[k] };
      try { localStorage.setItem("postspark.distribution_checklist", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success("Copied");
    setTimeout(() => setCopied(null), 1500);
  };

  if (checking) return <div className="flex items-center justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <h1 className="text-xl font-bold">Admin only</h1>
        <Link to="/dashboard" className="mt-4 inline-flex items-center gap-2 text-sm text-primary"><ArrowLeft className="h-4 w-4" />Back</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4">
      <div className="flex items-start gap-3">
        <Rocket className="h-7 w-7 text-[#7C3AED]" />
        <div>
          <h1 className="text-2xl font-bold">Distribution Kit</h1>
          <p className="text-sm text-muted-foreground">Everything you need to list PostSpark on directories and ship 10 submissions in one sitting.</p>
        </div>
      </div>

      <Section title="Short description (140 chars-ish)">
        <CopyBlock id="short" text={SHORT_DESC} onCopy={copy} copied={copied === "short"} />
      </Section>

      <Section title="Long description">
        <CopyBlock id="long" text={LONG_DESC} onCopy={copy} copied={copied === "long"} />
      </Section>

      <Section title="Tags / categories">
        <CopyBlock id="tags" text={TAGS.join(", ")} onCopy={copy} copied={copied === "tags"} />
      </Section>

      <Section title="Screenshot checklist">
        <ul className="space-y-2 text-sm">
          {[
            "Hero — landing page, fold visible",
            "Dashboard — Repurpose Studio with output filled",
            "Hook Lab — 20 scored hooks",
            "Shorts Studio — script with shot list",
            "Pricing — Free / Pro / Founding Lifetime",
            "Brand Voice — Pro feature in action",
          ].map((label) => {
            const k = `ss:${label}`;
            return (
              <li key={k} className="flex items-center gap-2">
                <input type="checkbox" checked={!!done[k]} onChange={() => toggle(k)} />
                <span className={done[k] ? "line-through text-muted-foreground" : ""}>{label}</span>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title="Brand assets">
        <ul className="space-y-2 text-sm">
          <li>Logo (SVG) — <a className="text-[#7C3AED] underline" href="/favicon.svg" download>download</a></li>
          <li>Brand color (primary): <code className="rounded bg-[#F3F4F6] px-1.5 py-0.5">#7C3AED</code></li>
          <li>Brand color (dark): <code className="rounded bg-[#F3F4F6] px-1.5 py-0.5">#1A1A2E</code></li>
          <li>Tagline: "Turn 1 blog post into 30 platform-ready pieces"</li>
        </ul>
      </Section>

      <Section title="Submission checklist (10 directories)">
        <ul className="space-y-2 text-sm">
          {DIRECTORIES.map((d) => {
            const k = `dir:${d.name}`;
            return (
              <li key={d.name} className="flex items-center gap-2">
                <input type="checkbox" checked={!!done[k]} onChange={() => toggle(k)} />
                <span className={done[k] ? "line-through text-muted-foreground" : ""}>{d.name}</span>
                <a href={d.url} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-1 text-xs text-[#7C3AED] hover:underline"><ExternalLink className="h-3 w-3" /> Open</a>
              </li>
            );
          })}
        </ul>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function CopyBlock({ text, onCopy, copied, id }: { text: string; onCopy: (t: string, id: string) => void; copied: boolean; id: string }) {
  return (
    <div className="relative">
      <pre className="whitespace-pre-wrap rounded-lg bg-[#FAFAF8] p-3 pr-12 text-[13px] text-[#1A1A2E] font-sans">{text}</pre>
      <button onClick={() => onCopy(text, id)} className="absolute right-2 top-2 rounded border border-border bg-white p-1.5 text-[#6B7280] hover:text-[#7C3AED]">
        {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}
