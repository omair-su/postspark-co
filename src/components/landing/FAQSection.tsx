import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "What types of content can I repurpose?",
    a: "You can paste any text — blog posts, articles, newsletters, transcripts, notes — or provide a YouTube URL. PostSpark transforms it into tweets, LinkedIn posts, Instagram captions, email newsletters, video scripts, TikTok scripts, podcast notes, X threads, and more.",
  },
  {
    q: "How does the free plan work?",
    a: "Free accounts get 3 AI-powered repurposes per month. Each repurpose can generate multiple output formats simultaneously. Upgrade to Pro for unlimited repurposes.",
  },
  {
    q: "Can I customize the tone and style?",
    a: "Yes! Choose from Professional, Casual, Humorous, Inspirational, or Educational tones. You can also add custom instructions like 'Write like Gary Vee' or 'Include emojis' for fully personalized output.",
  },
  {
    q: "What is the Templates feature?",
    a: "Templates let you save your favorite tone + format combinations for one-click reuse. Create a template like 'Casual Social Media' with your preferred formats and instructions, then apply it instantly every time.",
  },
  {
    q: "Can I export my generated content?",
    a: "Absolutely! Export individual outputs or your entire history as PDF. You can also bulk-select items and export them as CSV for spreadsheet analysis.",
  },
  {
    q: "Is my content private and secure?",
    a: "Yes. All your content is stored securely and only accessible to your account. We use industry-standard encryption and never share your data with third parties.",
  },
];

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-20 px-6 bg-background">
      <div className="mx-auto max-w-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            Frequently Asked <span className="text-gradient">Questions</span>
          </h2>
          <p className="mt-4 text-muted-foreground">Everything you need to know about PostSpark.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <span className="text-sm font-semibold text-foreground pr-4">{faq.q}</span>
                <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open === i ? "rotate-180" : ""}`} />
              </button>
              {open === i && (
                <div className="px-5 pb-4 animate-fade-in">
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
