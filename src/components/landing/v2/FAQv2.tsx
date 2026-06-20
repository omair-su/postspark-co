import { useState } from "react";
import { Plus, Minus, HelpCircle } from "lucide-react";

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
    <section id="faq" className="py-24 sm:py-32 relative overflow-hidden" style={{ background: "#FFFFFF" }}>
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="flex flex-col items-center text-center mb-16">
          <span
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em]"
            style={{
              background: "#F5F3FF",
              color: "#7C3AED",
              border: "1px solid rgba(124, 58, 237, 0.1)",
            }}
          >
            Support
          </span>
          <h2
            className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl"
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
          >
            Questions Before <span className="text-violet-600">You Start</span>
          </h2>
        </div>

        <div className="mt-10 space-y-4">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div
                key={f.q}
                className={`rounded-2xl transition-all duration-300 ${
                  isOpen 
                    ? 'bg-white border-2 border-violet-100 shadow-xl shadow-violet-100/50' 
                    : 'bg-slate-50 border border-slate-200 hover:border-slate-300'
                }`}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${isOpen ? 'bg-violet-600 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>
                      <HelpCircle size={18} />
                    </div>
                    <span className="text-base font-bold text-slate-900" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
                      {f.q}
                    </span>
                  </div>
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${isOpen ? 'bg-violet-100 text-violet-600 rotate-180' : 'bg-slate-200 text-slate-500'}`}>
                    {isOpen ? <Minus size={14} strokeWidth={3} /> : <Plus size={14} strokeWidth={3} />}
                  </div>
                </button>
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-6 pb-6 pt-0 text-sm sm:text-base text-slate-600 leading-relaxed ml-12">
                    {f.a}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-sm text-slate-500">
            Still have questions? <Link to="/blog" className="font-bold text-violet-600 hover:underline">Visit our help center</Link> or <Link to="/signup" className="font-bold text-violet-600 hover:underline">chat with support</Link>.
          </p>
        </div>
      </div>
    </section>
  );
}

export const FAQ_LIST = FAQS;
