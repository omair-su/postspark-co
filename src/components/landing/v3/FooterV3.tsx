import { Link } from "@tanstack/react-router";
import { PostSparkWordmark } from "./PostSparkMark";

const GROUPS: { title: string; links: [string, string][] }[] = [
  {
    title: "Studios",
    links: [
      ["Repurpose Studio", "/features/repurpose-blog-to-social"],
      ["Shorts Studio", "/tools/shorts-script-generator"],
      ["Image Studio", "/tools/ai-image-generator"],
      ["Carousel Generator", "/tools/blog-to-linkedin-carousel"],
      ["SEO Blog Writer", "/tools/youtube-to-blog"],
      ["Thumbnail Maker", "/tools/youtube-thumbnail-maker"],
    ],
  },
  {
    title: "Free tools",
    links: [
      ["AI Humanizer", "/tools/ai-humanizer"],
      ["Reply Generator", "/tools/reply-generator"],
      ["Hook Generator", "/tools/hook-generator"],
      ["LinkedIn Downloader", "/tools/linkedin-video-downloader"],
      ["YouTube → Thread", "/tools/youtube-to-twitter-thread"],
      ["Podcast → Newsletter", "/tools/podcast-to-newsletter"],
    ],
  },
  {
    title: "For",
    links: [
      ["Creators", "/for/creators"],
      ["Agencies", "/for/agencies"],
      ["Podcasters", "/for/podcasters"],
      ["YouTubers", "/for/youtubers"],
    ],
  },
  {
    title: "Compare",
    links: [
      ["vs Buffer", "/alternatives/buffer-vs-postspark"],
      ["vs Hootsuite", "/alternatives/hootsuite-vs-postspark"],
      ["vs Jasper", "/alternatives/jasper-vs-postspark"],
      ["vs Typefully", "/alternatives/typefully-vs-postspark"],
      ["vs Repurpose.io", "/alternatives/repurpose-io-vs-postspark"],
      ["vs ChatGPT", "/alternatives/chatgpt-for-content-repurposing"],
    ],
  },
  {
    title: "Company",
    links: [
      ["Pricing", "/pricing"],
      ["Blog", "/blog"],
      ["Changelog", "/changelog"],
      ["Roadmap", "/roadmap"],
      ["Founding lifetime", "/deals/lifetime"],
      ["Privacy", "/privacy"],
      ["Terms", "/terms"],
      ["Data deletion", "/data-deletion"],
    ],
  },
];

export function FooterV3() {
  return (
    <footer className="relative pt-20 pb-10 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-10 md:gap-8 md:grid-cols-12">
          <div className="md:col-span-3">
            <Link to="/" aria-label="PostSpark home">
              <PostSparkWordmark size={28} tone="light" />
            </Link>
            <p className="mt-4 text-sm max-w-xs" style={{ color: "rgba(250,250,249,0.55)" }}>
              The luxury content engine for creators and agencies. One source → 30+ pieces in your voice.
            </p>
            <Link
              to="/signup"
              className="lv3-cta mt-6 inline-flex rounded-full px-5 py-2.5 text-sm font-semibold"
            >
              Start free
            </Link>
          </div>
          <div className="md:col-span-9 grid grid-cols-2 md:grid-cols-5 gap-8">
            {GROUPS.map((g) => (
              <div key={g.title}>
                <div className="text-xs uppercase tracking-widest" style={{ color: "rgba(250,250,249,0.5)" }}>{g.title}</div>
                <ul className="mt-4 space-y-2.5">
                  {g.links.map(([label, to]) => (
                    <li key={to}>
                      <Link to={to} className="text-sm hover:text-white transition" style={{ color: "rgba(250,250,249,0.72)" }}>{label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-14 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs" style={{ borderColor: "rgba(255,255,255,0.06)", color: "rgba(250,250,249,0.5)" }}>
          <div>© {new Date().getFullYear()} PostSpark. Built for creators.</div>
          <div>Powered by Claude Sonnet 4.5 · GPT-Image-2 · Flux 1.1 Pro · Gemini 3</div>
        </div>
      </div>
    </footer>
  );
}
