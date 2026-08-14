import { AI_MODELS, PUBLISH_PLATFORMS } from "@/lib/brandIcons";
import { PlatformLogo } from "./primitives";
import { delay } from "./parts";
import { ArrowRight } from "lucide-react";

const CREATOR_BRANDS = [
  "Creator Science",
  "The Hustle",
  "Indie Hackers",
  "Newsletter Op",
  "Podcast Lab",
  "Growth Memo",
  "Founders Weekly",
  "SaaS Marketer",
  "Studio Nine",
  "Reel Republic",
];

/** Section A — infinite auto-scrolling wordmark marquee. */
export function Lp4TrustStrip() {
  const row = [...CREATOR_BRANDS, ...CREATOR_BRANDS];
  return (
    <section className="px-0 py-10" style={{ background: "#F9FAFB", borderBottom: "1px solid #F3F4F6" }}>
      <p
        className="text-center"
        style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: "#9CA3AF" }}
      >
        Trusted by creators at
      </p>
      <div className="lp4-marquee-wrap lp4-marquee-mask relative mt-5 w-full overflow-hidden">
        <div className="animate-marquee-slow flex w-max items-center gap-14">
          {row.map((b, i) => (
            <span
              key={`${b}-${i}`}
              style={{
                fontSize: 19,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "#9CA3AF",
                whiteSpace: "nowrap",
                filter: "grayscale(1)",
              }}
            >
              {b}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Section B — AI model marquee with real logos + hover tooltip. */
export function Lp4ModelMarquee() {
  const row = [...AI_MODELS, ...AI_MODELS];
  return (
    <section
      className="overflow-hidden bg-white py-12"
      style={{ borderTop: "1px solid #E5E7EB", borderBottom: "1px solid #E5E7EB" }}
    >
      <p className="px-6 text-center" style={{ fontSize: 14, fontWeight: 600, color: "#0F0F1A" }}>
        Powered by the world's most advanced AI
      </p>
      <div className="lp4-marquee-wrap lp4-marquee-mask relative mt-6 w-full overflow-hidden">
        <div className="animate-marquee-slow flex w-max items-center gap-4">
          {row.map((m, i) => (
            <div
              key={`${m.name}-${i}`}
              className="group relative flex shrink-0 items-center gap-3 rounded-full py-2 pl-2 pr-5"
              style={{ border: "1px solid #EEF0F4", background: "#FCFCFD" }}
            >
              <span
                className="grid place-items-center rounded-full bg-white"
                style={{ width: 40, height: 40, border: "1px solid #F1F1F4" }}
              >
                <img
                  src={m.icon}
                  alt={`${m.name} logo`}
                  width={22}
                  height={22}
                  loading="lazy"
                  decoding="async"
                  style={{ width: 22, height: 22, objectFit: "contain" }}
                />
              </span>
              <span className="flex flex-col">
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0F0F1A", whiteSpace: "nowrap" }}>{m.name}</span>
                <span style={{ fontSize: 11, color: "#9CA3AF", whiteSpace: "nowrap" }}>{m.by}</span>
              </span>
              <span
                role="tooltip"
                className="pointer-events-none absolute left-1/2 top-full z-20 hidden -translate-x-1/2 translate-y-2 whitespace-nowrap rounded-lg px-3 py-2 group-hover:block"
                style={{ background: "#0F0F1A", color: "#fff", fontSize: 11, fontWeight: 500 }}
              >
                Used in PostSpark for: {m.use}
              </span>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-6 px-6 text-center" style={{ fontSize: 12, color: "#9CA3AF" }}>
        Best-in-class models, curated — you never wire up a single API key.
      </p>
    </section>
  );
}

/** Section C — publish directly to 9 platforms grid. */
export function Lp4PlatformGrid() {
  return (
    <section className="bg-white px-6 py-16 sm:py-[90px]">
      <div className="mx-auto max-w-[1000px]">
        <div className="text-center">
          <p className="lp4-label fade-in-up">Direct publishing</p>
          <h2
            className="fade-in-up mt-3"
            style={{ fontSize: "clamp(30px,4.6vw,44px)", fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.02em", ...delay(100) }}
          >
            Publish directly to <span className="lp4-grad-text">9 platforms</span> — in one click
          </h2>
          <p className="fade-in-up mx-auto mt-4 max-w-[560px]" style={{ fontSize: 17, color: "#6B7280", ...delay(150) }}>
            Connect once. Then schedule or post instantly from PostSpark — no copy-pasting, no extra scheduler.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {PUBLISH_PLATFORMS.map((p, i) => (
            <div
              key={p.key}
              className="lp4-card lp4-plat-card fade-in-up flex items-center gap-3.5 px-5 py-4"
              style={delay((i % 3) * 90)}
            >
              <PlatformLogo p={p} size={34} />
              <span className="min-w-0 flex-1">
                <span className="block truncate" style={{ fontSize: 14, fontWeight: 700, color: "#0F0F1A" }}>
                  {p.name}
                </span>
                <span
                  className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5"
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    background: p.status === "live" ? "#DCFCE7" : "#F3F4F6",
                    color: p.status === "live" ? "#16A34A" : "#6B7280",
                  }}
                >
                  {p.status === "live" ? "✓ Connected" : "Coming"}
                </span>
              </span>
              <ArrowRight className="lp4-fly h-4 w-4 shrink-0" style={{ color: "#7C3AED" }} aria-hidden />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
