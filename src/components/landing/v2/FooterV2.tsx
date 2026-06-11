import { Link } from "@tanstack/react-router";
import { PostSparkLogo } from "@/components/PostSparkLogo";

const COL_PRODUCT = [
  { label: "Features", to: "/#features" },
  { label: "How It Works", to: "/#how-it-works" },
  { label: "Pricing", to: "/pricing" },
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
      style={{
        background:
          "linear-gradient(180deg, #1B1530 0%, #16122A 55%, #0F0B22 100%)",
        color: "#E8E6F2",
      }}
      className="pt-16 pb-8"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2">
              <PostSparkLogo variant="wordmark" size={28} tone="light" />
            </div>
            <p className="mt-4 text-sm" style={{ color: "#C9C5DB", lineHeight: 1.7 }}>
              AI content repurposing for creators and agencies.
            </p>
            <p className="mt-3 text-xs font-bold uppercase tracking-widest" style={{ color: "#C9A87C", letterSpacing: "0.1em" }}>
              ⚡ Powered by Claude AI
            </p>
            <a href="mailto:hello@postspark.co" className="mt-3 inline-block text-sm" style={{ color: "#E8E6F2" }}>
              hello@postspark.co
            </a>
          </div>

          {[
            { title: "Product", items: COL_PRODUCT },
            { title: "Tools", items: COL_TOOLS },
            { title: "Solutions", items: COL_SOLUTIONS },
            { title: "Compare", items: COL_COMPARE },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color: "#FFFFFF", letterSpacing: "0.1em" }}>
                {col.title}
              </h4>
              <ul className="mt-4 space-y-2">
                {col.items.map((it) => (
                  <li key={it.to}>
                    <Link to={it.to} className="text-sm transition hover:text-white" style={{ color: "#C9C5DB" }}>
                      {it.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-6 text-xs sm:flex-row"
          style={{ borderColor: "rgba(201,168,124,0.18)", color: "#A8A4BD" }}
        >
          <p>© {new Date().getFullYear()} PostSpark. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/privacy" className="hover:text-white">Privacy</Link>
            <Link to="/terms" className="hover:text-white">Terms</Link>
            <Link to="/refunds" className="hover:text-white">Refunds</Link>
            <span style={{ color: "#6B6685" }}>·</span>
            <span>Payments by Paddle</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
