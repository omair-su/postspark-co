import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Is there really a free plan? What's the catch?",
    a: "Yes — 10 free repurposes every month, no credit card required. The catch is fair: heavy users on Pro fund the free tier. If 10 isn't enough, upgrade to Pro ($19/mo) for unlimited.",
  },
  {
    q: "Can I cancel anytime? What if I'm not satisfied?",
    a: "Cancel any time from Settings in one click — and we offer a 30-day money-back guarantee. If PostSpark doesn't save you hours in the first month, email us for a full refund, no questions asked.",
  },
  {
    q: "Will the output actually sound like me, not generic AI?",
    a: "Yes. Pro and Agency users train PostSpark on writing samples + a Brand Kit (logo, colors, tone). Generations match your voice — so closely your audience won't notice the difference.",
  },
  {
    q: "How is PostSpark different from ChatGPT or other AI tools?",
    a: "ChatGPT is a blank prompt. PostSpark is a full content engine: brand voice training, image studio, podcast → posts, SEO blog writer, content calendar, agency client approvals, and more — all in one workflow built for creators and agencies.",
  },
  {
    q: "Do you offer team seats and white-label for agencies?",
    a: "Yes — the Agency plan ($49/mo) includes 5 team seats, multi-brand workspaces, white-label client approval links, and agency-wide analytics. Built specifically for content agencies managing multiple clients.",
  },
];

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="relative isolate overflow-hidden cream-surface py-24 px-6">
      <div className="cream-grain" aria-hidden />
      <div className="relative mx-auto max-w-3xl">
        <div className="text-center mb-12">
          <span className="luxury-chip">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7c3aed]" />
            FAQ
          </span>
          <h2 className="mt-5 luxury-heading" style={{ fontSize: "clamp(1.9rem, 4.4vw, 3rem)", lineHeight: 1.05 }}>
            Frequently Asked <span className="luxury-gradient-text">Questions</span>
          </h2>
          <p className="mt-4 text-[#1a1a2e]/75">The 5 things buyers ask before signing up.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="luxury-card overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <span className="text-sm font-semibold luxury-heading pr-4">{faq.q}</span>
                <ChevronDown className={`h-4 w-4 shrink-0 text-[#7c3aed] transition-transform duration-200 ${open === i ? "rotate-180" : ""}`} />
              </button>
              {open === i && (
                <div className="px-5 pb-4 animate-fade-in">
                  <p className="text-sm text-[#1a1a2e]/70 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
