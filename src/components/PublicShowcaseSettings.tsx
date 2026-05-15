import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Globe, Loader2, Check, ExternalLink } from "lucide-react";
import { setHandle, getMyShowcaseInfo } from "@/lib/showcase.functions";
import { notify } from "@/lib/notify";

export function PublicShowcaseSettings() {
  const [handle, setHandleVal] = useState("");
  const [tagline, setTagline] = useState("");
  const [savedHandle, setSavedHandle] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [origin, setOrigin] = useState("");

  const save = useServerFn(setHandle);
  const fetchMine = useServerFn(getMyShowcaseInfo);

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
    fetchMine({}).then((r) => {
      const h = r.profile?.handle as string | undefined;
      const t = r.profile?.tagline as string | undefined;
      if (h) {
        setHandleVal(h);
        setSavedHandle(h);
      }
      if (t) setTagline(t);
    }).catch(() => {});
  }, [fetchMine]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await save({ data: { handle, tagline: tagline || undefined } });
      if (!res.ok) notify.error(res.error || "Couldn't save", { key: "handle-save" });
      else {
        setSavedHandle(res.handle!);
        notify.success("Public profile saved", { key: "handle-save" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Public showcase</h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Claim a public URL where your favourite repurposes appear. Great for SEO and sharing.
      </p>

      <form onSubmit={onSave} className="mt-4 space-y-3">
        <div>
          <label className="text-xs font-medium text-foreground">Handle</label>
          <div className="mt-1 flex rounded-lg border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring">
            <span className="px-3 py-2 text-xs text-muted-foreground bg-muted border-r border-border">
              {origin || "postspark.co"}/u/
            </span>
            <input
              value={handle}
              onChange={(e) => setHandleVal(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
              maxLength={30}
              placeholder="your-name"
              className="flex-1 px-3 py-2 text-sm text-foreground bg-transparent focus:outline-none"
            />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">3–30 chars · letters, numbers, _ and -</p>
        </div>
        <div>
          <label className="text-xs font-medium text-foreground">Tagline (optional)</label>
          <input
            value={tagline}
            onChange={(e) => setTagline(e.target.value.slice(0, 160))}
            placeholder="Founder writing about AI & growth"
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="submit"
            disabled={loading || handle.length < 3}
            className="inline-flex items-center gap-2 rounded-lg gradient-electric px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            Save
          </button>
          {savedHandle && (
            <a
              href={`/u/${savedHandle}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              View your page <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </form>
    </div>
  );
}
