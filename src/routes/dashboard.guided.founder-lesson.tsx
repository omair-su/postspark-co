import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { GuidedStudioShell } from "@/components/guided/GuidedStudioShell";
import { StudioField, StudioInput, StudioTextarea, ChipGroup, WillGenerateBox, GenerateButton } from "@/components/guided/StudioFields";
import { OutputPanel } from "@/components/guided/OutputPanel";
import { generateFounderHooksFn, generateFounderLessonFn } from "@/lib/guidedStudios.functions";

export const Route = createFileRoute("/dashboard/guided/founder-lesson")({
  component: FounderLessonStudio,
});

const LESSON_TYPES = [
  { value: "failure", label: "Failure & Recovery", emoji: "🔥" },
  { value: "win", label: "Win & How-To", emoji: "🏆" },
  { value: "contrarian", label: "Contrarian Take", emoji: "⚡" },
  { value: "data", label: "Data Insight", emoji: "📊" },
  { value: "mindset", label: "Mindset Shift", emoji: "💡" },
  { value: "process", label: "Process Reveal", emoji: "🛠" },
] as const;
const PLATFORMS = [
  { value: "linkedin", label: "LinkedIn Post" }, { value: "thread", label: "Twitter/X Thread" },
  { value: "email", label: "Email Newsletter" }, { value: "instagram", label: "Instagram" },
  { value: "video", label: "Short Video" },
] as const;
const TONES = [
  { value: "authentic", label: "Authentic / Raw" }, { value: "professional", label: "Professional" },
  { value: "bold", label: "Bold / Provocative" }, { value: "storytelling", label: "Storytelling" },
  { value: "data-driven", label: "Data-Driven" },
] as const;

function FounderLessonStudio() {
  const { session } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState({
    lesson: "", story: "", takeaway: "", audience: "", lessonType: "failure",
  });
  const [opts, setOpts] = useState({
    platforms: ["linkedin", "thread"] as string[],
    tone: "authentic", length: "medium", hookStyle: "question",
  });
  const [hooks, setHooks] = useState<{ text: string; style: string; score: number; rationale: string }[]>([]);
  const [hooksLoading, setHooksLoading] = useState(false);
  const [selectedHook, setSelectedHook] = useState<string>("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const validateStep1 = () => {
    if (!form.lesson.trim() || !form.story.trim() || !form.takeaway.trim()) {
      toast.error("Please fill the lesson, story, and takeaway.");
      return false;
    }
    return true;
  };

  const goStep2 = async () => {
    if (!validateStep1() || !session) return;
    setStep(2);
    setHooksLoading(true);
    const r = await generateFounderHooksFn({
      data: { lesson: form.lesson, story: form.story, audience: form.audience, lessonType: form.lessonType, hookStyle: opts.hookStyle },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    setHooksLoading(false);
    if (r.error) return toast.error(r.error);
    setHooks(r.hooks);
  };

  const generate = async () => {
    if (!session) return;
    if (opts.platforms.length === 0) return toast.error("Pick at least one platform.");
    setLoading(true);
    const r = await generateFounderLessonFn({
      data: { ...form, ...opts, selectedHook: selectedHook || undefined },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    setLoading(false);
    if (r.error) return toast.error(r.error === "LIMIT_REACHED" ? "Monthly limit reached. Upgrade to continue." : r.error);
    setOutput(r.output); setStep(3);
  };

  return (
    <GuidedStudioShell
      emoji="🚀" title="Founder Lesson Engine"
      subtitle="Turn your experience into authority content that builds trust."
      accentFrom="#7c3aed" accentTo="#8b6fff"
      steps={[
        { label: "Your Story", done: step > 1, active: step === 1 },
        { label: "Customize", done: step > 2, active: step === 2 },
        { label: "Generate", done: false, active: step === 3 },
      ]}
    >
      {step === 1 && (
        <div className="space-y-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <StudioField label="What's the lesson?" required>
            <StudioInput value={form.lesson} onChange={e => setForm({ ...form, lesson: e.target.value })}
              placeholder='e.g. "Hiring slow saved my startup from a $200k mistake"' maxLength={200} />
          </StudioField>

          <StudioField label="Lesson Type" required help="Helps the AI frame the story correctly.">
            <ChipGroup options={LESSON_TYPES as any} value={form.lessonType} onChange={(v: string) => setForm({ ...form, lessonType: v })} />
          </StudioField>

          <StudioField label="Quick story or context" required help="What happened, when, what you tried.">
            <StudioTextarea value={form.story} onChange={e => setForm({ ...form, story: e.target.value })}
              placeholder="Tell the story specifically — names, numbers, what felt off…" rows={5} maxChars={1500} />
          </StudioField>

          <StudioField label="Practical takeaway" required help="What should readers do differently?">
            <StudioTextarea value={form.takeaway} onChange={e => setForm({ ...form, takeaway: e.target.value })}
              placeholder="The one thing they should remember." rows={3} maxChars={500} />
          </StudioField>

          <StudioField label="Who is this for?" optional>
            <StudioInput value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })}
              placeholder="e.g. early-stage SaaS founders" />
          </StudioField>

          <div className="flex justify-end">
            <button onClick={goStep2} className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-semibold text-background hover:opacity-90">
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div className="space-y-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
            <StudioField label="Choose your platforms" required>
              <ChipGroup multi options={PLATFORMS as any} value={opts.platforms as any} onChange={(v: string[]) => setOpts({ ...opts, platforms: v })} />
            </StudioField>

            <StudioField label="Writing tone">
              <ChipGroup options={TONES as any} value={opts.tone} onChange={(v: string) => setOpts({ ...opts, tone: v })} />
            </StudioField>

            <StudioField label="Content length">
              <ChipGroup
                options={[{ value: "short", label: "Short (punchy)" }, { value: "medium", label: "Medium" }, { value: "long", label: "Long (deep-dive)" }] as any}
                value={opts.length} onChange={(v: string) => setOpts({ ...opts, length: v })} />
            </StudioField>

            <StudioField label="Hook style" help="AI generated 3 hooks below — pick the one you love most.">
              <ChipGroup
                options={[
                  { value: "question", label: "Question hook" }, { value: "stat", label: "Stat hook" },
                  { value: "bold", label: "Bold statement" }, { value: "story", label: "Story opener" },
                  { value: "contrarian", label: "Contrarian" },
                ] as any}
                value={opts.hookStyle} onChange={(v: string) => setOpts({ ...opts, hookStyle: v })} />
            </StudioField>

            <div>
              <p className="mb-2 text-[13px] font-semibold text-foreground">Hooks</p>
              {hooksLoading ? (
                <div className="rounded-xl bg-muted/30 p-6 text-center text-sm text-muted-foreground">Generating hooks…</div>
              ) : (
                <div className="space-y-2">
                  {hooks.map((h, i) => (
                    <button key={i} onClick={() => setSelectedHook(selectedHook === h.text ? "" : h.text)}
                      className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                        selectedHook === h.text ? "border-primary bg-primary/5 ring-2 ring-primary/10" : "border-border hover:border-primary/40"
                      }`}>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">"{h.text}"</p>
                        <p className="mt-1 text-[11px] text-muted-foreground"><span className="font-semibold uppercase">{h.style}</span> · {h.rationale}</p>
                      </div>
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-700">{h.score.toFixed(1)}/10</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <WillGenerateBox items={[
              "3 scored hook options (above)",
              ...opts.platforms.map(p => PLATFORMS.find(x => x.value === p)?.label || p),
              "Tone calibrated to your Brand Voice if Pro",
            ]} />
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <div className="flex-1 max-w-xs">
              <GenerateButton onClick={generate} loading={loading}>
                ✦ Generate Founder Lesson <ArrowRight className="h-4 w-4" />
              </GenerateButton>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <OutputPanel output={output} type="founder_lesson" title={form.lesson} onRegenerate={async () => {
            toast.info("Regenerating with a fresh angle…"); await generate();
          }} regenerating={loading} />
          <button onClick={() => setStep(1)} className="text-sm font-medium text-primary hover:underline">← Start over</button>
        </div>
      )}
    </GuidedStudioShell>
  );
}
