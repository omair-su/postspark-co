import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden gradient-hero pt-32 pb-20 sm:pt-40 sm:pb-28">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-electric blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-electric blur-[150px]" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6 animate-fade-in">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
          <span className="text-xs font-medium text-primary-foreground">AI-Powered Content Repurposing</span>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-primary-foreground sm:text-6xl lg:text-7xl">
          Turn 1 Piece of Content
          <br />
          <span className="text-gradient">Into 30 — Instantly</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base text-primary-foreground/70 sm:text-lg">
          PostSpark uses AI to repurpose your blog posts, YouTube videos, and PDFs into tweets, LinkedIn posts, email newsletters, and video scripts in seconds.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-primary-foreground px-6 py-3 text-sm font-semibold text-navy transition-all hover:opacity-90 shadow-lg"
          >
            Try PostSpark Free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
