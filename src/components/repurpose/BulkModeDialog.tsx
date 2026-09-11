import { useState } from "react";
import { toast } from "sonner";
import { Loader2, X, Layers, Rss, Link as LinkIcon, Crown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { bulkExtractSources } from "@/lib/repurposePacks.functions";
import bulkModeArt from "@/assets/premium/repurpose-bulk-mode.jpg";

export interface BulkSource {
  url: string;
  title: string;
  text: string;
  words: number;
  error?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** Called with the readable sources the user confirmed. */
  onRun: (sources: BulkSource[]) => void;
  isPro: boolean;
}

export function BulkModeDialog({ open, onClose, onRun, isPro }: Props) {
  const { session } = useAuth();
  const [mode, setMode] = useState<"urls" | "feed">("urls");
  const [raw, setRaw] = useState("");
  const [feed, setFeed] = useState("");
  const [max, setMax] = useState(5);
  const [busy, setBusy] = useState(false);
  const [sources, setSources] = useState<BulkSource[] | null>(null);

  if (!open) return null;

  const fetchSources = async () => {
    if (!session) return toast.error("Please sign in");
    const urls = raw.split(/[\s,]+/).map((s) => s.trim()).filter((s) => /^https?:\/\//i.test(s)).slice(0, 10);
    if (mode === "urls" && !urls.length) return toast.error("Paste at least one link");
    if (mode === "feed" && !/^https?:\/\//i.test(feed.trim())) return toast.error("Paste an RSS or Atom feed URL");

    setBusy(true);
    try {
      const res: any = await bulkExtractSources({
        data: mode === "urls" ? { urls, max } : { feedUrl: feed.trim(), max },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res?.error) { toast.error(res.error); return; }
      const list: BulkSource[] = res?.sources || [];
      setSources(list);
      const ok = list.filter((s) => !s.error && s.words > 50).length;
      if (!ok) toast.error("None of those links had readable content");
      else toast.success(`${ok} source${ok > 1 ? "s" : ""} ready`);
    } catch (e: any) {
      toast.error(e?.message || "Could not read those links");
    } finally { setBusy(false); }
  };

  const usable = (sources || []).filter((s) => !s.error && s.words > 50);

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Bulk mode"
        className="max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-border bg-card p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" aria-hidden="true" />
            <h4 className="text-base font-semibold">Bulk mode</h4>
            {!isPro && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                <Crown className="h-3 w-3" aria-hidden="true" /> Pro
              </span>
            )}
          </div>
          <button onClick={onClose} aria-label="Close" className="rp-focus rounded-lg p-1.5 hover:bg-muted">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="mb-4 flex items-center gap-3">
          <img
            src={bulkModeArt}
            alt=""
            loading="lazy"
            width={1024}
            height={640}
            className="h-14 w-24 shrink-0 rounded-lg object-cover"
          />
          <p className="text-xs text-muted-foreground">
            Drop up to 10 links or one feed. Each source becomes its own content pack, generated one after another.
          </p>
        </div>

        <div className="mb-3 flex gap-2">
          <button
            onClick={() => setMode("urls")}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs ${mode === "urls" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
          >
            <LinkIcon className="h-3.5 w-3.5" /> Links
          </button>
          <button
            onClick={() => setMode("feed")}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs ${mode === "feed" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
          >
            <Rss className="h-3.5 w-3.5" /> RSS feed
          </button>
        </div>

        {mode === "urls" ? (
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={5}
            placeholder={"https://example.com/post-one\nhttps://example.com/post-two"}
            className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary/60"
          />
        ) : (
          <input
            value={feed}
            onChange={(e) => setFeed(e.target.value)}
            placeholder="https://example.com/feed.xml"
            className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary/60"
          />
        )}

        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <span>Max packs</span>
          {[3, 5, 10].map((n) => (
            <button
              key={n}
              onClick={() => setMax(n)}
              className={`rounded-lg border px-2 py-1 ${max === n ? "border-primary text-primary" : "border-border"}`}
            >
              {n}
            </button>
          ))}
          <span className="ml-auto">Each pack uses one monthly credit</span>
        </div>

        {sources && (
          <div className="mt-4 space-y-2">
            {sources.map((s) => (
              <div key={s.url} className="rounded-xl border border-border p-2.5">
                <p className="line-clamp-1 text-sm font-medium">{s.title}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {s.error ? <span className="text-red-500">{s.error}</span> : `${s.words} words`}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 flex gap-2">
          <button
            onClick={fetchSources}
            disabled={busy}
            className="flex-1 rounded-xl border border-border py-2 text-sm font-medium hover:border-primary/50 hover:text-primary disabled:opacity-60"
          >
            {busy ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : sources ? "Re-read links" : "Read links"}
          </button>
          <button
            onClick={() => { onRun(usable); onClose(); }}
            disabled={!usable.length || busy}
            className="flex-1 rounded-xl bg-primary py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            Generate {usable.length || ""} pack{usable.length === 1 ? "" : "s"}
          </button>
        </div>
      </div>
    </div>
  );
}
