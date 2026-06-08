import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { GuidedStudioShell } from "@/components/guided/GuidedStudioShell";
import { StudioField, StudioInput, StudioTextarea, ChipGroup, WillGenerateBox, GenerateButton } from "@/components/guided/StudioFields";
import { OutputPanel } from "@/components/guided/OutputPanel";
import { generateMarketingTipFn } from "@/lib/guidedStudios.functions";

export const Route = createFileRoute("/dashboard/guided/marketing-tip")({
  component: MarketingTipStudio,
});

const CHANNELS = [
  { value: "email", label: "Email" }, { value: "seo", label: "SEO / Content" },
  { value: "ads", label: "Paid Ads" }, { value: "social", label: "Social Media" },
  { value: "sales", label: "Sales" }, { value: "product", label: "Product" },
  { value: "cro", label: "CRO" }, { value: "community", label: "Community" },
  { value: "influencer", label: "Influencer" }, { value: "pr", label: "PR" },
];
const ANGLES = [
  { value: "educational", label: 'Educational "How-to"' },
  { value: "contrarian", label: 'Contrarian "Everyone does X wrong"' },
  { value: "data", label: 'Data-driven "Study shows…"' },
  { value: "story", label: 'Story "I tried this and…"' },
  { value: "warning", label: 'Warning "Stop doing X"' },
];
const PLATFORMS = [
  { value: "linkedin", label: "LinkedIn Post" }, { value: "thread", label: "Twitter Thread" },
  { value: "newsletter", label: "Newsletter Snippet" }, { value: "ig_carousel", label: "Instagram Carousel" },
  { value: "video", label: "Video Script (60s)" }, { value: "cold_email", label: "Cold Email" },
];
const AUDIENCES = ["SaaS founders", "E-com brands", "Coaches", "Agencies", "Enterprise marketers", "Freelancers", "Other"];

function MarketingTipStudio() {
  const { session } = useAuth();
  const [form, setForm] = useState({
    channel: "email", insight: "", stat: "", why: "", howTo: "", audience: "SaaS founders",
    angle: "educational", platforms: ["linkedin", "thread", "newsletter"] as string[],
    weekPlan: false,
  });
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!session) return;
    if (!form.insight.trim() || !form.why.trim() || !form.howTo.trim()) {
      return toast.error("Insight, why, and how-to are required.");
    }
    if (form.platforms.length === 0) return toast.error("Pick at least one platform.");
    setLoading(true);
    const r = await generateMarketingTipFn({ data: form, headers: { Authorization: `Bearer ${session.access_token}` } });
    setLoading(false);
    if (r.error) return toast.error(r.error === "LIMIT_REACHED" ? "Monthly limit reached. Upgrade to continue." : r.error);
    setOutput(r.output);
  };

  return (
    <GuidedStudioShell
      emoji="📊" title="Marketing Insight Engine"
      subtitle="Turn one insight into a week of authority content."
      accentFrom="#059669" accentTo="#10b981"
    >
      {!output ? (
        <div className="space-y-5">
          <div className="space-y-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
            <StudioField label="Marketing channel this insight applies to" required>
              <ChipGroup options={CHANNELS as any} value={form.channel} onChange={(v: string) => setForm({ ...form, channel: v })} />
            </StudioField>

            <StudioField label="The insight or tactic" required>
              <StudioInput value={form.insight} onChange={e => setForm({ ...form, insight: e.target.value })}
                placeholder='e.g. "Email open rates jump 40% when you personalize the subject line"' />
            </StudioField>

            <StudioField label="Have a stat or data point?" optional help="Adds credibility — cite the source.">
              <StudioInput value={form.stat} onChange={e => setForm({ ...form, stat: e.target.value })}
                placeholder='e.g. "Mailchimp 2024 study, n=5M campaigns"' />
            </StudioField>

            <StudioField label="Why it works" required>
              <StudioTextarea value={form.why} onChange={e => setForm({ ...form, why: e.target.value })}
                rows={3} placeholder="The psychological / mechanical reason." maxChars={1000} />
            </StudioField>

            <StudioField label="How to apply it" required>
              <StudioTextarea value={form.howTo} onChange={e => setForm({ ...form, howTo: e.target.value })}
                rows={3} placeholder="Concrete steps — what to do TODAY." maxChars={1000} />
            </StudioField>

            <div className="grid gap-4 sm:grid-cols-2">
              <StudioField label="Your audience" required>
                <select value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })}
                  className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/15">
                  {AUDIENCES.map(a => <option key={a}>{a}</option>)}
                </select>
              </StudioField>
              <StudioField label="Content angle">
                <select value={form.angle} onChange={e => setForm({ ...form, angle: e.target.value })}
                  className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/15">
                  {ANGLES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </StudioField>
            </div>

            <StudioField label="Output formats" required>
              <ChipGroup multi options={PLATFORMS as any} value={form.platforms as any}
                onChange={(v: string[]) => setForm({ ...form, platforms: v })} />
            </StudioField>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/20 p-3">
              <input type="checkbox" checked={form.weekPlan} onChange={e => setForm({ ...form, weekPlan: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">🌟 7-Day Content Plan (bonus)</p>
                <p className="text-[12px] text-muted-foreground">Turn this insight into a Mon–Sun content calendar.</p>
              </div>
            </label>

            <WillGenerateBox items={[
              ...form.platforms.map(p => PLATFORMS.find(x => x.value === p)?.label || p),
              ...(form.weekPlan ? ["7-day content plan (Mon→Sun)"] : []),
            ]} />
          </div>

          <GenerateButton onClick={generate} loading={loading}>
            ✦ Generate Marketing Content <ArrowRight className="h-4 w-4" />
          </GenerateButton>
        </div>
      ) : (
        <div className="space-y-4">
          <OutputPanel output={output} type="marketing_tip" title={form.insight}
            onRegenerate={async () => { await generate(); }} regenerating={loading} />
          <button onClick={() => setOutput("")} className="text-sm font-medium text-primary hover:underline">← Start over</button>
        </div>
      )}
    </GuidedStudioShell>
  );
}
