import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { track } from "@/lib/analytics";

export function FoundingMember() {
  return (
    <section style={{ background: "#FFFFFF" }} className="py-20">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2
          className="text-3xl sm:text-4xl"
          style={{ color: "#0F172A", fontFamily: "Inter, system-ui, -apple-system, sans-serif", fontWeight: 700, lineHeight: 1.1 }}
        >
          Be Among Our First Power Users
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base" style={{ color: "#64748B", lineHeight: 1.7 }}>
          PostSpark is newly launched and growing. We're offering founding member
          pricing to our first 100 Pro subscribers — locked in forever at $19/month
          even as we raise prices.
        </p>

        <div
          className="mx-auto mt-10 rounded-3xl p-12"
          style={{ background: "#F5F3FF", border: "1px solid #DDD6FE" }}
        >
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest"
            style={{ background: "#FFFFFF", color: "#7C3AED", letterSpacing: "0.1em" }}
          >
            🏆 Founding Member Offer
          </div>
          <h3
            className="mx-auto mt-5 max-w-md text-2xl sm:text-[28px]"
            style={{ color: "#0F172A", fontFamily: "Inter, system-ui, -apple-system, sans-serif", fontWeight: 700, lineHeight: 1.2 }}
          >
            First 100 Pro subscribers get $19/month locked forever
          </h3>
          <p className="mx-auto mt-4 max-w-md text-sm" style={{ color: "#64748B", lineHeight: 1.7 }}>
            Prices will increase as we grow. Join now and lock in founding member
            pricing permanently.
          </p>
          <Link
            to="/signup"
            onClick={() => track("cta_click", { from: "founding_member" })}
            className="mt-7 inline-flex items-center justify-center gap-2 rounded-lg px-7 py-3.5 text-sm font-bold text-white transition"
            style={{ background: "#7C3AED", boxShadow: "0 4px 14px rgba(124,58,237,0.3)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#6D28D9")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#7C3AED")}
          >
            Claim Founding Member Pricing <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
