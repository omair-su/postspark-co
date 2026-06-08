import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { GuidedStudioShell } from "@/components/guided/GuidedStudioShell";
import { StudioField, StudioInput, StudioTextarea, ChipGroup, CardGroup, WillGenerateBox, GenerateButton } from "@/components/guided/StudioFields";
import { OutputPanel } from "@/components/guided/OutputPanel";
import { generateCreatorPlaybookFn } from "@/lib/guidedStudios.functions";

export const Route = createFileRoute("/dashboard/guided/creator-playbook")({
  component: CreatorPlaybookStudio,
});

const FORMATS = [
  { value: "step-by-step", label: "Step-by-Step", emoji: "📋", desc: '"How to X" framework' },
  { value: "myth-reality", label: "Myth vs Reality", emoji: "⚡", desc: '"Everyone says X, but…"' },
  { value: "before-after", label: "Before → After", emoji: "🔄", desc: '"From X to Y in Z steps"' },
  { value: "framework", label: "Framework Reveal", emoji: "📊", desc: '"The X Model"' },
  { value: "checklist", label: "Checklist & Audit", emoji: "🎯", desc: '"10 things to check"' },
  { value: "secrets", label: "Secrets Revealed", emoji: "🔑", desc: '"What X won\'t tell you"' },
] as const;

const NICHES = [
  "Marketing", "SaaS", "E-commerce", "Coaching", "Personal Finance",
  "Fitness", "Real Estate", "Education", "Productivity", "Career", "Other",
];

const PLATFORMS = [
  { value: "carousel", label: "LinkedIn Carousel (10 slides)" },
  { value: "ig-carousel", label: "Instagram Carousel (8 slides)" },
  { value: "thread", label: "Twitter/X Thread" },
  { value: "linkedin", label: "LinkedIn Post" },
  { value: "instagram", label: "Instagram Captions" },
  { value: "newsletter", label: "Newsletter Section" },
] as const;

function CreatorPlaybookStudio() {
  const { session } = useAuth();
  const [form, setForm] = useState({
    format: "step-by-step", topic: "", niche: "Marketing", steps: "", example: "",
    platforms: ["carousel", "thread"] as string[],
  });
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!session) return;
    if (!form.topic.trim() || !form.steps.trim()) return toast.error("Topic and steps are required.");
    if (form.platforms.length === 0) return toast.error("Pick at least one output format.");
    setLoading(true);
    const r = await generateCreatorPlaybookFn({ data: form, headers: { Authorization: `Bearer ${session.access_token}` } });
    setLoading(false);
    if (r.error) return toast.error(r.error === "LIMIT_REACHED" ? "Monthly limit reached. Upgrade to continue." : r.error);
    setOutput(r.output);
  };

  return (
    <GuidedStudioShell
      emoji="✍️" title="Creator Playbook Studio"
      subtitle="Turn your knowledge into shareable content that grows your brand."
      accentFrom="#f59e0b" accentTo="#fbbf24"
    >
      {!output ? (
        <div className="space-y-5">
          <div className="space-y-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
            <StudioField label="Playbook format" required help="This completely changes the output.">
              <CardGroup options={FORMATS as any} value={form.format} onChange={(v: string) => setForm({ ...form, format: v })} />
            </StudioField>

            <StudioField label="What's the playbook about?" required>
              <StudioInput value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })}
                placeholder='e.g. "How to write LinkedIn hooks that get 10k+ impressions"' />
            </StudioField>

            <StudioField label="Your niche / industry" required>
              <select value={form.niche} onChange={e => setForm({ ...form, niche: e.target.value })}
                className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/15">
                {NICHES.map(n => <option key={n}>{n}</option>)}
              </select>
            </StudioField>

            <StudioField label="The steps or tips (one per line)" required>
              <StudioTextarea value={form.steps} onChange={e => setForm({ ...form, steps: e.target.value })}
                rows={6} placeholder={"1. Open with a question\n2. Use specific numbers\n3. End with a CTA"} maxChars={3000} />
            </StudioField>

            <StudioField label="A real example or proof" optional>
              <StudioTextarea value={form.example} onChange={e => setForm({ ...form, example: e.target.value })}
                rows={2} placeholder='e.g. "I used this to go from 500 to 15k followers in 90 days"' maxChars={500} />
            </StudioField>

            <StudioField label="Output formats" required>
              <ChipGroup multi options={PLATFORMS as any} value={form.platforms as any}
                onChange={(v: string[]) => setForm({ ...form, platforms: v })} />
            </StudioField>

            <WillGenerateBox items={form.platforms.map(p => PLATFORMS.find(x => x.value === p)?.label || p)} />
          </div>

          <GenerateButton onClick={generate} loading={loading}>
            ✦ Generate Creator Playbook <ArrowRight className="h-4 w-4" />
          </GenerateButton>
        </div>
      ) : (
        <div className="space-y-4">
          <OutputPanel output={output} type="creator_playbook" title={form.topic}
            onRegenerate={async () => { await generate(); }} regenerating={loading} />
          <button onClick={() => setOutput("")} className="text-sm font-medium text-primary hover:underline">← Start over</button>
        </div>
      )}
    </GuidedStudioShell>
  );
}
