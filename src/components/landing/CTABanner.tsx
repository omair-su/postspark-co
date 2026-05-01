import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { PostSparkLogo } from "@/components/PostSparkLogo";

export function CTABanner() {
  return (
    <section className="py-20 px-6">
      <div className="mx-auto max-w-4xl rounded-2xl gradient-hero p-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10">
          <div className="mx-auto mb-6 flex items-center justify-center">
            <PostSparkLogo variant="icon" size={64} />
          </div>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to 10x Your Content Output?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/80">
            Join thousands of creators who save hours every week with AI-powered content repurposing. Start free — no credit card required.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3 text-sm font-bold text-navy transition-all hover:bg-white/90"
            >
              Start Free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-8 py-3 text-sm font-medium text-white transition-all hover:bg-white/10"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
