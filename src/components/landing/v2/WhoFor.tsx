import { Link } from "@tanstack/react-router";
import { ArrowRight, PenLine, Briefcase, Building2, Mic } from "lucide-react";
import { LuxIconCard } from "./LuxIconCard";

const CARDS = [
  {
    icon: PenLine,
    title: "Solo Content Creators",
    body: "You have great ideas but spend more time reformatting than creating. PostSpark turns your best content into a week of posts in minutes.",
    cta: "For Creators",
    href: "/for/creators",
  },
  {
    icon: Briefcase,
    title: "LinkedIn Ghostwriters",
    body: "Managing 5+ clients means 5x the reformatting work. PostSpark cuts production time by 80% while keeping every client's voice intact.",
    cta: "For Ghostwriters",
    href: "/use-cases/linkedin-ghostwriters",
  },
  {
    icon: Building2,
    title: "Content Agencies",
    body: "Delivering content across platforms for multiple clients is your biggest bottleneck. PostSpark handles repurposing so your team focuses on strategy.",
    cta: "For Agencies",
    href: "/for/agencies",
  },
  {
    icon: Mic,
    title: "Podcasters & YouTubers",
    body: "Your best content is locked inside long-form audio and video. PostSpark extracts tweets, posts, and newsletters from every episode.",
    cta: "For Podcasters",
    href: "/use-cases/podcast-to-social",
  },
] as const;

export function WhoFor() {
  return (
    <section className="py-24 sm:py-32 relative overflow-hidden" style={{ background: "#F8FAFC" }}>
      {/* Top border gradient */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center text-center mb-16">
          <span
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em]"
            style={{
              background: "#FFFFFF",
              color: "#7C3AED",
              border: "1px solid rgba(124, 58, 237, 0.1)",
              boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
            }}
          >
            Built for
          </span>
          <h2
            className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl"
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
          >
            One Tool. <span className="text-violet-600">Every Creator.</span>
          </h2>
          <p className="mt-6 max-w-2xl text-lg text-slate-600">
            Whether you're a solo creator or a high-volume agency, PostSpark scales with your ambition.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:gap-8">
          {CARDS.map((c) => (
            <Link
              key={c.title}
              to={c.href}
              className="group relative block rounded-[32px] p-8 transition-all duration-300 hover:-translate-y-1"
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                boxShadow: "0 10px 30px -10px rgba(0,0,0,0.04)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#C4B5FD";
                e.currentTarget.style.boxShadow = "0 25px 50px -12px rgba(124, 58, 237, 0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#E2E8F0";
                e.currentTarget.style.boxShadow = "0 10px 30px -10px rgba(0,0,0,0.04)";
              }}
            >
              <div className="flex items-start justify-between">
                <LuxIconCard icon={c.icon} size={64} />
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-colors group-hover:bg-violet-50 group-hover:text-violet-600">
                  <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                </div>
              </div>
              
              <h3 className="mt-8 text-2xl font-bold text-slate-900" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
                {c.title}
              </h3>
              <p className="mt-4 text-base text-slate-600 leading-relaxed">
                {c.body}
              </p>
              
              <div className="mt-8 flex items-center gap-2">
                <span className="text-sm font-bold text-violet-600 uppercase tracking-wider">
                  {c.cta}
                </span>
                <div className="h-px flex-1 bg-slate-100 transition-colors group-hover:bg-violet-100" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
