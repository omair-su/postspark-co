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
} from "lucide-react";

const premiumFeatures = [
  {
    icon: Mic,
    title: "Brand Voice AI",
    desc: "Train PostSpark on your writing samples. Every post sounds unmistakably you — auto-applied to every generation.",
    badge: "Pro",
    gradient: "from-purple-500/20 to-fuchsia-500/20",
    highlights: [
      "Upload 5–20 samples to fingerprint your tone",
      "Auto-applied to every repurpose, hook, and email",
      "Switch voices per project or client",
    ],
  },
  {
    icon: Flame,
    title: "Hook Lab",
    desc: "Generate 20+ scroll-stopping hooks in seconds. A/B test variants and pick winners backed by virality scoring.",
    badge: "New",
    gradient: "from-orange-500/20 to-red-500/20",
    highlights: [
      "20+ hook variants per topic in <10 seconds",
      "Virality score on every hook",
      "Save winners to your personal swipe file",
    ],
  },
  {
    icon: ImageIcon,
    title: "AI Image Studio",
    desc: "Create on-brand thumbnails, quote cards, and carousel slides. No designer required — your colors, your fonts.",
    badge: "New",
    gradient: "from-pink-500/20 to-purple-500/20",
    highlights: [
      "Thumbnails, quote cards, and carousels",
      "Brand kit: lock your colors and fonts",
      "Export at platform-perfect dimensions",
    ],
  },
  {
    icon: Calendar,
    title: "Content Calendar",
    desc: "Schedule a full month of posts in one drag-and-drop view. Visual planning that ships consistency.",
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
    icon: Upload,
    title: "Import Studio",
    desc: "Pull in YouTube videos, podcasts, PDFs, or any URL. Auto-transcribed and ready to repurpose in one click.",
    badge: "New",
    gradient: "from-amber-500/20 to-orange-500/20",
    highlights: [
      "YouTube, podcasts, PDFs, and URLs",
      "Auto-transcription with timestamps",
      "One click → 30 pieces of content",
    ],
  },
  {
    icon: Globe,
    title: "Public Gallery",
    desc: "Share your best generations to a public showcase. Get inspired by what other creators are shipping.",
    badge: "New",
    gradient: "from-indigo-500/20 to-blue-500/20",
    highlights: [
      "Publish your best work in one click",
      "Browse what's working for other creators",
      "Remix any public post as a starting point",
    ],
  },
  {
    icon: Gift,
    title: "Refer & Earn",
    desc: "Invite friends and earn free Pro months. Every signup = more content credits in your account.",
    badge: "Rewards",
    gradient: "from-rose-500/20 to-pink-500/20",
    highlights: [
      "Earn 1 free Pro month per referred signup",
      "Track invites and rewards in real time",
      "Stack rewards — no cap on free months",
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
            Premium Suite
          </span>
          <h2 className="mt-5 luxury-heading" style={{ fontSize: "clamp(1.9rem, 4.4vw, 3rem)", lineHeight: 1.05 }}>
            A Full <span className="luxury-gradient-text">AI Content Studio</span>
            <br className="hidden sm:block" />
            in One Workspace
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base text-[#1a1a2e]/65 sm:text-lg">
            Beyond simple repurposing — PostSpark is the complete creator OS. Train your voice, design assets, plan your calendar, and grow your reach. All powered by AI.
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
                style={{ animationDelay: `${i * 70}ms` }}
              >
                {/* Hover gradient sheen */}
                <div
                  className={`absolute inset-0 -z-10 bg-gradient-to-br ${f.gradient} transition-opacity duration-500 ${
                    isOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                />

                <div className="flex items-start justify-between">
                  <div
                    className={`relative flex h-12 w-12 items-center justify-center rounded-xl gradient-electric shadow-lg shadow-electric/30 transition-transform duration-300 ${
                      isOpen
                        ? "scale-110 rotate-3"
                        : "group-hover:scale-110 group-hover:rotate-3"
                    }`}
                  >
                    <f.icon className="h-6 w-6 text-primary-foreground" />
                    <div
                      className={`absolute inset-0 rounded-xl bg-white/10 blur-xl transition-opacity duration-300 ${
                        isOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                    />
                  </div>
                  <span className="rounded-full border border-electric/30 bg-electric/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-electric">
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

                {/* Animated expandable highlights */}
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
                              animation: isOpen
                                ? `fade-in 0.4s ease-out ${hi * 80}ms both`
                                : "none",
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
            Replaces 8+ tools
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-[#1a1a2e]/70">
            <span className="line-through opacity-60">Jasper</span>
            <span className="text-[#7c3aed]">+</span>
            <span className="line-through opacity-60">Canva</span>
            <span className="text-[#7c3aed]">+</span>
            <span className="line-through opacity-60">Buffer</span>
            <span className="text-[#7c3aed]">+</span>
            <span className="line-through opacity-60">Surfer SEO</span>
            <span className="text-[#7c3aed]">+</span>
            <span className="line-through opacity-60">Descript</span>
            <span className="text-[#7c3aed]">=</span>
            <span className="font-bold luxury-heading">PostSpark</span>
          </div>
        </div>
      </div>
    </section>
  );
}
