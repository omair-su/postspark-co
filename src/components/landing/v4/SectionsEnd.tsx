import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, ChevronDown, ArrowRight } from "lucide-react";
import { BoltMark, SOCIALS, SocialCircle, Wordmark, delay } from "./parts";

type Plan = {
  name: string;
  monthly: number;
  annual: number;
  desc: string;
  features: string[];
  cta: string;
  featured?: boolean;
  outline?: boolean;
};

const PLANS: Plan[] = [
  {
    name: "Free",
    monthly: 0,
    annual: 0,
    desc: "Perfect for exploring PostSpark and testing your first repurposes.",
    features: [
      "10 generations per month",
      "3 Studios access",
      "1 Brand profile",
      "Spark AI Copilot (limited)",
      "Community support",
    ],
    cta: "Get Started Free",
  },
  {
    name: "Pro",
    monthly: 29,
    annual: 23,
    desc: "For creators and founders serious about content output and growth.",
    features: [
      "Unlimited generations",
      "All 9 Studios",
      "Brand Kit + Brand Voice",
      "All 7 publishing platforms",
      "Spark AI Copilot (unlimited)",
      "Image Studio (3 AI models)",
      "Content Calendar",
      "Analytics Dashboard",
      "Priority support",
    ],
    cta: "Start 7-Day Free Trial →",
    featured: true,
  },
  {
    name: "Agency",
    monthly: 79,
    annual: 63,
    desc: "For agencies and teams managing multiple brands and clients.",
    features: [
      "Everything in Pro",
      "5 team member seats",
      "Multi-brand workspaces",
      "Agency Analytics dashboard",
      "Client workspace management",
      "Priority onboarding call",
      "White-label output options",
    ],
    cta: "Start Agency Trial",
    outline: true,
  },
];

export function Lp4Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="scroll-mt-20 bg-white px-6 py-16 sm:py-[100px]">
      <div className="mx-auto max-w-[1100px]">
        <div className="text-center">
          <p className="lp4-label fade-in-up">Pricing</p>
          <h2
            className="fade-in-up mt-3"
            style={{ fontSize: "clamp(34px,5vw,48px)", fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.02em", ...delay(100) }}
          >
            Simple Pricing.
            <br />
            <span className="lp4-grad-text">Serious Power.</span>
          </h2>
          <p className="fade-in-up mx-auto mt-4 max-w-[600px]" style={{ fontSize: 18, color: "#6B7280", ...delay(150) }}>
            Start free. Upgrade when you're ready. No credit card needed. Cancel anytime.
          </p>

          <div className="fade-in-up mt-8 flex items-center justify-center gap-3" style={delay(200)}>
            <span style={{ fontSize: 14, fontWeight: 500, color: annual ? "#6B7280" : "#0F0F1A" }}>Monthly</span>
            <button
              type="button"
              role="switch"
              aria-checked={annual}
              aria-label="Toggle annual billing"
              onClick={() => setAnnual((v) => !v)}
              className="relative shrink-0 rounded-full transition-colors"
              style={{ width: 44, height: 24, background: annual ? "#7C3AED" : "#E5E7EB" }}
            >
              <span
                className="absolute top-[3px] rounded-full bg-white transition-all"
                style={{ width: 18, height: 18, left: annual ? 23 : 3 }}
              />
            </button>
            <span style={{ fontSize: 14, fontWeight: 500, color: annual ? "#0F0F1A" : "#6B7280" }}>Annual</span>
            <span
              className="rounded-full px-2 py-0.5"
              style={{ background: "#DCFCE7", color: "#16A34A", fontSize: 11, fontWeight: 700 }}
            >
              Save 20%
            </span>
          </div>
        </div>

        <div className="mt-12 grid items-start gap-6 lg:grid-cols-3">
          {PLANS.map((p, i) => {
            const price = annual ? p.annual : p.monthly;
            return (
              <div
                key={p.name}
                className="fade-in-up relative bg-white px-7 py-9"
                style={{
                  borderRadius: 20,
                  border: p.featured ? "2px solid #7C3AED" : "1px solid #E5E7EB",
                  boxShadow: p.featured ? "0 8px 40px rgba(124,58,237,0.20)" : "var(--lp-card-shadow)",
                  ...delay(i * 100),
                }}
              >
                {p.featured && (
                  <span
                    className="absolute left-1/2 -translate-x-1/2 rounded-full px-4 py-1.5"
                    style={{
                      top: -14,
                      background: "linear-gradient(135deg,#7C3AED,#3B82F6)",
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: ".06em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    MOST POPULAR
                  </span>
                )}
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: ".06em",
                    textTransform: "uppercase",
                    color: p.featured ? "#7C3AED" : "#6B7280",
                  }}
                >
                  {p.name}
                </p>
                <p className="mt-3 flex items-end gap-1.5">
                  <span style={{ fontSize: 48, fontWeight: 800, color: "#0F0F1A", lineHeight: 1 }}>${price}</span>
                  <span style={{ fontSize: 16, color: "#9CA3AF" }}>/month</span>
                </p>
                {annual && p.monthly > 0 && (
                  <p className="mt-1" style={{ fontSize: 12, color: "#9CA3AF" }}>
                    Billed ${p.annual * 12}/year — save ${(p.monthly - p.annual) * 12}
                  </p>
                )}
                <p className="mt-3" style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6 }}>
                  {p.desc}
                </p>
                <div className="my-6" style={{ height: 1, background: "#F3F4F6" }} />
                <ul className="flex flex-col gap-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#22C55E" }} />
                      <span style={{ fontSize: 14, color: "#374151" }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/signup"
                  className={`mt-7 block w-full text-center ${p.featured ? "lp4-btn-primary" : ""}`}
                  style={
                    p.featured
                      ? { fontSize: 15, fontWeight: 600, padding: "14px 20px" }
                      : p.outline
                        ? {
                            fontSize: 15,
                            fontWeight: 600,
                            padding: "14px 20px",
                            borderRadius: 10,
                            border: "1.5px solid #7C3AED",
                            color: "#7C3AED",
                          }
                        : {
                            fontSize: 15,
                            fontWeight: 600,
                            padding: "14px 20px",
                            borderRadius: 10,
                            border: "1.5px solid #E5E7EB",
                            color: "#374151",
                          }
                  }
                >
                  {p.cta}
                </Link>
                {p.featured && (
                  <p className="mt-3 text-center" style={{ fontSize: 12, color: "#9CA3AF" }}>
                    30-day money-back guarantee
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div
          className="fade-in-up mt-10 flex flex-wrap items-center justify-center gap-8"
          style={{ fontSize: 13, fontWeight: 500, color: "#9CA3AF" }}
        >
          <span>✓ 7-day free trial on paid plans</span>
          <span>✓ No credit card required</span>
          <span>✓ Cancel anytime</span>
          <span>🔒 Secure payments by Paddle</span>
        </div>
      </div>
    </section>
  );
}

export const LP4_FAQ = [
  {
    q: "How is PostSpark different from Repurpose.io or Buffer?",
    a: "Repurpose.io is a distribution tool — it republishes content you already have. Buffer is a scheduler. PostSpark is an AI creation engine — it writes new content in your brand voice from scratch, then publishes it. We combine AI generation, image creation, and direct publishing in one platform.",
  },
  {
    q: "Which AI models does PostSpark use?",
    a: "PostSpark uses Claude Sonnet 5 for all text generation and thinking tasks, GPT Image 2 for text-based graphics, Flux Pro 1.1 for photorealistic images, Gemini Flash 2.5 for fast image tasks, ElevenLabs for AI voiceover, and OpenAI Whisper for podcast transcription.",
  },
  {
    q: "Can I publish directly from PostSpark to my social accounts?",
    a: "Yes. PostSpark connects directly to LinkedIn, Twitter/X, Instagram, Facebook, TikTok, YouTube, and Threads. Connect your accounts once in the Publishing Center and post with a single click — no third-party scheduler needed.",
  },
  {
    q: "Does it learn my writing style and brand voice?",
    a: "Absolutely. In Brand Voice, you upload 5 of your past posts. PostSpark analyzes your tone, cadence, vocabulary, and style — then every output from every Studio automatically sounds like you wrote it.",
  },
  {
    q: "Is there a free plan? What's included?",
    a: "Yes. The free plan includes 10 generations per month, access to 3 Studios, 1 Brand profile, and limited Spark AI Copilot. No credit card required to sign up. Paid plans start at $29/month and include a 7-day free trial.",
  },
  {
    q: "What happens to my content and data?",
    a: "Your content stays yours. PostSpark never uses your posts or brand data to train AI models. Your Brand Voice data is private to your account and never shared.",
  },
];

export function Lp4Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="px-6 py-16 sm:py-[100px]" style={{ background: "#FAFAFA" }}>
      <div className="mx-auto max-w-[720px]">
        <div className="text-center">
          <p className="lp4-label fade-in-up">FAQ</p>
          <h2
            className="fade-in-up mt-3"
            style={{ fontSize: "clamp(32px,5vw,48px)", fontWeight: 700, letterSpacing: "-0.02em", ...delay(100) }}
          >
            Common Questions
          </h2>
        </div>
        <div className="fade-in-up mt-10" style={delay(200)}>
          {LP4_FAQ.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} style={{ borderBottom: "1px solid #E5E7EB" }}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                >
                  <span style={{ fontSize: 16, fontWeight: 600, color: "#0F0F1A" }}>{f.q}</span>
                  <ChevronDown
                    className="h-5 w-5 shrink-0 transition-transform duration-200"
                    style={{ color: "#7C3AED", transform: isOpen ? "rotate(180deg)" : "none" }}
                  />
                </button>
                <div
                  className="overflow-hidden transition-all duration-300"
                  style={{ maxHeight: isOpen ? 320 : 0, opacity: isOpen ? 1 : 0 }}
                >
                  <p className="pb-5" style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.65 }}>
                    {f.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function Lp4FinalCta() {
  return (
    <section
      className="px-6 py-20 sm:py-[120px] text-center"
      style={{ background: "linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 50%, #DBEAFE 100%)" }}
    >
      <div className="mx-auto max-w-[800px]">
        <div className="fade-in-up flex justify-center">
          <BoltMark size={64} />
        </div>
        <h2
          className="fade-in-up mt-6"
          style={{ fontSize: "clamp(32px,5vw,48px)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.02em", ...delay(100) }}
        >
          Your Next 30 Days of Content.
          <br />
          <span className="lp4-grad-text">Created in the Next 30 Minutes.</span>
        </h2>
        <p className="fade-in-up mx-auto mt-5 max-w-[520px]" style={{ fontSize: 18, color: "#6B7280", lineHeight: 1.65, ...delay(200) }}>
          Join 1,200+ creators already using PostSpark to reclaim their time, grow their audience, and ship more content
          than ever before.
        </p>
        <div className="fade-in-up mt-10 flex flex-wrap items-center justify-center gap-4" style={delay(300)}>
          <Link
            to="/signup"
            className="lp4-btn-primary animate-cta-glow inline-flex items-center gap-2"
            style={{ fontSize: 16, fontWeight: 600, padding: "16px 36px" }}
          >
            Start Creating Free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/pricing"
            className="inline-flex items-center bg-white"
            style={{ fontSize: 16, fontWeight: 600, padding: "16px 28px", borderRadius: 10, border: "1.5px solid #7C3AED", color: "#7C3AED" }}
          >
            See Pricing
          </Link>
        </div>
        <p className="fade-in-up mt-5" style={{ fontSize: 13, color: "#9CA3AF", ...delay(400) }}>
          No credit card · Setup in 2 minutes · Cancel anytime
        </p>
      </div>
    </section>
  );
}

const FOOTER_COLS = [
  {
    head: "Product",
    links: [
      { label: "Studios", to: "/#studios" },
      { label: "Features", to: "/#features" },
      { label: "Pricing", to: "/pricing" },
      { label: "Changelog", to: "/changelog" },
      { label: "Blog", to: "/blog" },
      { label: "Gallery", to: "/gallery" },
    ],
  },
  {
    head: "Compare",
    links: [
      { label: "vs Repurpose.io", to: "/compare/repurpose-io" },
      { label: "vs Buffer", to: "/compare/buffer" },
      { label: "vs Hootsuite", to: "/compare/hootsuite" },
      { label: "vs Typefully", to: "/compare/typefully" },
      { label: "vs ChatGPT", to: "/compare/chatgpt" },
    ],
  },
  {
    head: "Company",
    links: [
      { label: "About", to: "/about" },
      { label: "Contact", to: "/contact" },
      { label: "Privacy Policy", to: "/privacy" },
      { label: "Terms of Service", to: "/terms" },
      { label: "DMCA", to: "/dmca" },
      { label: "Data Deletion", to: "/data-deletion" },
    ],
  },
];

export function Lp4Footer() {
  return (
    <footer className="px-6 pb-10 pt-20" style={{ background: "#0F0F1A", color: "#fff" }}>
      <div className="mx-auto max-w-[1200px]">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Wordmark dark />
            <p className="mt-3 max-w-[240px]" style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.65 }}>
              The AI Content Operating System for modern creators and agencies.
            </p>
            <div className="mt-5">
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", color: "rgba(255,255,255,0.4)" }}>
                POWERED BY
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {["Claude", "OpenAI", "Gemini", "ElevenLabs"].map((n) => (
                  <span
                    key={n}
                    className="rounded-full px-2 py-1"
                    style={{ fontSize: 11, background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
                  >
                    {n}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {FOOTER_COLS.map((col) => (
            <div key={col.head}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>
                {col.head}
              </p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.to} style={{ fontSize: 14, color: "rgba(255,255,255,0.65)" }} className="hover:text-white">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="mt-14 flex flex-wrap items-center justify-between gap-4 pt-6"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
            © 2026 PostSpark. A private company registered in Pakistan.
          </p>
          <div className="flex items-center gap-4">
            {SOCIALS.filter((s) => ["LinkedIn", "X", "Instagram", "TikTok", "Threads"].includes(s.name)).map((s) => (
              <span
                key={s.name}
                className="grid h-9 w-9 place-items-center rounded-full"
                style={{ background: "rgba(255,255,255,0.08)" }}
              >
                <svg width={18} height={18} viewBox="0 0 24 24" fill="rgba(255,255,255,0.65)" aria-hidden>
                  <path d={s.path} />
                </svg>
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export function Lp4StickyCta() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 p-3 md:hidden"
      style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(12px)", borderTop: "1px solid #F3F4F6" }}
    >
      <Link
        to="/signup"
        className="lp4-btn-primary flex items-center justify-center"
        style={{ height: 56, fontSize: 16, fontWeight: 600 }}
      >
        Start Creating Free →
      </Link>
    </div>
  );
}

/** Unused re-export guard so SocialCircle stays tree-shake safe for future use. */
export { SocialCircle };
