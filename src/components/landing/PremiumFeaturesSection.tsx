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
} from "lucide-react";

const premiumFeatures = [
  {
    icon: Mic,
    title: "Brand Voice AI",
    desc: "Train PostSpark on your writing samples. Every post sounds unmistakably you — auto-applied to every generation.",
    badge: "Pro",
    gradient: "from-purple-500/20 to-fuchsia-500/20",
  },
  {
    icon: Flame,
    title: "Hook Lab",
    desc: "Generate 20+ scroll-stopping hooks in seconds. A/B test variants and pick winners backed by virality scoring.",
    badge: "New",
    gradient: "from-orange-500/20 to-red-500/20",
  },
  {
    icon: ImageIcon,
    title: "AI Image Studio",
    desc: "Create on-brand thumbnails, quote cards, and carousel slides. No designer required — your colors, your fonts.",
    badge: "New",
    gradient: "from-pink-500/20 to-purple-500/20",
  },
  {
    icon: Calendar,
    title: "Content Calendar",
    desc: "Schedule a full month of posts in one drag-and-drop view. Visual planning that ships consistency.",
    badge: "New",
    gradient: "from-blue-500/20 to-cyan-500/20",
  },
  {
    icon: FileText,
    title: "SEO Blog Writer",
    desc: "Long-form, ranking-ready blog posts with built-in keyword optimization and meta generation.",
    badge: "Pro",
    gradient: "from-emerald-500/20 to-teal-500/20",
  },
  {
    icon: Upload,
    title: "Import Studio",
    desc: "Pull in YouTube videos, podcasts, PDFs, or any URL. Auto-transcribed and ready to repurpose in one click.",
    badge: "New",
    gradient: "from-amber-500/20 to-orange-500/20",
  },
  {
    icon: Globe,
    title: "Public Gallery",
    desc: "Share your best generations to a public showcase. Get inspired by what other creators are shipping.",
    badge: "New",
    gradient: "from-indigo-500/20 to-blue-500/20",
  },
  {
    icon: Gift,
    title: "Refer & Earn",
    desc: "Invite friends and earn free Pro months. Every signup = more content credits in your account.",
    badge: "Rewards",
    gradient: "from-rose-500/20 to-pink-500/20",
  },
];

export function PremiumFeaturesSection() {
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
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {premiumFeatures.map((f, i) => (
            <div
              key={f.title}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-electric/40 hover:shadow-2xl hover:shadow-electric/10 animate-fade-in"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              {/* Hover gradient sheen */}
              <div
                className={`absolute inset-0 -z-10 bg-gradient-to-br ${f.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
              />

              <div className="flex items-start justify-between">
                <div className="relative flex h-12 w-12 items-center justify-center rounded-xl gradient-electric shadow-lg shadow-electric/30 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <f.icon className="h-6 w-6 text-primary-foreground" />
                  <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100" />
                </div>
                <span className="rounded-full border border-electric/30 bg-electric/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-electric">
                  {f.badge}
                </span>
              </div>

              <h3 className="mt-5 text-lg font-bold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
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
