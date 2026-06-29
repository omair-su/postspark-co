import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export function FinalCTAV3() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <div className="relative overflow-hidden rounded-[36px] p-10 sm:p-16 text-center lv3-glass-strong lv3-gradient-border">
          <div aria-hidden className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(60% 60% at 50% 0%, rgba(124,58,237,0.4) 0%, transparent 70%), radial-gradient(50% 50% at 50% 100%, rgba(6,182,212,0.3) 0%, transparent 70%)" }} />

          <h2 className="relative font-display-lux" style={{ fontSize: "clamp(40px, 6vw, 80px)", lineHeight: 1.02, color: "#FAFAF9" }}>
            Stop rewriting. <em className="lv3-text-gradient" style={{ fontStyle: "italic" }}>Start shipping.</em>
          </h2>
          <p className="relative mt-5 mx-auto max-w-xl text-base sm:text-lg" style={{ color: "rgba(250,250,249,0.7)" }}>
            Join 2,400+ creators turning a single source into a month of content.
            Free forever. Upgrade when it pays for itself.
          </p>
          <div className="relative mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/signup"
              className="lv3-cta inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-[15px] font-semibold w-full sm:w-auto"
            >
              Start free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/pricing"
              className="lv3-cta-ghost inline-flex items-center justify-center gap-2 rounded-full px-7 py-4 text-[15px] font-medium w-full sm:w-auto"
            >
              See pricing
            </Link>
          </div>
          <p className="relative mt-5 text-xs" style={{ color: "rgba(250,250,249,0.5)" }}>
            No card · 3 free repurposes / month · Pro from $19
          </p>
        </div>
      </div>
    </section>
  );
}
