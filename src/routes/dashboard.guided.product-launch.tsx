import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { GuidedStudioShell } from "@/components/guided/GuidedStudioShell";
import { StudioField, StudioInput, StudioTextarea, ChipGroup, CardGroup, WillGenerateBox, GenerateButton } from "@/components/guided/StudioFields";
import { OutputPanel } from "@/components/guided/OutputPanel";
import { generateProductLaunchFn } from "@/lib/guidedStudios.functions";

export const Route = createFileRoute("/dashboard/guided/product-launch")({
  component: ProductLaunchStudio,
});

const TYPES = [
  { value: "physical", label: "Physical / Shopify", emoji: "🛍", desc: "DTC, Amazon, retail" },
  { value: "saas", label: "SaaS / App", emoji: "💻", desc: "Startup or feature launch" },
  { value: "digital", label: "Digital Product", emoji: "📚", desc: "Course, ebook, template" },
  { value: "service", label: "Service / Agency", emoji: "🎯", desc: "Freelancer, consultant" },
  { value: "subscription", label: "Subscription", emoji: "📦", desc: "Membership, newsletter" },
] as const;

const PLATFORM_GROUPS = [
  {
    label: "Product Page",
    items: [
      { value: "shopify", label: "Shopify Description" },
      { value: "amazon", label: "Amazon Listing" },
    ],
  },
  {
    label: "Paid Ads",
    items: [
      { value: "facebook_ad", label: "Facebook/Instagram Ad" },
      { value: "tiktok_ad", label: "TikTok Ad Script" },
      { value: "google_ad", label: "Google Search Ad" },
    ],
  },
  {
    label: "Organic Social",
    items: [
      { value: "instagram_post", label: "Instagram Post" },
      { value: "tiktok_post", label: "TikTok Post" },
      { value: "facebook_post", label: "Facebook Post" },
      { value: "linkedin_post", label: "LinkedIn Post" },
      { value: "twitter", label: "Twitter Thread" },
      { value: "pinterest", label: "Pinterest Pins" },
      { value: "product_hunt", label: "Product Hunt" },
    ],
  },
  {
    label: "Email",
    items: [
      { value: "email_announce", label: "Launch Email" },
      { value: "email_sequence", label: "3-Email Sequence" },
      { value: "abandoned_cart", label: "Abandoned Cart" },
    ],
  },
];

const TONES = [
  { value: "bold", label: "Bold / Direct" }, { value: "premium", label: "Premium / Luxury" },
  { value: "casual", label: "Casual / Fun" }, { value: "empathetic", label: "Empathetic" },
  { value: "professional", label: "Professional" },
] as const;

const PRICE_TIERS = ["Budget (<$30)", "Mid-range ($30-$100)", "Premium ($100+)", "Luxury ($500+)"];

function ProductLaunchStudio() {
  const { session } = useAuth();
  const [form, setForm] = useState({
    productType: "physical", name: "", category: "", productUrl: "",
    whatItDoes: "", benefits: "", audience: "", painPoint: "",
    price: "", priceTier: "", socialProof: "", urgency: "",
    tone: "bold", platforms: ["shopify", "facebook_ad", "instagram_post", "email_announce"] as string[],
  });
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!session) return;
    if (!form.name.trim() || !form.whatItDoes.trim() || !form.benefits.trim() || !form.audience.trim()) {
      return toast.error("Name, what-it-does, benefits, audience are required.");
    }
    if (form.platforms.length === 0) return toast.error("Pick at least one output.");
    setLoading(true);
    const r = await generateProductLaunchFn({ data: form, headers: { Authorization: `Bearer ${session.access_token}` } });
    setLoading(false);
    if (r.error) return toast.error(r.error === "LIMIT_REACHED" ? "Monthly limit reached. Upgrade to continue." : r.error);
    setOutput(r.output);
  };

  return (
    <GuidedStudioShell
      emoji="🚀" title="Product Launch Command Center"
      subtitle="Launch-ready copy for every platform — in one generation."
      accentFrom="#ec4899" accentTo="#f472b6"
    >
      {!output ? (
        <div className="space-y-5">
          <div className="space-y-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
            <StudioField label="What type of product are you launching?" required>
              <CardGroup options={TYPES as any} value={form.productType} onChange={(v: string) => setForm({ ...form, productType: v })} />
            </StudioField>

            <div className="grid gap-4 sm:grid-cols-2">
              <StudioField label="Product name" required>
                <StudioInput value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder='e.g. "ProLift Massage Gun"' />
              </StudioField>
              <StudioField label="Category" optional>
                <StudioInput value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  placeholder="Health & Wellness, Beauty, SaaS, …" />
              </StudioField>
            </div>

            <StudioField label="Reference URL (Shopify, App Store, AliExpress…)" optional>
              <StudioInput value={form.productUrl} onChange={e => setForm({ ...form, productUrl: e.target.value })} placeholder="https://…" />
            </StudioField>

            <StudioField label="What does it do? (1-2 sentences)" required>
              <StudioTextarea value={form.whatItDoes} onChange={e => setForm({ ...form, whatItDoes: e.target.value })}
                rows={2} placeholder="The core promise in plain words." maxChars={500} />
            </StudioField>

            <StudioField label="Key benefits (one per line)" required>
              <StudioTextarea value={form.benefits} onChange={e => setForm({ ...form, benefits: e.target.value })}
                rows={4} placeholder={"- Relieves muscle pain in minutes\n- 6 attachments included\n- 8-hour battery"} maxChars={1500} />
            </StudioField>

            <div className="grid gap-4 sm:grid-cols-2">
              <StudioField label="Target customer" required>
                <StudioInput value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })}
                  placeholder='e.g. "busy moms aged 28-45 with back pain"' />
              </StudioField>
              <StudioField label="Customer's #1 pain point" optional help="Makes copy convert.">
                <StudioInput value={form.painPoint} onChange={e => setForm({ ...form, painPoint: e.target.value })}
                  placeholder="What frustrates them about alternatives?" />
              </StudioField>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <StudioField label="Price" optional>
                <StudioInput value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="$49" />
              </StudioField>
              <StudioField label="Tier" optional>
                <select value={form.priceTier} onChange={e => setForm({ ...form, priceTier: e.target.value })}
                  className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/15">
                  <option value="">—</option>
                  {PRICE_TIERS.map(t => <option key={t}>{t}</option>)}
                </select>
              </StudioField>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <StudioField label="Social proof" optional>
                <StudioInput value={form.socialProof} onChange={e => setForm({ ...form, socialProof: e.target.value })}
                  placeholder='"4.8 stars, 2,400 reviews"' />
              </StudioField>
              <StudioField label="Urgency / scarcity" optional>
                <StudioInput value={form.urgency} onChange={e => setForm({ ...form, urgency: e.target.value })}
                  placeholder='"Limited stock", "Sale ends Friday"' />
              </StudioField>
            </div>

            <StudioField label="Brand voice / tone" required>
              <ChipGroup options={TONES as any} value={form.tone} onChange={(v: string) => setForm({ ...form, tone: v })} />
            </StudioField>

            <div>
              <p className="mb-2 text-[13px] font-semibold text-foreground">Choose your outputs *</p>
              <div className="space-y-3">
                {PLATFORM_GROUPS.map(g => (
                  <div key={g.label}>
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{g.label}</p>
                    <ChipGroup multi options={g.items as any} value={form.platforms as any}
                      onChange={(v: string[]) => setForm({ ...form, platforms: v })} />
                  </div>
                ))}
              </div>
            </div>

            <WillGenerateBox items={[
              `${form.platforms.length} output formats`,
              `Estimated generation time: ~${Math.max(10, form.platforms.length * 3)} seconds`,
            ]} />
          </div>

          <GenerateButton onClick={generate} loading={loading}>
            ✦ Generate All Launch Content <ArrowRight className="h-4 w-4" />
          </GenerateButton>
        </div>
      ) : (
        <div className="space-y-4">
          <OutputPanel output={output} type="product_launch" title={form.name}
            onRegenerate={async () => { await generate(); }} regenerating={loading} />
          <button onClick={() => setOutput("")} className="text-sm font-medium text-primary hover:underline">← Start over</button>
        </div>
      )}
    </GuidedStudioShell>
  );
}
