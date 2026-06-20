import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { track } from "@/lib/analytics";

export function FinalCTA() {
  return (
    <section style={{ background: "#4C1D95" }} className="py-24">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2
          className="text-3xl sm:text-4xl md:text-[48px]"
          style={{ color: "#FFFFFF", fontFamily: "Inter, system-ui, -apple-system, sans-serif", fontWeight: 700, lineHeight: 1.1 }}
        >
          Your best content deserves more than one platform.
        </h2>
        <p
          className="mx-auto mt-6 max-w-xl text-base"
          style={{ color: "rgba(255,255,255,0.8)", lineHeight: 1.7 }}
        >
          Join PostSpark free. No credit card. 3 repurposes every month. See what
          Claude AI does with your best ideas.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/signup"
            onClick={() => track("cta_click", { from: "final_cta_primary" })}
            className="inline-flex items-center justify-center gap-2 rounded-lg px-7 py-3.5 text-sm font-bold transition"
            style={{ background: "#FFFFFF", color: "#7C3AED" }}
          >
            Start Free Today <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/pricing"
            onClick={() => track("cta_click", { from: "final_cta_secondary" })}
            className="inline-flex items-center justify-center gap-2 rounded-lg px-7 py-3.5 text-sm font-bold transition"
            style={{ border: "2px solid #FFFFFF", color: "#FFFFFF", background: "transparent" }}
          >
            See Pricing
          </Link>
        </div>
      </div>
    </section>
  );
}
