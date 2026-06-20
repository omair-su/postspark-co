import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import { track } from "@/lib/analytics";

export function FinalCTA() {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden" style={{ background: "#0F172A" }}>
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-600/10 blur-[120px] rounded-full" />
      
      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6">
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] bg-white/5 text-violet-400 border border-white/10 backdrop-blur-sm">
            <Sparkles size={12} /> Ready to scale?
          </div>
        </div>
        
        <h2
          className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-8"
          style={{ fontFamily: "Inter, system-ui, -apple-system, sans-serif", lineHeight: 1.1 }}
        >
          Your best content deserves <br />
          <span className="text-violet-400 text-gradient">more than one platform.</span>
        </h2>
        
        <p
          className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl text-slate-400 leading-relaxed"
        >
          Join 12,000+ creators who use PostSpark to turn their best ideas into platform-native viral content. Start free, no credit card required.
        </p>
        
        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/signup"
            onClick={() => track("cta_click", { from: "final_cta_primary" })}
            className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-violet-600 px-10 py-5 text-lg font-bold text-white transition-all hover:bg-violet-500 hover:scale-105 active:scale-95 shadow-2xl shadow-violet-600/20"
          >
            Start Your Free Trial <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            to="/#pricing"
            onClick={() => track("cta_click", { from: "final_cta_secondary" })}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-white/10 bg-white/5 px-10 py-5 text-lg font-bold text-white backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/20"
          >
            View Pricing
          </Link>
        </div>
        
        <p className="mt-8 text-sm font-medium text-slate-500">
          3 free repurposes every month · No credit card required · Cancel anytime
        </p>
      </div>
    </section>
  );
}
