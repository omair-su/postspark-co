import { Fragment } from "react";
import { ArrowRight } from "lucide-react";

const STEPS = [
  { n: "01", icon: "📋", title: "Paste Your Content", body: "Drop in your blog post, YouTube URL, podcast link, or PDF. PostSpark handles any format." },
  { n: "02", icon: "⚡", title: "Claude AI Generates", body: "Our Claude AI engine analyzes your content and generates platform-native versions in your exact brand voice." },
  { n: "03", icon: "🚀", title: "Copy and Publish", body: "Get 30+ ready-to-post pieces. Copy individually or export all. From one input to a full content week." },
];

const FEATURES = [
  "🐦 Tweets & Threads",
  "💼 LinkedIn Posts",
  "📧 Email Newsletters",
  "🎬 Video Scripts",
  "📸 Instagram Captions",
  "🎤 Podcast Show Notes",
  "🔥 Viral Hook Lab",
  "🧠 Brand Voice AI",
  "🖼️ AI Image Studio",
  "📊 SEO Blog Writer",
  "🤖 Spark Copilot",
  "📅 Content Calendar",
];

export function HowItWorks() {
  return (
    <section id="how-it-works" style={{ background: "#FFFFFF" }} className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#7C3AED", letterSpacing: "0.1em" }}>
          How it works
        </p>
        <h2
          className="mt-3 text-3xl sm:text-4xl md:text-[44px]"
          style={{ color: "#0F172A", fontFamily: "Syne, Inter, system-ui, -apple-system, sans-serif", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.1 }}
        >
          Three Steps to 30 Pieces of Content
        </h2>

        <div className="mt-12 grid items-stretch gap-6 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
          {STEPS.map((s, i) => (
            <Fragment key={s.n}>
              <div
                className="rounded-2xl p-6"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="rounded-md px-2 py-0.5 text-xs font-bold"
                    style={{ background: "#F5F3FF", color: "#7C3AED" }}
                  >
                    {s.n}
                  </span>
                  <span className="text-2xl">{s.icon}</span>
                </div>
                <h3 className="mt-4 text-lg font-bold" style={{ color: "#0F172A", fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}>
                  {s.title}
                </h3>
                <p className="mt-2 text-sm" style={{ color: "#64748B", lineHeight: 1.7 }}>
                  {s.body}
                </p>
              </div>
              {i < STEPS.length - 1 && (
                <div className="hidden items-center justify-center md:flex">
                  <ArrowRight className="h-6 w-6" style={{ color: "#A78BFA" }} />
                </div>
              )}
            </Fragment>
          ))}
        </div>

        <div className="mt-16">
          <h3
            id="features"
            className="text-2xl"
            style={{ color: "#0F172A", fontFamily: "Syne, Inter, system-ui, -apple-system, sans-serif", fontWeight: 800, letterSpacing: "-0.025em" }}
          >
            Everything you need to ship content faster
          </h3>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f}
                className="rounded-xl px-4 py-3 text-sm font-semibold transition"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  color: "#0F172A",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#A78BFA";
                  e.currentTarget.style.background = "#F5F3FF";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#E2E8F0";
                  e.currentTarget.style.background = "#FFFFFF";
                }}
              >
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
