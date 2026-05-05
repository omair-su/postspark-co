import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bookmark, Plus, Trash2, X, Loader2, Play } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { getTemplates, createTemplate, deleteTemplate } from "@/lib/templates.functions";

const allTypes = [
  { id: "tweets", label: "Tweets" },
  { id: "thread", label: "X Thread" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
  { id: "email", label: "Email" },
  { id: "video", label: "Video Script" },
  { id: "tiktok", label: "TikTok" },
  { id: "podcast", label: "Podcast" },
  { id: "seo", label: "SEO" },
];

const tones = ["professional", "casual", "humorous", "inspirational", "educational"];

interface Template {
  id: string;
  name: string;
  tone: string;
  custom_instructions: string;
  selected_types: string[];
  created_at: string;
}

export const Route = createFileRoute("/dashboard/templates")({
  component: TemplatesPage,
});

function TemplatesPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [tone, setTone] = useState("professional");
  const [customInstructions, setCustomInstructions] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set(["tweets", "linkedin"]));

  const loadTemplates = () => {
    if (!session) return;
    getTemplates({
      headers: { Authorization: `Bearer ${session.access_token}` },
    } as any)
      .then((res) => {
        setTemplates((res.templates as any) || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadTemplates();
  }, [session]);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Please enter a template name");
      return;
    }
    if (selectedTypes.size === 0) {
      toast.error("Select at least one format");
      return;
    }
    setSaving(true);
    const result = await createTemplate({
      data: {
        name: name.trim(),
        tone,
        customInstructions,
        selectedTypes: Array.from(selectedTypes),
      },
      headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
    } as any);
    setSaving(false);
    if ((result as any).success) {
      toast.success("Template saved!");
      setShowCreate(false);
      setName("");
      setTone("professional");
      setCustomInstructions("");
      setSelectedTypes(new Set(["tweets", "linkedin"]));
      loadTemplates();
    } else {
      toast.error("Failed to save template");
    }
  };

  const handleDelete = async (id: string) => {
    await deleteTemplate({
      data: { id },
      headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
    } as any);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    toast.success("Template deleted");
  };

  const handleApply = (t: Template) => {
    const params = new URLSearchParams({
      tone: t.tone,
      types: (t.selected_types as string[]).join(","),
    });
    if (t.custom_instructions) {
      params.set("instructions", t.custom_instructions);
    }
    navigate({ to: "/dashboard/repurpose", search: { tpl: params.toString() } as any });
    toast.success(`Template "${t.name}" applied!`);
  };

  const toggleType = (id: string) => {
    const next = new Set(selectedTypes);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedTypes(next);
  };

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Templates</h1>
          <p className="mt-1 text-sm text-muted-foreground">Save your favorite format & tone combinations.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-xl gradient-electric px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> New Template
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="mx-4 w-full max-w-md rounded-2xl border border-border bg-card p-6 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Create Template</h2>
              <button onClick={() => setShowCreate(false)}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-foreground">Template Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Casual Social Media"
                  maxLength={100}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground">Tone</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {tones.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                        tone === t ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground">Formats</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {allTypes.map((ct) => (
                    <button
                      key={ct.id}
                      onClick={() => toggleType(ct.id)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                        selectedTypes.has(ct.id) ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground"
                      }`}
                    >
                      {ct.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground">Custom Instructions (optional)</label>
                <input
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="e.g. Include emojis, write like Gary Vee"
                  maxLength={500}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <button
                onClick={handleCreate}
                disabled={saving}
                className="w-full rounded-xl gradient-electric px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50"
              >
                {saving ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Save Template"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Templates list */}
      {loading ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5">
              <div className="h-4 w-32 animate-pulse rounded bg-accent" />
              <div className="mt-2 h-3 w-48 animate-pulse rounded bg-accent" />
            </div>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="mt-8 rounded-xl border border-border bg-card p-10 text-center">
          <Bookmark className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">No templates yet. Create one to speed up your workflow!</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {templates.map((t) => (
            <div key={t.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{t.name}</h3>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary capitalize">
                      {t.tone}
                    </span>
                    {(t.selected_types as string[]).map((st) => (
                      <span key={st} className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-muted-foreground capitalize">
                        {st}
                      </span>
                    ))}
                  </div>
                  {t.custom_instructions && (
                    <p className="mt-1 text-[10px] text-muted-foreground italic">"{t.custom_instructions}"</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApply(t)}
                    className="flex items-center gap-1 rounded-lg gradient-electric px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-all hover:opacity-90"
                  >
                    <Play className="h-3 w-3" /> Apply
                  </button>
                  <button onClick={() => handleDelete(t.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
