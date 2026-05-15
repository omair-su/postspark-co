import { Link } from "@tanstack/react-router";
import { FileText, Wand2, Share2 } from "lucide-react";

const steps = [
  { step: "01", icon: FileText, title: "Paste Your Content", desc: "Drop in your blog post, article, video transcript, or YouTube link." },
  { step: "02", icon: Wand2, title: "Choose Formats", desc: "Select tweets, LinkedIn posts, email newsletters, video scripts — or all of them." },
  { step: "03", icon: Share2, title: "Get Results Instantly", desc: "AI generates polished, ready-to-publish content in seconds. Copy and share." },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative isolate overflow-hidden cream-surface py-24">
      <div className="cream-grain" aria-hidden />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-1/4 h-72 w-72 rounded-full opacity-40 blur-3xl lux-float"
        style={{ background: "radial-gradient(closest-side, rgba(124,58,237,0.3), transparent 70%)" }}
      />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center">
          <span className="luxury-chip">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7c3aed]" />
            Simple Process
          </span>
          <h2 className="mt-5 luxury-heading" style={{ fontSize: "clamp(1.9rem, 4.4vw, 3rem)", lineHeight: 1.05 }}>
            How It <span className="luxury-gradient-text">Works</span>
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-[#1a1a2e]/65">
            Three simple steps to turn any content into multiple formats.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {steps.map((s, i) => (
            <div
              key={i}
              className="luxury-card relative p-6 text-center animate-[heroRise_0.7s_ease-out_both]"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <div
                className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{
                  background: "linear-gradient(135deg, #1a1a2e 0%, #4c1d95 60%, #7c3aed 100%)",
                  boxShadow: "0 14px 30px -12px rgba(124,58,237,0.55)",
                }}
              >
                <s.icon className="h-6 w-6 text-white" />
              </div>
              <span className="mt-4 block text-[10px] font-bold uppercase tracking-[0.22em] text-[#7c3aed]/80">
                STEP {s.step}
              </span>
              <h3 className="mt-2 text-lg font-semibold luxury-heading">{s.title}</h3>
              <p className="mt-2 text-sm text-[#1a1a2e]/65 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 rounded-full bg-[#1a1a2e] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_20px_50px_-15px_rgba(26,26,46,0.5)] transition-all hover:scale-[1.02] hover:bg-[#2a2a4a]"
          >
            Start Repurposing for Free
          </Link>
        </div>
      </div>
      <style>{`@keyframes heroRise { from { opacity:0; transform: translate3d(0,16px,0);} to { opacity:1; transform: translate3d(0,0,0);} }`}</style>
    </section>
  );
}
