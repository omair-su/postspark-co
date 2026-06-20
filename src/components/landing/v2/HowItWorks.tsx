import { Fragment } from "react";
import { ArrowRight, ClipboardList, Zap, Rocket, CheckCircle2 } from "lucide-react";
import { LuxIconCard } from "./LuxIconCard";
import type { LucideIcon } from "lucide-react";

const STEPS: { n: string; icon: LucideIcon; title: string; body: string; color: string }[] = [
  { 
    n: "01", 
    icon: ClipboardList, 
    title: "Paste Your Content", 
    body: "Drop in your blog post, YouTube URL, podcast link, or PDF. PostSpark handles any format with ease.",
    color: "#7C3AED"
  },
  { 
    n: "02", 
    icon: Zap, 
    title: "Claude AI Generates", 
    body: "Our custom-tuned Claude engine analyzes your core ideas and generates platform-native versions in your exact voice.",
    color: "#A78BFA"
  },
  { 
    n: "03", 
    icon: Rocket, 
    title: "Publish & Dominate", 
    body: "Get 30+ ready-to-post pieces. One input becomes a full week of high-quality content across all platforms.",
    color: "#6D28D9"
  },
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
    <section id="how-it-works" className="relative py-24 sm:py-32 overflow-hidden" style={{ background: "#FFFFFF" }}>
      {/* Background Decorative Element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none opacity-[0.03]">
        <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(#7C3AED 2px, transparent 2px)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center text-center mb-20">
          <span
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em]"
            style={{
              background: "#F5F3FF",
              color: "#7C3AED",
              border: "1px solid rgba(124, 58, 237, 0.1)",
            }}
          >
            The Workflow
          </span>
          <h2
            className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl"
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
          >
            Three Steps to <span className="text-violet-600">Omnipresence</span>
          </h2>
        </div>

        <div className="grid items-stretch gap-8 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.n} className="group relative">
              <div
                className="h-full rounded-3xl p-8 transition-all duration-300 hover:-translate-y-2"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #F1F5F9",
                  boxShadow: "0 20px 50px -12px rgba(0,0,0,0.05)",
                }}
              >
                <div className="flex items-center justify-between mb-8">
                  <div 
                    className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg"
                    style={{ background: s.color }}
                  >
                    <s.icon size={24} />
                  </div>
                  <span className="text-5xl font-black opacity-[0.05] italic" style={{ color: s.color }}>{s.n}</span>
                </div>
                
                <h3 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
                  {s.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {s.body}
                </p>

                {i < STEPS.length - 1 && (
                  <div className="hidden absolute top-1/2 -right-6 -translate-y-1/2 z-10 lg:block">
                    <ArrowRight className="h-8 w-8 text-slate-200" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* This is the subsection the user mentioned in 7th screenshot, kept but refined as per instructions */}
        <div className="mt-32 rounded-[40px] p-8 sm:p-16 relative overflow-hidden" style={{ background: "#0F172A" }}>
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-violet-600/20 to-transparent pointer-events-none" />
          
          <div className="relative z-10 grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h3
                id="features"
                className="text-3xl font-bold text-white sm:text-4xl"
                style={{ fontFamily: "Inter, system-ui, sans-serif", lineHeight: 1.2 }}
              >
                Everything you need to <br />
                <span className="text-violet-400">ship content faster</span>
              </h3>
              <p className="mt-6 text-lg text-slate-400 max-w-md">
                A complete suite of AI tools designed for creators who value their time and brand quality.
              </p>
              <div className="mt-10">
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-violet-500 hover:scale-105"
                >
                  Get Started Free <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {FEATURES.map((f) => (
                <div
                  key={f}
                  className="flex items-center gap-3 rounded-2xl bg-white/5 p-4 text-sm font-medium text-slate-200 border border-white/10 backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/20"
                >
                  <CheckCircle2 size={16} className="text-violet-400 shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
