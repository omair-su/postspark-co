import { Link } from "@tanstack/react-router";
import {
  RefreshCw,
  Zap,
  LayoutGrid,
  Video,
  FileText,
  Image as ImageIcon,
  Layout,
  Wand2,
  Mic,
  Check,
} from "lucide-react";
import { AI_BADGES, AiBadge, delay } from "./parts";

const STUDIOS = [
  { Icon: RefreshCw, name: "Repurpose Studio", desc: "One source → 30+ platform-ready posts, on-brand.", tier: "PRO", to: "/dashboard/repurpose" },
  { Icon: Zap, name: "Hook Lab", desc: "10 hooks per idea, scored and A/B ready.", tier: "PRO", to: "/dashboard/hook-lab" },
  { Icon: LayoutGrid, name: "Carousel Generator", desc: "Multi-slide LinkedIn & X carousels that stop the scroll.", tier: "PRO", to: "/dashboard/carousel" },
  { Icon: Video, name: "Shorts Studio", desc: "Idea → 60s TikTok/Reels script with AI voiceover.", tier: "PRO", to: "/dashboard/shorts-studio" },
  { Icon: FileText, name: "SEO Blog", desc: "Long-form articles tuned to rank on Google.", tier: "PRO", to: "/dashboard/seo-blog" },
  { Icon: ImageIcon, name: "Image Studio", desc: "Brand-aware visuals powered by 3 AI models.", tier: "PRO", to: "/dashboard/image-studio" },
  { Icon: Layout, name: "Thumbnail / Cover", desc: "YouTube & podcast covers in seconds.", tier: "PRO", to: "/dashboard/thumbnail" },
  { Icon: Wand2, name: "AI Humanizer", desc: "Make AI text read like you actually wrote it.", tier: "FREE", to: "/dashboard/humanizer" },
  { Icon: Mic, name: "Podcast → Content", desc: "Turn episodes into viral clips & posts.", tier: "PRO", to: "/dashboard/podcast" },
] as const;

export function Lp4Studios() {
  return (
    <section id="studios" className="scroll-mt-20 px-6 py-16 sm:py-[100px]" style={{ background: "#FAFAFA" }}>
      <div className="mx-auto max-w-[1200px]">
        <div className="text-center">
          <p className="lp4-label fade-in-up">Studios</p>
          <h2
            className="fade-in-up mt-3"
            style={{ fontSize: "clamp(34px,5vw,48px)", fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.02em", ...delay(100) }}
          >
            9 Powerful Studios.
            <br />
            <span className="lp4-grad-text">One</span> Platform.
          </h2>
          <p className="fade-in-up mx-auto mt-4 max-w-[600px]" style={{ fontSize: 18, color: "#6B7280", ...delay(200) }}>
            Every content format you need — built-in, AI-powered, and trained on your brand voice.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {STUDIOS.map((s, i) => (
            <Link
              key={s.name}
              to={s.to}
              className="lp4-card fade-in-up block px-6 py-7"
              style={delay((i % 3) * 100)}
            >
              <span
                className="grid place-items-center"
                style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#F5F3FF,#EDE9FE)" }}
              >
                <s.Icon className="h-[22px] w-[22px]" style={{ color: "#7C3AED" }} />
              </span>
              <h3 className="mt-3.5" style={{ fontSize: 16, fontWeight: 700, color: "#0F0F1A" }}>
                {s.name}
              </h3>
              <p className="mt-1" style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.5 }}>
                {s.desc}
              </p>
              <span
                className="mt-4 inline-flex rounded-full px-2 py-0.5"
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: ".06em",
                  background: s.tier === "FREE" ? "#DCFCE7" : "#F5F3FF",
                  color: s.tier === "FREE" ? "#16A34A" : "#7C3AED",
                }}
              >
                {s.tier}
              </span>
            </Link>
          ))}
        </div>

        <div className="fade-in-up mt-12 flex flex-wrap items-center justify-center gap-2.5">
          <span style={{ fontSize: 14, color: "#6B7280" }}>All studios powered by</span>
          {AI_BADGES.map((b) => (
            <AiBadge key={b.name} {...b} />
          ))}
        </div>
      </div>
    </section>
  );
}

const MODELS = [
  { name: "Claude Sonnet 5", bg: "#FFF7F0", initial: "C", color: "#D97757", use: "Writing & Thinking" },
  { name: "GPT Image 2", bg: "#F0FFF4", initial: "G", color: "#10A37F", use: "Text-in-Image Graphics" },
  { name: "Flux Pro 1.1", bg: "#FFF4F0", initial: "F", color: "#FF6B35", use: "Photorealistic Images" },
  { name: "Gemini Flash 2.5", bg: "#F0F4FF", initial: "G", color: "#4285F4", use: "Speed + Image Tasks" },
  { name: "ElevenLabs", bg: "#F5F0FF", initial: "E", color: "#7C3AED", use: "AI Voiceover" },
  { name: "Whisper (OpenAI)", bg: "#F0F9FF", initial: "W", color: "#0EA5E9", use: "Podcast Transcription" },
];

export function Lp4Models() {
  return (
    <section
      className="overflow-hidden px-6 py-16 sm:py-20"
      style={{ background: "linear-gradient(180deg, #F5F3FF 0%, #EDE9FE 100%)" }}
    >
      <div className="mx-auto max-w-[1100px] text-center">
        <p className="lp4-label fade-in-up">Powered by</p>
        <h2
          className="fade-in-up mt-3"
          style={{ fontSize: "clamp(30px,4.4vw,40px)", fontWeight: 700, letterSpacing: "-0.02em", color: "#0F0F1A", ...delay(100) }}
        >
          Built on the World's Best AI
        </h2>
        <p className="fade-in-up mx-auto mt-4 max-w-[600px]" style={{ fontSize: 16, color: "#6B7280", ...delay(150) }}>
          We've integrated the top AI models so every tool always uses the right model for the job.
        </p>

        <div className="mt-12 flex flex-wrap justify-center gap-4">
          {MODELS.map((m, i) => (
            <div
              key={m.name}
              className="lp4-card lp4-stagger flex flex-col items-center gap-3 px-7 py-6 text-center"
              style={{ minWidth: 180, animationDelay: `${i * 80}ms` }}
            >
              <span
                className="grid place-items-center rounded-full"
                style={{ width: 48, height: 48, background: m.bg, color: m.color, fontSize: 20, fontWeight: 800 }}
              >
                {m.initial}
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#0F0F1A" }}>{m.name}</span>
              <span style={{ fontSize: 12, color: "#9CA3AF" }}>{m.use}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

type Feature = {
  label: string;
  title: string;
  body: string;
  bullets: string[];
  tags?: string[];
  mockBg: string;
  mock: { name: string; color: string }[];
  to: string;
};

const FEATURES: Feature[] = [
  {
    label: "Repurpose Studio",
    title: "One Blog Post. Seven Platform-Ready Posts.",
    body: "Paste any YouTube link, blog URL, or podcast episode. PostSpark reads it, learns your brand voice, and instantly creates native content for every platform — not copy-paste, actually adapted.",
    bullets: [
      "LinkedIn posts in your exact tone",
      "Twitter/X threads with hooks",
      "Instagram captions + hashtags",
      "TikTok scripts with hooks",
      "Email newsletter snippets",
    ],
    tags: ["LinkedIn", "Twitter/X", "Instagram", "TikTok", "Email"],
    mockBg: "linear-gradient(135deg, #EDE9FE, #DDD6FE)",
    mock: [
      { name: "LinkedIn", color: "#0A66C2" },
      { name: "Twitter/X", color: "#0F0F1A" },
      { name: "TikTok", color: "#EC4899" },
    ],
    to: "/dashboard/repurpose",
  },
  {
    label: "Image Studio",
    title: "Three AI Models. One Studio. Unlimited Creativity.",
    body: "Choose GPT Image 2 for text-based graphics, Flux Pro 1.1 for photorealistic images, or Gemini Flash 2.5 for speed. Generate, compare, and download — individually or as a ZIP file.",
    bullets: [
      "GPT Image 2 — best for text in images",
      "Flux Pro 1.1 — photorealistic quality",
      "Gemini Flash 2.5 — fast & versatile",
      "Download as PDF or bulk ZIP",
    ],
    mockBg: "linear-gradient(135deg, #F0F9FF, #E0F2FE)",
    mock: [
      { name: "GPT Image 2", color: "#10A37F" },
      { name: "Flux Pro 1.1", color: "#FF6B35" },
      { name: "Gemini Flash", color: "#4285F4" },
    ],
    to: "/dashboard/image-studio",
  },
  {
    label: "Direct Publishing",
    title: "Publish to 7 Platforms Without Leaving PostSpark.",
    body: "Connect your social accounts once. Then schedule, post now, or add to your content calendar — all from the Publishing Center. No more tab-switching, no more copy-pasting.",
    bullets: [
      "LinkedIn, Twitter/X, Instagram",
      "TikTok, YouTube, Facebook, Threads",
      "WhatsApp notifications for posts",
      "Content calendar & scheduling",
    ],
    mockBg: "linear-gradient(135deg, #ECFDF5, #D1FAE5)",
    mock: [
      { name: "Scheduled · Mon 9:00", color: "#10B981" },
      { name: "Queued · Tue 14:30", color: "#06B6D4" },
      { name: "Published · today", color: "#7C3AED" },
    ],
    to: "/dashboard/publishing",
  },
  {
    label: "Brand Kit + Brand Voice",
    title: "PostSpark Learns Your Brand. Then Writes Like You.",
    body: "Upload your logo, set your colors, choose your fonts, and define your voice with 5 sample posts. Every output from that point forward matches your brand automatically.",
    bullets: [
      "All Google Fonts available",
      "Custom color palettes",
      "Four logo format uploads",
      "Brand voice trained on your posts",
      "Consistent across all 9 Studios",
    ],
    mockBg: "linear-gradient(135deg, #FFF7ED, #FED7AA)",
    mock: [
      { name: "Primary #7C3AED", color: "#7C3AED" },
      { name: "Accent #06B6D4", color: "#06B6D4" },
      { name: "Voice · confident, warm", color: "#F59E0B" },
    ],
    to: "/dashboard/brand-kit",
  },
];

function FeatureMock({ f }: { f: Feature }) {
  return (
    <div
      className="flex items-center justify-center overflow-hidden p-8"
      style={{ background: f.mockBg, borderRadius: 20, height: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.10)" }}
    >
      <div className="w-full max-w-[380px] overflow-hidden rounded-2xl bg-white" style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}>
        <div className="flex items-center gap-1.5 px-4" style={{ height: 32, background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
          {["#EF4444", "#F59E0B", "#22C55E"].map((c) => (
            <span key={c} className="h-2 w-2 rounded-full" style={{ background: c }} />
          ))}
          <span className="ml-2" style={{ fontSize: 11, color: "#9CA3AF" }}>
            {f.label}
          </span>
        </div>
        <div className="space-y-2.5 p-4">
          {f.mock.map((m) => (
            <div key={m.name} className="rounded-xl border p-3" style={{ borderColor: "#E5E7EB" }}>
              <div className="flex items-center gap-2">
                <span className="h-5 w-5 rounded-full" style={{ background: m.color }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#0F0F1A" }}>{m.name}</span>
              </div>
              <div className="mt-2 space-y-1.5">
                <div className="h-1.5 rounded-full" style={{ width: "92%", background: "#EEF0F4" }} />
                <div className="h-1.5 rounded-full" style={{ width: "76%", background: "#EEF0F4" }} />
                <div className="h-1.5 rounded-full" style={{ width: "48%", background: "#DDD6FE" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Lp4Features() {
  return (
    <section id="features" className="scroll-mt-20 bg-white px-6 py-16 sm:py-[100px]">
      <div className="mx-auto max-w-[1200px]">
        {FEATURES.map((f, i) => {
          const textFirst = i % 2 === 1;
          return (
            <div
              key={f.title}
              className="fade-in-up grid items-center gap-10 lg:grid-cols-2 lg:gap-20"
              style={{ marginBottom: i === FEATURES.length - 1 ? 0 : 80 }}
            >
              <div className={textFirst ? "lg:order-2" : "lg:order-1"}>
                <FeatureMock f={f} />
              </div>
              <div className={textFirst ? "lg:order-1" : "lg:order-2"}>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: "#7C3AED" }}>
                  {f.label}
                </p>
                <h3 className="mt-3" style={{ fontSize: "clamp(26px,3.2vw,32px)", fontWeight: 700, lineHeight: 1.25, color: "#0F0F1A" }}>
                  {f.title}
                </h3>
                <p className="mt-4" style={{ fontSize: 16, color: "#6B7280", lineHeight: 1.65 }}>
                  {f.body}
                </p>
                <ul className="mt-6 flex flex-col gap-2.5">
                  {f.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-3">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full" style={{ background: "#F5F3FF" }}>
                        <Check className="h-3 w-3" style={{ color: "#7C3AED" }} />
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 500, color: "#374151" }}>{b}</span>
                    </li>
                  ))}
                </ul>
                {f.tags && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {f.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-md px-2 py-1"
                        style={{ fontSize: 11, background: "#F3F4F6", color: "#4B5563", fontWeight: 500 }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                <Link
                  to={f.to}
                  className="mt-6 inline-block hover:underline"
                  style={{ fontSize: 14, fontWeight: 600, color: "#7C3AED" }}
                >
                  Learn more →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
