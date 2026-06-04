import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const FAQS = [
  {
    q: "Is there really a free plan?",
    a: "Yes — 10 free repurposes every month with no credit card required. When you hit your limit, upgrade to Pro for unlimited access.",
  },
  {
    q: "Will content sound like me or like generic AI?",
    a: "PostSpark uses Claude AI — one of the most advanced language models available. With Brand Voice training, it learns from your writing samples and generates content that matches your specific tone, style, and vocabulary.",
  },
  {
    q: "How is this different from just using ChatGPT?",
    a: "ChatGPT requires you to craft prompts, manage outputs, format for each platform, and do everything manually. PostSpark has pre-built workflows for every content format, brand voice memory, and generates 30 pieces from one input in one click.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel with one click from your account settings. No questions asked. You keep access until the end of your billing period. 30-day money-back guarantee.",
  },
  {
    q: "Do you offer agency features?",
    a: "Yes — the Agency plan includes 5 team seats, multi-brand workspaces, client approval links, white-label review pages, and agency analytics.",
  },
];

export function FAQv2() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section style={{ background: "#FFFFFF" }} className="py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2
          className="text-center text-3xl sm:text-4xl md:text-[40px]"
          style={{ color: "#0F172A", fontFamily: "Syne, Inter, sans-serif", fontWeight: 800, lineHeight: 1.1 }}
        >
          Questions Before You Start
        </h2>
        <div className="mt-10 space-y-3">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div
                key={f.q}
                className="rounded-xl"
                style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-base font-bold" style={{ color: "#0F172A", fontFamily: "Syne, Inter, sans-serif" }}>
                    {f.q}
                  </span>
                  {isOpen ? (
                    <Minus className="h-5 w-5 shrink-0" style={{ color: "#7C3AED" }} />
                  ) : (
                    <Plus className="h-5 w-5 shrink-0" style={{ color: "#7C3AED" }} />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-sm" style={{ color: "#64748B", lineHeight: 1.7 }}>
                    {f.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export const FAQ_LIST = FAQS;
