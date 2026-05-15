import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  { q: "What types of content can I repurpose?", a: "You can paste any text — blog posts, articles, newsletters, transcripts, notes — or provide a YouTube URL. PostSpark transforms it into tweets, LinkedIn posts, Instagram captions, email newsletters, video scripts, TikTok scripts, podcast notes, X threads, and more." },
  { q: "How does the free plan work?", a: "Free accounts get 10 AI-powered repurposes per month. Each repurpose can generate multiple output formats simultaneously. Upgrade to Pro for unlimited repurposes." },
  { q: "Can I customize the tone and style?", a: "Yes! Choose from Professional, Casual, Humorous, Inspirational, or Educational tones. You can also add custom instructions like 'Write like Gary Vee' or 'Include emojis' for fully personalized output." },
  { q: "What is the Templates feature?", a: "Templates let you save your favorite tone + format combinations for one-click reuse." },
  { q: "Can I export my generated content?", a: "Absolutely! Export individual outputs or your entire history as PDF or CSV." },
  { q: "Is my content private and secure?", a: "Yes. All your content is stored securely and only accessible to your account." },
];

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

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
          <p className="mt-4 text-[#1a1a2e]/65">Everything you need to know about PostSpark.</p>
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
