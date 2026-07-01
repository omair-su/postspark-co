import { Link } from "@tanstack/react-router";
import {
  Repeat, Image as ImageIcon, Video, Flame, Layers, FileText,
  Wand2, MessageSquare, Camera, Download, ArrowUpRight,
} from "lucide-react";

const TOOLS = [
  { to: "/features/repurpose-blog-to-social", label: "Repurpose Studio", desc: "One source → 30+ platform-ready posts.", icon: Repeat, tint: "from-violet-500/25 to-fuchsia-500/10" },
  { to: "/tools/shorts-script-generator", label: "Shorts Studio", desc: "60s vertical scripts + AI voiceover.", icon: Video, tint: "from-pink-500/25 to-rose-500/10" },
  { to: "/tools/ai-image-generator", label: "Image Studio", desc: "GPT-Image-2, Flux 1.1 Pro & Gemini.", icon: ImageIcon, tint: "from-cyan-500/25 to-blue-500/10", pill: "3 models" },
  { to: "/tools/hook-generator", label: "Hook Lab", desc: "10 scroll-stopping hooks per idea.", icon: Flame, tint: "from-orange-500/25 to-amber-500/10" },
  { to: "/tools/blog-to-linkedin-carousel", label: "Carousel Generator", desc: "Multi-slide LinkedIn + X carousels.", icon: Layers, tint: "from-blue-500/25 to-indigo-500/10" },
  { to: "/tools/youtube-to-blog", label: "SEO Blog Writer", desc: "Long-form articles tuned to rank.", icon: FileText, tint: "from-emerald-500/25 to-teal-500/10" },
  { to: "/tools/ai-humanizer", label: "AI Humanizer", desc: "Make AI text read handwritten.", icon: Wand2, tint: "from-amber-500/25 to-yellow-500/10", pill: "Free" },
  { to: "/tools/reply-generator", label: "Reply Generator", desc: "5 on-brand replies for X & LinkedIn.", icon: MessageSquare, tint: "from-violet-500/25 to-purple-500/10", pill: "Free" },
  { to: "/tools/youtube-thumbnail-maker", label: "Thumbnail Maker", desc: "Click-worthy YouTube & podcast covers.", icon: Camera, tint: "from-red-500/25 to-orange-500/10" },
  { to: "/tools/linkedin-video-downloader", label: "LinkedIn Downloader", desc: "Save LinkedIn videos in one click.", icon: Download, tint: "from-sky-500/25 to-cyan-500/10", pill: "Free" },
];

export function ToolsGridV3() {
  return (
    <section id="studios" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <p className="lv3-chip">All-in-one studio</p>
          <h2 className="mt-4 font-display-lux" style={{ fontSize: "clamp(36px, 5vw, 60px)", lineHeight: 1.05, color: "#FAFAF9" }}>
            Ten AI studios. <em className="lv3-text-gradient" style={{ fontStyle: "italic" }}>One subscription.</em>
          </h2>
          <p className="mt-4 text-base sm:text-lg" style={{ color: "rgba(250,250,249,0.65)" }}>
            Repurpose, shorts, images, carousels, blogs, hooks, humanizer, replies — everything a modern creator ships in a week.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TOOLS.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className="group relative overflow-hidden rounded-2xl p-6 lv3-glass lv3-gradient-border lv3-card-hover flex flex-col"
            >
              <span aria-hidden className={`pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full blur-3xl bg-gradient-to-br ${t.tint}`} />
              <div className="relative flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <t.icon className="h-5 w-5" style={{ color: "#C4B5FD" }} />
                </span>
                {t.pill && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: "rgba(124,58,237,0.18)", color: "#C4B5FD", border: "1px solid rgba(124,58,237,0.3)" }}>
                    {t.pill}
                  </span>
                )}
              </div>
              <h3 className="relative mt-5 font-display-lux" style={{ fontSize: 22, lineHeight: 1.1, color: "#FAFAF9" }}>
                {t.label}
              </h3>
              <p className="relative mt-2 text-[13.5px] leading-relaxed flex-1" style={{ color: "rgba(250,250,249,0.62)" }}>
                {t.desc}
              </p>
              <span className="relative mt-5 inline-flex items-center gap-1 text-xs font-semibold" style={{ color: "#A78BFA" }}>
                Explore <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
