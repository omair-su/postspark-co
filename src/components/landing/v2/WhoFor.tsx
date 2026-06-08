import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

const CARDS = [
  {
    icon: "✍️",
    title: "Solo Content Creators",
    body: "You have great ideas but spend more time reformatting than creating. PostSpark turns your best content into a week of posts in minutes.",
    cta: "For Creators",
    href: "/for/creators",
  },
  {
    icon: "💼",
    title: "LinkedIn Ghostwriters",
    body: "Managing 5+ clients means 5x the reformatting work. PostSpark cuts production time by 80% while keeping every client's voice intact.",
    cta: "For Ghostwriters",
    href: "/use-cases/linkedin-ghostwriters",
  },
  {
    icon: "🏢",
    title: "Content Agencies",
    body: "Delivering content across platforms for multiple clients is your biggest bottleneck. PostSpark handles repurposing so your team focuses on strategy.",
    cta: "For Agencies",
    href: "/for/agencies",
  },
  {
    icon: "🎙️",
    title: "Podcasters & YouTubers",
    body: "Your best content is locked inside long-form audio and video. PostSpark extracts tweets, posts, and newsletters from every episode.",
    cta: "For Podcasters",
    href: "/use-cases/podcast-to-social",
  },
] as const;

export function WhoFor() {
  return (
    <section style={{ background: "#F8FAFC" }} className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#7C3AED", letterSpacing: "0.1em" }}>
          Built for
        </p>
        <h2
          className="mt-3 text-3xl sm:text-4xl md:text-[40px]"
          style={{ color: "#0F172A", fontFamily: "Syne, Inter, system-ui, -apple-system, sans-serif", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.1 }}
        >
          One Tool. Every Creator.
        </h2>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {CARDS.map((c) => (
            <Link
              key={c.title}
              to={c.href}
              className="group block rounded-2xl p-7 transition"
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
              }}
            >
              <div className="text-3xl">{c.icon}</div>
              <h3 className="mt-4 text-xl font-bold" style={{ color: "#0F172A", fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}>
                {c.title}
              </h3>
              <p className="mt-2 text-sm" style={{ color: "#64748B", lineHeight: 1.7 }}>
                {c.body}
              </p>
              <span
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold"
                style={{ color: "#7C3AED" }}
              >
                {c.cta} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
