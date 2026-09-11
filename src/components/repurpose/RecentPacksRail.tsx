import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Loader2, RotateCcw, Copy, GitCompare, Sparkles, X, Clock, Star,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listRecentPacks, getPack, evergreenAngles } from "@/lib/repurposePacks.functions";

export interface RecentPackSummary {
  id: string;
  title: string;
  createdAt: string;
  isFavorite: boolean;
  formats: string[];
  preview: string;
}

export interface LoadedPack {
  id: string;
  title: string;
  createdAt: string;
  inputText: string;
  outputs: Record<string, string>;
}

export interface EvergreenAngle {
  title: string;
  angle: string;
  hook: string;
}

interface Props {
  /** Bump to refetch (e.g. after a new pack finishes). */
  refreshKey?: number;
  formatLabel: (id: string) => string;
  onReopen: (pack: LoadedPack) => void;
  onDuplicate: (pack: LoadedPack) => void;
  onEvergreen: (pack: LoadedPack, angle: EvergreenAngle) => void;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 60) return `${Math.max(1, m)}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function RecentPacksRail({
  refreshKey = 0, formatLabel, onReopen, onDuplicate, onEvergreen,
}: Props) {
  const { session } = useAuth();
  const [packs, setPacks] = useState<RecentPackSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compare, setCompare] = useState<{ a: LoadedPack; b: LoadedPack } | null>(null);

  const [angleFor, setAngleFor] = useState<LoadedPack | null>(null);
  const [angles, setAngles] = useState<EvergreenAngle[]>([]);

  const auth = session ? { headers: { Authorization: `Bearer ${session.access_token}` } } : null;

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    listRecentPacks({ data: { limit: 12 }, headers: { Authorization: `Bearer ${session.access_token}` } })
      .then((res: any) => setPacks(res?.packs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session, refreshKey]);

  const load = useCallback(async (id: string): Promise<LoadedPack | null> => {
    if (!auth) return null;
    const res: any = await getPack({ data: { jobId: id }, ...auth });
    return res?.pack || null;
  }, [session]);

  const act = async (id: string, kind: "reopen" | "duplicate" | "angles") => {
    setBusyId(id);
    try {
      const pack = await load(id);
      if (!pack) { toast.error("Could not open that pack"); return; }
      if (kind === "reopen") { onReopen(pack); return; }
      if (kind === "duplicate") { onDuplicate(pack); return; }

      const res: any = await evergreenAngles({ data: { jobId: id }, ...(auth as any) });
      if (res?.error || !res?.angles?.length) { toast.error(res?.error || "No new angles found"); return; }
      setAngles(res.angles);
      setAngleFor(pack);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusyId(null);
    }
  };

  const toggleCompare = async (id: string) => {
    const next = compareIds.includes(id)
      ? compareIds.filter((x) => x !== id)
      : [...compareIds, id].slice(-2);
    setCompareIds(next);
    if (next.length === 2) {
      setBusyId(id);
      try {
        const [a, b] = await Promise.all([load(next[0]!), load(next[1]!)]);
        if (a && b) setCompare({ a, b });
      } finally { setBusyId(null); }
    }
  };

  if (!session) return null;

  return (
    <div className="pw-surface mt-6 p-4 md:p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Recent packs</h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {compareIds.length === 1 ? "Pick a second pack to compare" : "Reopen · Duplicate · Compare · Fresh angles"}
        </span>
      </div>

      {loading && !packs.length ? (
        <div className="mt-4 flex gap-3 overflow-hidden">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 w-64 shrink-0 animate-pulse rounded-xl bg-muted/40" />
          ))}
        </div>
      ) : !packs.length ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Your generated packs will appear here so you can reopen or recycle them.
        </p>
      ) : (
        <div className="-mx-1 mt-4 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
          {packs.map((p) => {
            const selected = compareIds.includes(p.id);
            return (
              <div
                key={p.id}
                className={`group relative w-64 shrink-0 snap-start rounded-xl border p-3 transition-all hover:-translate-y-0.5 ${
                  selected ? "border-primary bg-primary/5" : "border-border bg-card/60"
                }`}
              >
                <div className="flex items-start gap-2">
                  {p.isFavorite && <Star className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />}
                  <p className="line-clamp-2 text-sm font-medium leading-snug">{p.title}</p>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">{timeAgo(p.createdAt)}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {p.formats.slice(0, 4).map((f) => (
                    <span key={f} className="rounded-full bg-muted/60 px-2 py-0.5 text-[10px] text-muted-foreground">
                      {formatLabel(f)}
                    </span>
                  ))}
                  {p.formats.length > 4 && (
                    <span className="text-[10px] text-muted-foreground">+{p.formats.length - 4}</span>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-1">
                  <button
                    onClick={() => act(p.id, "reopen")}
                    disabled={busyId === p.id}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11px] hover:border-primary/50 hover:text-primary"
                  >
                    {busyId === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                    Reopen
                  </button>
                  <button
                    onClick={() => act(p.id, "duplicate")}
                    disabled={busyId === p.id}
                    title="Load the same source and formats, ready to re-run"
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11px] hover:border-primary/50 hover:text-primary"
                  >
                    <Copy className="h-3 w-3" /> Duplicate
                  </button>
                  <button
                    onClick={() => toggleCompare(p.id)}
                    title="Compare with another pack"
                    className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] ${
                      selected ? "border-primary text-primary" : "border-border hover:border-primary/50 hover:text-primary"
                    }`}
                  >
                    <GitCompare className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => act(p.id, "angles")}
                    disabled={busyId === p.id}
                    title="Fresh angles from this winner"
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11px] hover:border-primary/50 hover:text-primary"
                  >
                    <Sparkles className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ---------- Compare drawer ---------- */}
      {compare && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4" onClick={() => { setCompare(null); setCompareIds([]); }}>
          <div className="max-h-[85vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-base font-semibold">Compare packs</h4>
              <button onClick={() => { setCompare(null); setCompareIds([]); }} className="rounded-lg p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {[compare.a, compare.b].map((pk) => (
                <div key={pk.id} className="rounded-xl border border-border p-3">
                  <p className="text-sm font-semibold">{pk.title}</p>
                  <p className="mb-3 text-[11px] text-muted-foreground">{timeAgo(pk.createdAt)}</p>
                  <div className="space-y-3">
                    {Object.entries(pk.outputs).filter(([, v]) => v?.trim()).map(([f, v]) => (
                      <div key={f}>
                        <p className="text-xs font-medium text-primary">{formatLabel(f)}</p>
                        <p className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">{v.slice(0, 900)}</p>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => { onReopen(pk); setCompare(null); setCompareIds([]); }}
                    className="mt-3 w-full rounded-lg border border-border py-1.5 text-xs hover:border-primary/50 hover:text-primary"
                  >
                    Reopen this one
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------- Evergreen angles ---------- */}
      {angleFor && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4" onClick={() => setAngleFor(null)}>
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-1 flex items-center justify-between">
              <h4 className="text-base font-semibold">Fresh angles</h4>
              <button onClick={() => setAngleFor(null)} className="rounded-lg p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <p className="mb-4 text-xs text-muted-foreground line-clamp-1">From “{angleFor.title}”</p>
            <div className="space-y-2">
              {angles.map((a, i) => (
                <button
                  key={i}
                  onClick={() => { onEvergreen(angleFor, a); setAngleFor(null); }}
                  className="w-full rounded-xl border border-border p-3 text-left transition-colors hover:border-primary/60 hover:bg-primary/5"
                >
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{a.angle}</p>
                  {a.hook && <p className="mt-2 text-xs italic text-primary/80">“{a.hook}”</p>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
