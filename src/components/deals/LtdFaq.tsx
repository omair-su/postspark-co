import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "What does 'lifetime' actually mean?",
    a: "Forever. As long as PostSpark exists, your account stays on Pro features at no recurring charge. If we ever sunset PostSpark, we'll give 12 months of notice and a full migration path.",
  },
  {
    q: "Is this real Pro, or a stripped-down version?",
    a: "Full Pro. Unlimited repurposes, Brand Voice AI, Hook Lab, Image Studio, Carousel Generator, Shorts Studio, Build-in-Public, Brand Kit, Calendar, and every Pro feature we ship in the future.",
  },
  {
    q: "Are there any usage limits?",
    a: "Fair-use only — same as monthly Pro. You can generate hundreds of pieces per month with no throttling. We only step in if a single account is clearly abusing it (>5x our heaviest paying user).",
  },
  {
    q: "What happens to the price after 50 spots are claimed?",
    a: "It disappears. Pro stays at $24/mo and the next tier of founding access (if we ever open one) starts at $197+. The $97 price is a one-time launch deal to fund our first 6 months.",
  },
  {
    q: "Refunds?",
    a: "30-day no-questions-asked refund. Email refunds@postspark.co with your order ID and the money is back on your card within 5 business days.",
  },
  {
    q: "Can I transfer my lifetime account?",
    a: "Yes — once. Email us with the new account's email and we'll move it over. We do this to stop reseller abuse, not to make your life hard.",
  },
  {
    q: "I have a question that's not on this list.",
    a: "Email founders@postspark.co. Real humans, real reply within 24h on weekdays.",
  },
];

export function LtdFaq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-3">
      {FAQS.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className="rounded-xl border border-[#E5E7EB] bg-white">
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="text-sm font-semibold text-[#1A1A2E]">{f.q}</span>
              <ChevronDown className={`h-4 w-4 text-[#6B7280] transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>
            {isOpen && <div className="px-5 pb-4 text-sm leading-relaxed text-[#6B7280]">{f.a}</div>}
          </div>
        );
      })}
    </div>
  );
}
