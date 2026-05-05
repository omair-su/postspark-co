import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Mic, Loader2, Plus, Trash2, Check, Sparkles, X, Crown } from "lucide-react";
import {
  listBrandVoices,
  trainBrandVoice,
  setActiveBrandVoice,
  deleteBrandVoice,
} from "@/lib/brandVoice.functions";

interface Voice {
  id: string;
  name: string;
  style_summary: string | null;
  samples: string[];
  is_active: boolean;
  created_at: string;
}

export const Route = createFileRoute("/dashboard/brand-voice")({
  component: BrandVoicePage,
});

function BrandVoicePage() {
  const { session } = useAuth();
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [samples, setSamples] = useState<string[]>(["", "", ""]);

  const refresh = async () => {
    if (!session) return;
    const headers = { Authorization: `Bearer ${session.access_token}` };
    try {
      const { voices } = await listBrandVoices({ headers });
      setVoices((voices as Voice[]) || []);
    } catch {
      toast.error("Failed to load brand voices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [session]);

  const handleTrain = async () => {
    if (!session) return;
    if (!name.trim()) return toast.error("Give your voice a name");
    const filled = samples.map((s) => s.trim()).filter((s) => s.length >= 20);
    if (filled.length < 3) return toast.error("Provide at least 3 samples (20+ chars each)");

    setTraining(true);
    try {
      const result = await trainBrandVoice({
        data: { name: name.trim(), samples: filled },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!result.success) {
        toast.error(result.error || "Training failed");
      } else {
        toast.success("Brand voice trained! 🎯");
        setName("");
        setSamples(["", "", ""]);
        setShowForm(false);
        await refresh();
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setTraining(false);
    }
  };

  const handleActivate = async (id: string | null) => {
    if (!session) return;
    try {
      await setActiveBrandVoice({
        data: { id },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      toast.success(id ? "Voice activated" : "Voice deactivated");
      refresh();
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleDelete = async (id: string) => {
    if (!session) return;
    if (!confirm("Delete this brand voice?")) return;
    try {
      await deleteBrandVoice({
        data: { id },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      toast.success("Deleted");
      refresh();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const updateSample = (i: number, val: string) => {
    const next = [...samples];
    next[i] = val;
    setSamples(next);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Brand Voice</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
              <Crown className="h-3 w-3" /> Pro
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Train PostSpark to write like <em>you</em>. Paste 3–5 of your past posts and we'll mimic your style on every future generation.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-xl gradient-electric px-4 py-2 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 glow-electric"
          >
            <Plus className="h-4 w-4" /> Train New Voice
          </button>
        )}
      </div>

      {/* Training form */}
      {showForm && (
        <div className="mt-6 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Mic className="h-4 w-4 text-primary" /> Train a New Brand Voice
            </h2>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Voice name (e.g. My LinkedIn voice)"
            className="mt-4 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />

          <p className="mt-4 text-xs text-muted-foreground">
            Paste 3–5 samples of your real writing (tweets, LinkedIn posts, blog excerpts — anything that sounds like you). 20+ characters each.
          </p>

          <div className="mt-3 space-y-3">
            {samples.map((s, i) => (
              <div key={i} className="relative">
                <textarea
                  value={s}
                  onChange={(e) => updateSample(i, e.target.value)}
                  placeholder={`Sample ${i + 1}…`}
                  className="w-full resize-none rounded-lg border border-input bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring h-24"
                />
              </div>
            ))}
            {samples.length < 5 && (
              <button
                onClick={() => setSamples([...samples, ""])}
                className="text-xs font-medium text-primary hover:underline"
              >
                + Add another sample
              </button>
            )}
          </div>

          <button
            onClick={handleTrain}
            disabled={training}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl gradient-electric px-6 py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 glow-electric"
          >
            {training ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing your style…</>
            ) : (
              <>Train My Voice <Sparkles className="h-4 w-4" /></>
            )}
          </button>
        </div>
      )}

      {/* Voices list */}
      <div className="mt-6 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : voices.length === 0 && !showForm ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <Mic className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">No brand voices yet. Train your first one above.</p>
          </div>
        ) : (
          voices.map((v) => (
            <div key={v.id} className={`rounded-xl border p-5 ${v.is_active ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-foreground truncate">{v.name}</h3>
                    {v.is_active && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                        <Check className="h-3 w-3" /> Active
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground">{v.samples.length} samples</span>
                  </div>
                  {v.style_summary && (
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap">{v.style_summary}</p>
                  )}
                </div>
                <div className="flex flex-shrink-0 gap-2">
                  {v.is_active ? (
                    <button
                      onClick={() => handleActivate(null)}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      onClick={() => handleActivate(v.id)}
                      className="rounded-lg gradient-electric px-3 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90"
                    >
                      Activate
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(v.id)}
                    className="rounded-lg border border-border p-1.5 text-muted-foreground hover:border-destructive/40 hover:text-destructive"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
