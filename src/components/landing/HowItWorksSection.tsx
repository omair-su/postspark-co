import { Link } from "@tanstack/react-router";
import { FileText, Wand2, Share2 } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: FileText,
    title: "Paste Your Content",
    desc: "Drop in your blog post, article, video transcript, or YouTube link.",
  },
  {
    step: "02",
    icon: Wand2,
    title: "Choose Formats",
    desc: "Select tweets, LinkedIn posts, email newsletters, video scripts — or all of them.",
  },
  {
    step: "03",
    icon: Share2,
    title: "Get Results Instantly",
    desc: "AI generates polished, ready-to-publish content in seconds. Copy and share.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 bg-surface">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center">
          <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            Simple Process
          </span>
          <h2 className="mt-4 text-3xl font-bold text-foreground sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Three simple steps to turn any content into multiple formats.
          </p>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-3">
          {steps.map((s, i) => (
            <div key={i} className="relative text-center animate-fade-in" style={{ animationDelay: `${i * 150}ms` }}>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl gradient-electric shadow-lg">
                <s.icon className="h-7 w-7 text-primary-foreground" />
              </div>
              <span className="mt-4 block text-xs font-bold text-primary/60 tracking-widest">
                STEP {s.step}
              </span>
              <h3 className="mt-2 text-lg font-bold text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>

              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden sm:block absolute top-8 left-[calc(50%+40px)] w-[calc(100%-80px)] h-0.5 bg-border" />
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 rounded-lg gradient-electric px-6 py-3 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 glow-electric"
          >
            Start Repurposing for Free
          </Link>
        </div>
      </div>
    </section>
  );
}
