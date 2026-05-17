import { useState } from "react";
import {
  Mic,
  Flame,
  Image as ImageIcon,
  Calendar,
  FileText,
  Upload,
  Globe,
  Gift,
  Sparkles,
  ChevronDown,
  Wand2,
  Headphones,
  LayoutGrid,
  MessageSquareReply,
  ImagePlus,
  BotMessageSquare,
} from "lucide-react";

const premiumFeatures = [
  {
    icon: BotMessageSquare,
    title: "Spark Copilot",
    desc: "A built-in AI assistant that answers, drafts, and rewrites in-app. Like ChatGPT, fluent in your brand voice and tools.",
    badge: "New",
    gradient: "from-violet-500/20 to-fuchsia-500/20",
    highlights: [
      "Chat-based assistant inside every workspace",
      "Knows your brand voice, kit and history",
      "One click → draft, humanize, repurpose, reply",
    ],
  },
  {
    icon: Wand2,
    title: "AI Humanizer",
    desc: "Turn robotic AI text into natural, human-sounding writing that passes detectors and actually feels like you.",
    badge: "New",
    gradient: "from-purple-500/20 to-pink-500/20",
    highlights: [
      "Bypass AI detectors with one click",
      "Preserves meaning, adjusts cadence + tone",
      "Tune intensity from light polish → full rewrite",
    ],
  },
  {
    icon: Headphones,
    title: "Podcast Studio",
    desc: "Drop in an episode and get show notes, timestamps, tweet threads, LinkedIn carousels and a newsletter — instantly.",
    badge: "New",
    gradient: "from-amber-500/20 to-orange-500/20",
    highlights: [
      "Auto-transcribe with chapter timestamps",
      "Generate show notes + key quotes",
      "Spin one episode into 20+ social assets",
    ],
  },
  {
    icon: LayoutGrid,
    title: "Carousel Generator",
    desc: "Instagram & LinkedIn carousels designed in seconds — copy, layout, and on-brand visuals from one prompt.",
    badge: "New",
    gradient: "from-pink-500/20 to-rose-500/20",
    highlights: [
      "5–10 slide carousels in <15 seconds",
      "Auto-applies your colors and fonts",
      "Export PDF / PNG ready to upload",
    ],
  },
  {
    icon: MessageSquareReply,
    title: "Reply Generator",
    desc: "Grow by engaging — get 5 sharp reply options for any post on X, LinkedIn or Threads, in your voice.",
    badge: "New",
    gradient: "from-cyan-500/20 to-blue-500/20",
    highlights: [
      "5 reply angles per post (contrarian, witty, value)",
      "Matches your tone and authority level",
      "Copy-to-clipboard in one tap",
    ],
  },
  {
    icon: ImagePlus,
    title: "Thumbnail Maker",
    desc: "Click-worthy YouTube & blog thumbnails in seconds. Premium type, hierarchy and color — no Photoshop required.",
    badge: "New",
    gradient: "from-rose-500/20 to-orange-500/20",
    highlights: [
      "16:9 YouTube + 1:1 social presets",
      "Curated layouts that actually convert",
      "Edit headline and re-export instantly",
    ],
  },
  {
    icon: Mic,
    title: "Brand Voice AI",
    desc: "Train PostSpark on your writing samples. Every post sounds unmistakably you — auto-applied everywhere.",
    badge: "Pro",
    gradient: "from-purple-500/20 to-fuchsia-500/20",
    highlights: [
      "Fingerprint your tone from 5–20 samples",
      "Auto-applied to every generation",
      "Switch voices per project or client",
    ],
  },
  {
    icon: Flame,
    title: "Hook Lab",
    desc: "Generate 20+ scroll-stopping hooks in seconds. A/B test variants and pick winners backed by virality scoring.",
    badge: "Pro",
    gradient: "from-orange-500/20 to-red-500/20",
    highlights: [
      "20+ hook variants per topic in <10s",
      "Virality score on every hook",
      "Save winners to your swipe file",
    ],
  },
  {
    icon: Calendar,
    title: "Content Calendar",
    desc: "Schedule a full month of posts in a drag-and-drop view. Visual planning that ships consistency.",
    badge: "New",
    gradient: "from-blue-500/20 to-cyan-500/20",
    highlights: [
      "Drag-and-drop month + week views",
      "Color-coded by platform and campaign",
      "One-click reschedule across channels",
    ],
  },
  {
    icon: FileText,
    title: "SEO Blog Writer",
    desc: "Long-form, ranking-ready blog posts with built-in keyword optimization and meta generation.",
    badge: "Pro",
    gradient: "from-emerald-500/20 to-teal-500/20",
    highlights: [
      "1,500–3,000 word ranking-ready drafts",
      "Auto meta title, description, and slug",
      "Keyword density and outline scoring",
    ],
  },
  {
    icon: ImageIcon,
    title: "AI Image Studio",
    desc: "Quote cards, hero images, social tiles — on-brand, in seconds, no designer required.",
    badge: "Pro",
    gradient: "from-fuchsia-500/20 to-purple-500/20",
    highlights: [
      "Quote cards, tiles, hero images",
      "Brand kit locks your colors and fonts",
      "Platform-perfect export dimensions",
    ],
  },
  {
    icon: Upload,
    title: "Import Studio",
    desc: "Pull in YouTube, podcasts, PDFs, or any URL. Auto-transcribed and ready to repurpose in one click.",
    badge: "New",
    gradient: "from-amber-500/20 to-orange-500/20",
    highlights: [
      "YouTube, podcasts, PDFs, URLs",
      "Auto-transcription with timestamps",
      "One click → 30 pieces of content",
    ],
  },
  {
    icon: Globe,
    title: "Public Gallery",
    desc: "Share your best generations to a public showcase. Get inspired by what's working for other creators.",
    badge: "New",
    gradient: "from-indigo-500/20 to-blue-500/20",
    highlights: [
      "Publish your best work in one click",
      "Browse what's working for creators",
      "Remix any public post as a starter",
    ],
  },
  {
    icon: Gift,
    title: "Refer & Earn",
    desc: "Invite friends and earn free Pro months. Every signup = more content credits in your account.",
    badge: "Rewards",
    gradient: "from-rose-500/20 to-pink-500/20",
    highlights: [
      "1 free Pro month per referred signup",
      "Track invites and rewards live",
      "Stack rewards — no cap",
    ],
  },
];

export function PremiumFeaturesSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (i: number) =>
    setOpenIndex((current) => (current === i ? null : i));

  return (
    <section id="premium-features" className="relative isolate overflow-hidden cream-surface py-24">
      <div className="cream-grain" aria-hidden />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/4 h-96 w-96 rounded-full opacity-40 blur-3xl lux-float"
        style={{ background: "radial-gradient(closest-side, rgba(124,58,237,0.30), transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 right-1/4 h-96 w-96 rounded-full opacity-40 blur-3xl lux-float"
        style={{ animationDelay: "1.6s", background: "radial-gradient(closest-side, rgba(232,93,58,0.25), transparent 70%)" }}
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <span className="luxury-chip">
            <Sparkles className="h-3.5 w-3.5 text-[#7c3aed]" />
            Premium Suite · 14 AI Tools
          </span>
          <h2 className="mt-5 luxury-heading" style={{ fontFamily: '"Instrument Serif", serif', fontWeight: 400, fontSize: "clamp(1.9rem, 4.4vw, 3rem)", lineHeight: 1.05 }}>
            A Full <span className="luxury-gradient-text">AI Content Studio</span>
            <br className="hidden sm:block" />
            in One Workspace
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base text-[#1a1a2e]/65 sm:text-lg">
            Beyond simple repurposing — Spark Copilot, Humanizer, Podcast Studio, Carousels, Reply Generator, Thumbnails and more. The complete creator OS.
          </p>
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-[#1a1a2e]/50">
            Tap any card to expand
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {premiumFeatures.map((f, i) => {
            const isOpen = openIndex === i;
            return (
              <button
                key={f.title}
                type="button"
                onClick={() => toggle(i)}
                aria-expanded={isOpen}
                className={`luxury-card group relative overflow-hidden p-6 text-left transition-all duration-300 animate-fade-in hover:-translate-y-1 ${
                  isOpen ? "ring-2 ring-[#7c3aed]/40" : ""
                }`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div
                  className={`absolute inset-0 -z-10 bg-gradient-to-br ${f.gradient} transition-opacity duration-500 ${
                    isOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                />

                <div className="flex items-start justify-between">
                  <div
                    className={`relative flex h-12 w-12 items-center justify-center rounded-xl shadow-lg transition-transform duration-300 ${
                      isOpen ? "scale-110 rotate-3" : "group-hover:scale-110 group-hover:rotate-3"
                    }`}
                    style={{
                      background: "linear-gradient(135deg, #1a1a2e 0%, #4c1d95 55%, #7c3aed 100%)",
                      boxShadow: "0 14px 30px -10px rgba(124,58,237,0.55)",
                    }}
                  >
                    <f.icon className="h-6 w-6 text-white" />
                  </div>
                  <span className="rounded-full border border-[#7c3aed]/30 bg-[#7c3aed]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#7c3aed]">
                    {f.badge}
                  </span>
                </div>

                <h3 className="mt-5 flex items-center justify-between gap-2 text-lg font-semibold luxury-heading">
                  <span>{f.title}</span>
                  <ChevronDown
                    className={`h-4 w-4 flex-shrink-0 text-[#1a1a2e]/40 transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-[#7c3aed]" : ""
                    }`}
                  />
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#1a1a2e]/65">{f.desc}</p>

                <div
                  className={`grid transition-all duration-500 ease-out ${
                    isOpen ? "mt-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="border-t border-[#1a1a2e]/10 pt-4">
                      <ul className="space-y-2">
                        {f.highlights.map((h, hi) => (
                          <li
                            key={h}
                            className="flex items-start gap-2 text-xs text-[#1a1a2e]/75"
                            style={{
                              animation: isOpen ? `fade-in 0.4s ease-out ${hi * 80}ms both` : "none",
                            }}
                          >
                            <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#7c3aed] shadow-[0_0_8px_rgba(124,58,237,0.6)]" />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="luxury-card mt-16 p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1a1a2e]/55">
            Replaces 10+ tools
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-[#1a1a2e]/70">
            <span className="line-through opacity-60">ChatGPT Plus</span>
            <span className="text-[#7c3aed]">+</span>
            <span className="line-through opacity-60">Jasper</span>
            <span className="text-[#7c3aed]">+</span>
            <span className="line-through opacity-60">Canva</span>
            <span className="text-[#7c3aed]">+</span>
            <span className="line-through opacity-60">Descript</span>
            <span className="text-[#7c3aed]">+</span>
            <span className="line-through opacity-60">Buffer</span>
            <span className="text-[#7c3aed]">+</span>
            <span className="line-through opacity-60">Surfer SEO</span>
            <span className="text-[#7c3aed]">=</span>
            <span className="font-bold luxury-heading">PostSpark</span>
          </div>
        </div>
      </div>
    </section>
  );
}
