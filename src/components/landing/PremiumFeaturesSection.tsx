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
    <section id="premium-features" className="relative py-24 overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-electric/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-electric/30 bg-electric/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-electric backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Premium Suite
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            A Full <span className="text-gradient">AI Content Studio</span>
            <br className="hidden sm:block" />
            in One Workspace
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Beyond simple repurposing — PostSpark is the complete creator OS.
            Train your voice, design assets, plan your calendar, and grow your reach. All powered by AI.
          </p>
          <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground/70">
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
                className={`group relative overflow-hidden rounded-2xl border bg-card/80 p-6 text-left backdrop-blur-sm transition-all duration-300 animate-fade-in hover:-translate-y-1 hover:shadow-2xl hover:shadow-electric/10 ${
                  isOpen
                    ? "border-electric/60 shadow-2xl shadow-electric/20"
                    : "border-border/60 hover:border-electric/40"
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

                <h3 className="mt-5 flex items-center justify-between gap-2 text-lg font-bold text-foreground">
                  <span>{f.title}</span>
                  <ChevronDown
                    className={`h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-electric" : ""
                    }`}
                  />
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>

                {/* Animated expandable highlights */}
                <div
                  className={`grid transition-all duration-500 ease-out ${
                    isOpen ? "mt-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="border-t border-electric/20 pt-4">
                      <ul className="space-y-2">
                        {f.highlights.map((h, hi) => (
                          <li
                            key={h}
                            className="flex items-start gap-2 text-xs text-foreground/80"
                            style={{
                              animation: isOpen
                                ? `fade-in 0.4s ease-out ${hi * 80}ms both`
                                : "none",
                            }}
                          >
                            <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-electric shadow-[0_0_8px_rgba(124,58,237,0.8)]" />
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

        {/* Bottom luxury strip */}
        <div className="mt-16 rounded-2xl border border-border/60 bg-gradient-to-r from-card via-card/80 to-card p-8 text-center backdrop-blur-sm">
          <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Replaces 8+ tools
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="line-through opacity-60">Jasper</span>
            <span className="text-electric">+</span>
            <span className="line-through opacity-60">Canva</span>
            <span className="text-electric">+</span>
            <span className="line-through opacity-60">Buffer</span>
            <span className="text-electric">+</span>
            <span className="line-through opacity-60">Surfer SEO</span>
            <span className="text-electric">+</span>
            <span className="line-through opacity-60">Descript</span>
            <span className="text-electric">=</span>
            <span className="font-bold text-foreground">PostSpark</span>
          </div>
        </div>
      </div>
    </section>
  );
}
