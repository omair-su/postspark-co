import { useEffect, useState } from "react";
import { Sparkles, Pencil, Save, X, Loader2, RotateCcw } from "lucide-react";

interface Props {
  summary: string | null;
  override: string | null;
  qualityScore: number | null;
  onSave: (override: string | null) => Promise<void>;
  onRegenerateSamples?: () => void;
  regenerating?: boolean;
  previews?: { tweet: string; linkedin: string; hook: string } | null;
}

export function VoiceProfileCard({
  summary,
  override,
  qualityScore,
  onSave,
  onRegenerateSamples,
  regenerating,
  previews,
}: Props) {
  const displayed = override || summary || "";
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(displayed);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(displayed);
  }, [displayed]);

  const save = async () => {
    setSaving(true);
    try {
      await onSave(draft.trim() === (summary || "").trim() ? null : draft.trim());
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-white">Voice profile</h3>
          {override && (
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-300">
              Edited
            </span>
          )}
          {typeof qualityScore === "number" && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                qualityScore >= 80
                  ? "bg-emerald-500/15 text-emerald-300"
                  : qualityScore >= 50
                    ? "bg-amber-500/15 text-amber-300"
                    : "bg-red-500/15 text-red-300"
              }`}
            >
              Quality {qualityScore}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {onRegenerateSamples && !editing && (
            <button
              type="button"
              onClick={onRegenerateSamples}
              disabled={regenerating}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-800 px-2 py-1 text-[11px] font-medium text-slate-300 hover:border-violet-500/40 hover:text-white disabled:opacity-50"
            >
              {regenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
              Preview
            </button>
          )}
          {!editing ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-800 px-2 py-1 text-[11px] font-medium text-slate-300 hover:border-violet-500/40 hover:text-white"
            >
              <Pencil className="h-3 w-3" /> Edit
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => { setDraft(displayed); setEditing(false); }}
                className="rounded-lg border border-slate-800 p-1 text-slate-400 hover:text-white"
                aria-label="Cancel"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-2 py-1 text-[11px] font-bold text-white hover:opacity-90 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save
              </button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={12}
          className="w-full resize-y rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs leading-relaxed text-slate-200 outline-none focus:border-violet-500"
        />
      ) : displayed ? (
        <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-300">{displayed}</p>
      ) : (
        <p className="text-xs italic text-slate-500">No profile yet. Train the voice below.</p>
      )}

      {previews && !editing && (
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          {[
            { k: "Tweet", v: previews.tweet },
            { k: "LinkedIn", v: previews.linkedin },
            { k: "Video hook", v: previews.hook },
          ].map((p) => (
            <div key={p.k} className="rounded-lg border border-slate-800/70 bg-slate-950/40 p-3">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-violet-400">
                {p.k}
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300 line-clamp-6">{p.v}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
