import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { pingImageModels } from "@/lib/imageModelHealth.functions";
import { Loader2, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";

type ModelStatus = { ok: boolean; latencyMs: number; error?: string };
type Health = { gpt: ModelStatus; flux: ModelStatus; gemini: ModelStatus; checkedAt: string };

const LABELS: Record<keyof Omit<Health, "checkedAt">, { name: string; color: string }> = {
  gpt: { name: "GPT Image 2", color: "#059669" },
  flux: { name: "Flux Pro 1.1", color: "#F97316" },
  gemini: { name: "Gemini Image", color: "#1DA1F2" },
};

export function ModelHealthBadge({ compact = false }: { compact?: boolean }) {
  const { session } = useAuth();
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(false);

  const check = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const h = await pingImageModels({
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setHealth(h as Health);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.access_token]);

  const allOk = health && health.gpt.ok && health.flux.ok && health.gemini.ok;

  if (compact) {
    return (
      <button
        onClick={check}
        title={health ? `gpt:${health.gpt.ok ? "ok" : "down"} flux:${health.flux.ok ? "ok" : "down"} gemini:${health.gemini.ok ? "ok" : "down"}` : "Check models"}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium hover:bg-accent"
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : allOk ? (
          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
        ) : (
          <AlertTriangle className="h-3 w-3 text-amber-500" />
        )}
        Models {allOk ? "online" : health ? "issue" : "—"}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Image model status
        </div>
        <button
          onClick={check}
          disabled={loading}
          className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-[10px] hover:bg-accent disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <RefreshCw className="h-2.5 w-2.5" />}
          Recheck
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(LABELS) as (keyof typeof LABELS)[]).map((k) => {
          const s = health?.[k];
          const ok = s?.ok;
          return (
            <div key={k} className="flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-1.5">
              <span
                className={`inline-block h-2 w-2 rounded-full ${ok ? "bg-emerald-500" : s ? "bg-rose-500" : "bg-muted-foreground/40"}`}
                style={ok ? { boxShadow: "0 0 6px rgba(16,185,129,0.6)" } : undefined}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[11px] font-semibold" style={{ color: LABELS[k].color }}>
                  {LABELS[k].name}
                </div>
                <div className="truncate text-[9px] text-muted-foreground">
                  {loading ? "checking…" : s ? (s.ok ? `${s.latencyMs}ms` : s.error || "down") : "—"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
