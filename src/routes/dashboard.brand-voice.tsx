import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Mic, Loader2, Plus, Trash2, Check, Crown } from "lucide-react";
import {
  listBrandVoices,
  setActiveBrandVoice,
  deleteBrandVoice,
  updateBrandVoice,
  generateVoiceSamples,
} from "@/lib/brandVoice.functions";
import { ExtractionHub } from "@/components/brandvoice/ExtractionHub";
import { VoiceProfileCard } from "@/components/brandvoice/VoiceProfileCard";
import { ToneSliders, DEFAULT_TONE_SLIDERS, type ToneSliderValues } from "@/components/brandvoice/ToneSliders";
import { Guardrails, DEFAULT_GUARDRAILS, type GuardrailValues } from "@/components/brandvoice/Guardrails";
import { LiveTestBench } from "@/components/brandvoice/LiveTestBench";

interface Voice {
  id: string;
  name: string;
  style_summary: string | null;
  style_override: string | null;
  samples: string[];
  is_active: boolean;
  created_at: string;
  quality_score: number | null;
  tone_sliders: ToneSliderValues | null;
  dos: string[] | null;
  donts: string[] | null;
  emoji_density: GuardrailValues["emoji_density"] | null;
  sentence_length: GuardrailValues["sentence_length"] | null;
  cta_style: GuardrailValues["cta_style"] | null;
}

export const Route = createFileRoute("/dashboard/brand-voice")({
  component: BrandVoicePage,
});

function BrandVoicePage() {
  const { session } = useAuth();
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHub, setShowHub] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previews, setPreviews] = useState<{ tweet: string; linkedin: string; hook: string } | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  const authHeaders = session ? { Authorization: `Bearer ${session.access_token}` } : undefined;

  const refresh = async () => {
    if (!authHeaders) return;
    try {
      const { voices } = await listBrandVoices({ headers: authHeaders });
      const list = (voices as Voice[]) || [];
      setVoices(list);
      if (!selectedId && list.length) {
        const active = list.find((v) => v.is_active) || list[0];
        setSelectedId(active.id);
      }
    } catch {
      toast.error("Failed to load brand voices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [session]);

  const selected = voices.find((v) => v.id === selectedId) || null;
  const activeVoice = voices.find((v) => v.is_active) || null;

  const handleActivate = async (id: string | null) => {
    if (!authHeaders) return;
    try {
      await setActiveBrandVoice({ data: { id }, headers: authHeaders });
      toast.success(id ? "Voice activated" : "Voice deactivated");
      refresh();
    } catch { toast.error("Failed to update"); }
  };

  const handleDelete = async (id: string) => {
    if (!authHeaders) return;
    if (!confirm("Delete this brand voice?")) return;
    try {
      await deleteBrandVoice({ data: { id }, headers: authHeaders });
      toast.success("Deleted");
      if (selectedId === id) setSelectedId(null);
      refresh();
    } catch { toast.error("Failed to delete"); }
  };

  const patchSelected = async (patch: Record<string, unknown>) => {
    if (!authHeaders || !selected) return;
    try {
      const res = await updateBrandVoice({
        data: { id: selected.id, ...(patch as any) },
        headers: authHeaders,
      });
      if (!res.success) return toast.error(res.error || "Save failed");
      // Optimistic local merge
      setVoices((prev) => prev.map((v) => v.id === selected.id ? { ...v, ...(patch as any) } as Voice : v));
    } catch { toast.error("Save failed"); }
  };

  const regenPreviews = async () => {
    if (!authHeaders || !selected) return;
    setRegenerating(true);
    try {
      const res = await generateVoiceSamples({ data: { voiceId: selected.id }, headers: authHeaders });
      if (res.success && res.previews) setPreviews(res.previews);
      else toast.error(res.error || "Failed to generate previews");
    } finally { setRegenerating(false); }
  };

  const tone = (selected?.tone_sliders as ToneSliderValues | null) || DEFAULT_TONE_SLIDERS;
  const guardrails: GuardrailValues = {
    dos: Array.isArray(selected?.dos) ? (selected!.dos as string[]) : DEFAULT_GUARDRAILS.dos,
    donts: Array.isArray(selected?.donts) ? (selected!.donts as string[]) : DEFAULT_GUARDRAILS.donts,
    emoji_density: (selected?.emoji_density as GuardrailValues["emoji_density"]) || DEFAULT_GUARDRAILS.emoji_density,
    sentence_length: (selected?.sentence_length as GuardrailValues["sentence_length"]) || DEFAULT_GUARDRAILS.sentence_length,
    cta_style: (selected?.cta_style as GuardrailValues["cta_style"]) || DEFAULT_GUARDRAILS.cta_style,
  };

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white">Brand Voice</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-300 border border-violet-500/30">
              <Crown className="h-3 w-3" /> Pro
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Train, tune, and test how PostSpark writes for you. Every generation with an active voice follows these rules.
          </p>
        </div>
        {!showHub && (
          <button
            onClick={() => setShowHub(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-bold text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> New voice
          </button>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Main column */}
        <div className="space-y-6 min-w-0">
          {showHub && (
            <ExtractionHub
              onCreated={() => { setShowHub(false); refresh(); }}
              onClose={() => setShowHub(false)}
            />
          )}

          {/* Voice picker */}
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : voices.length === 0 && !showHub ? (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
              <Mic className="mx-auto h-8 w-8 text-slate-600" />
              <p className="mt-3 text-sm text-slate-400">No brand voices yet. Create your first one.</p>
              <button
                onClick={() => setShowHub(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-bold text-white hover:opacity-90"
              >
                <Plus className="h-4 w-4" /> Create voice
              </button>
            </div>
          ) : voices.length > 0 && (
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-3 backdrop-blur-xl">
              <div className="flex flex-wrap gap-2">
                {voices.map((v) => {
                  const active = v.id === selectedId;
                  return (
                    <div key={v.id} className={`group flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs transition ${active ? "border-violet-500/60 bg-violet-500/10" : "border-slate-800 bg-slate-950/40 hover:border-violet-500/30"}`}>
                      <button onClick={() => { setSelectedId(v.id); setPreviews(null); }} className="font-semibold text-slate-100">
                        {v.name}
                      </button>
                      {v.is_active && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300">
                          <Check className="h-2.5 w-2.5" /> Active
                        </span>
                      )}
                      <button
                        onClick={() => handleDelete(v.id)}
                        className="ml-1 rounded p-0.5 text-slate-500 opacity-0 hover:text-red-400 group-hover:opacity-100"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
              {selected && (
                <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-3">
                  <span className="text-[11px] text-slate-500">
                    {selected.samples.length} samples · created {new Date(selected.created_at).toLocaleDateString()}
                  </span>
                  {selected.is_active ? (
                    <button
                      onClick={() => handleActivate(null)}
                      className="rounded-lg border border-slate-800 px-3 py-1 text-[11px] font-semibold text-slate-300 hover:text-white"
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      onClick={() => handleActivate(selected.id)}
                      className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1 text-[11px] font-bold text-white hover:opacity-90"
                    >
                      Set as active
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {selected && (
            <>
              <VoiceProfileCard
                summary={selected.style_summary}
                override={selected.style_override}
                qualityScore={selected.quality_score}
                onSave={async (override) => { await patchSelected({ style_override: override }); }}
                onRegenerateSamples={regenPreviews}
                regenerating={regenerating}
                previews={previews}
              />

              <ToneSliders
                value={tone}
                onChange={(next) => patchSelected({ tone_sliders: next })}
              />

              <Guardrails
                value={guardrails}
                onChange={(next) => patchSelected({
                  dos: next.dos,
                  donts: next.donts,
                  emoji_density: next.emoji_density,
                  sentence_length: next.sentence_length,
                  cta_style: next.cta_style,
                })}
              />
            </>
          )}
        </div>

        {/* Sticky right — Live Test Bench */}
        <div className="lg:block">
          <LiveTestBench activeVoiceId={activeVoice?.id ?? null} />
        </div>
      </div>
    </div>
  );
}
