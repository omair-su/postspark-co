import { useState } from "react";
import { Plus, Minus } from "lucide-react";

export const FAQ_V3 = [
  { q: "How is PostSpark different from ChatGPT?", a: "ChatGPT gives you raw text. PostSpark turns one source — video, podcast, blog — into 30+ platform-ready posts, shorts and threads, written in your voice, sized for each channel, with hooks and hashtags ready to publish." },
  { q: "Do I need to write prompts?", a: "No. Paste a YouTube link or upload a file. PostSpark handles the rest. Power users can fine-tune with Brand Voice and saved presets." },
  { q: "How is the output 'in my voice'?", a: "Upload 5 of your posts once. PostSpark studies your tone, vocabulary, structure, and cadence — and applies it to every generation." },
  { q: "What platforms do you publish to?", a: "TikTok, YouTube, LinkedIn, X, Threads, Instagram. More coming. Or copy-paste anywhere with one click." },
  { q: "What if I cancel?", a: "Cancel anytime in one click. You keep access until the end of your billing period. No questions, no emails." },
];

export function FAQV3() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <div className="text-center">
          <p className="lv3-chip">FAQ</p>
          <h2 className="mt-4 font-display-lux" style={{ fontSize: "clamp(36px, 5vw, 56px)", lineHeight: 1.05, color: "#FAFAF9" }}>
            Common <em className="lv3-text-gradient" style={{ fontStyle: "italic" }}>questions.</em>
          </h2>
        </div>
        <div className="mt-12 space-y-3">
          {FAQ_V3.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={i} className="rounded-2xl lv3-glass lv3-gradient-border overflow-hidden">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 p-5 sm:p-6 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-display-lux text-lg sm:text-xl" style={{ color: "#FAFAF9" }}>{f.q}</span>
                  <span className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)", color: "#FAFAF9" }}>
                    {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 text-[15px] leading-relaxed" style={{ color: "rgba(250,250,249,0.72)" }}>
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
