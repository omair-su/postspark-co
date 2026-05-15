import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { PostSparkLogo } from "@/components/PostSparkLogo";

export function CTABanner() {
  return (
    <section className="relative isolate overflow-hidden cream-surface-alt py-20 px-6">
      <div className="cream-grain" aria-hidden />
      <div
        className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl p-12 text-center"
        style={{
          background: "linear-gradient(135deg, #1a1a2e 0%, #2d1b5e 55%, #4c1d95 100%)",
          boxShadow: "0 40px 100px -30px rgba(124,58,237,0.6)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(closest-side, rgba(232,93,58,0.55), transparent 70%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(closest-side, rgba(167,139,250,0.55), transparent 70%)" }}
        />
        <div className="relative z-10">
          <div className="mx-auto mb-6 flex items-center justify-center">
            <PostSparkLogo variant="icon" size={64} />
          </div>
          <h2 className="text-3xl font-bold text-white sm:text-4xl" style={{ fontFamily: "'Instrument Serif', serif", letterSpacing: "-0.02em" }}>
            Ready to 10× your content output?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/75">
            Join thousands of creators who save hours every week with AI-powered content repurposing. Start free — no credit card required.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-[#1a1a2e] transition-all hover:scale-[1.02]"
            >
              Start Free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-7 py-3.5 text-sm font-medium text-white backdrop-blur-md transition-all hover:bg-white/10"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
