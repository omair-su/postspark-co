import { Link } from "@tanstack/react-router";
import { PostSparkLogo } from "@/components/PostSparkLogo";
import { Sparkles, Mail, Twitter, Linkedin } from "lucide-react";

const COL_PRODUCT = [
  { label: "Features", to: "/#features" },
  { label: "How It Works", to: "/#how-it-works" },
  { label: "Pricing", to: "/#pricing" },
  { label: "Blog", to: "/blog" },
  { label: "Changelog", to: "/changelog" },
];

const COL_TOOLS = [
  { label: "AI Image Generator", to: "/tools/ai-image-generator" },
  { label: "YouTube Thumbnail Maker", to: "/tools/youtube-thumbnail-maker" },
  { label: "LinkedIn Video Downloader", to: "/tools/linkedin-video-downloader" },
  { label: "Hook Generator", to: "/tools/hook-generator" },
  { label: "Podcast Transcript", to: "/tools/podcast-transcript-generator" },
  { label: "YouTube → Blog", to: "/tools/youtube-to-blog" },
  { label: "Blog → Newsletter", to: "/tools/blog-to-newsletter" },
];

const COL_SOLUTIONS = [
  { label: "For Creators", to: "/for/creators" },
  { label: "For Agencies", to: "/for/agencies" },
  { label: "For Podcasters", to: "/for/podcasters" },
  { label: "For YouTubers", to: "/for/youtubers" },
  { label: "LinkedIn Ghostwriters", to: "/use-cases/linkedin-ghostwriters" },
  { label: "Podcast to Social", to: "/use-cases/podcast-to-social" },
];

const COL_COMPARE = [
  { label: "vs Buffer", to: "/alternatives/buffer-vs-postspark" },
  { label: "vs Hootsuite", to: "/alternatives/hootsuite-vs-postspark" },
  { label: "vs Typefully", to: "/alternatives/typefully-vs-postspark" },
  { label: "vs ChatGPT", to: "/alternatives/chatgpt-for-content-repurposing" },
  { label: "vs Jasper", to: "/alternatives/jasper-vs-postspark" },
];

export function FooterV2() {
  return (
    <footer
      className="relative pt-24 pb-12 overflow-hidden"
      style={{ background: "#0F172A" }}
    >
      {/* Background accents */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-6 lg:gap-8">
          <div className="lg:col-span-2">
            <Link to="/" className="inline-block">
              <PostSparkLogo variant="wordmark" size={32} tone="light" />
            </Link>
            <p className="mt-6 text-base text-slate-400 max-w-xs leading-relaxed">
              Transforming the way creators scale. One post into a full week of platform-native content, powered by Claude AI.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <a href="https://twitter.com" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white border border-white/5">
                <Twitter size={18} />
              </a>
              <a href="https://linkedin.com" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white border border-white/5">
                <Linkedin size={18} />
              </a>
              <a href="mailto:hello@postspark.co" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white border border-white/5">
                <Mail size={18} />
              </a>
            </div>
            <div className="mt-8">
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-violet-600/10 text-violet-400 border border-violet-600/20">
                <Sparkles size={10} /> Powered by Claude AI
              </span>
            </div>
          </div>

          {[
            { title: "Product", items: COL_PRODUCT },
            { title: "Tools", items: COL_TOOLS },
            { title: "Solutions", items: COL_SOLUTIONS },
            { title: "Compare", items: COL_COMPARE },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-6">
                {col.title}
              </h4>
              <ul className="space-y-4">
                {col.items.map((it) => (
                  <li key={it.to}>
                    <Link 
                      to={it.to} 
                      className="text-sm text-slate-400 transition-colors hover:text-violet-400"
                    >
                      {it.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-20 pt-8 border-t border-white/5 flex flex-col items-center justify-between gap-6 sm:flex-row">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} PostSpark. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <Link to="/privacy" className="text-sm text-slate-500 hover:text-white transition-colors">Privacy</Link>
            <Link to="/terms" className="text-sm text-slate-500 hover:text-white transition-colors">Terms</Link>
            <Link to="/refunds" className="text-sm text-slate-500 hover:text-white transition-colors">Refunds</Link>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payments by Paddle</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
