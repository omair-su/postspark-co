import { Link } from "@tanstack/react-router";
import { PostSparkLogo } from "@/components/PostSparkLogo";

const COL_PRODUCT = [
  { label: "Features", to: "/#features" },
  { label: "How It Works", to: "/#how-it-works" },
  { label: "Pricing", to: "/pricing" },
  { label: "Blog", to: "/blog" },
  { label: "Changelog", to: "/changelog" },
];

const COL_SOLUTIONS = [
  { label: "For Creators", to: "/for/creators" },
  { label: "For Agencies", to: "/for/agencies" },
  { label: "LinkedIn Ghostwriters", to: "/use-cases/linkedin-ghostwriters" },
  { label: "Podcast to Social", to: "/use-cases/podcast-to-social" },
  { label: "YouTube to LinkedIn", to: "/use-cases/youtube-to-linkedin" },
];

const COL_COMPARE = [
  { label: "PostSpark vs ChatGPT", to: "/alternatives/chatgpt-for-content-repurposing" },
  { label: "PostSpark vs Jasper", to: "/alternatives/jasper-vs-postspark" },
  { label: "PostSpark for Agencies", to: "/use-cases/content-repurposing-agencies" },
];

export function FooterV2() {
  return (
    <footer style={{ background: "#0F172A", color: "#E2E8F0" }} className="pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <PostSparkLogo variant="wordmark" size={28} />
            </div>
            <p className="mt-4 text-sm" style={{ color: "#94A3B8", lineHeight: 1.7 }}>
              AI content repurposing for creators and agencies.
            </p>
            <p className="mt-3 text-xs font-bold uppercase tracking-widest" style={{ color: "#A78BFA", letterSpacing: "0.1em" }}>
              ⚡ Powered by Claude AI
            </p>
            <a href="mailto:hello@postspark.co" className="mt-3 inline-block text-sm" style={{ color: "#E2E8F0" }}>
              hello@postspark.co
            </a>
          </div>

          {[
            { title: "Product", items: COL_PRODUCT },
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
                    <Link to={it.to} className="text-sm transition hover:text-white" style={{ color: "#94A3B8" }}>
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
          style={{ borderColor: "#1E293B", color: "#94A3B8" }}
        >
          <p>© {new Date().getFullYear()} PostSpark. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/privacy" className="hover:text-white">Privacy</Link>
            <Link to="/terms" className="hover:text-white">Terms</Link>
            <Link to="/refunds" className="hover:text-white">Refunds</Link>
            <span style={{ color: "#475569" }}>·</span>
            <span>Payments by Paddle</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
