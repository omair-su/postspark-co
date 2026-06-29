import iconMic from "@/assets/landing-v3/icon-mic.png";
import iconBrain from "@/assets/landing-v3/icon-brain.png";
import iconStack from "@/assets/landing-v3/icon-stack.png";

const STEPS = [
  {
    icon: iconMic,
    n: "01",
    title: "Drop your source",
    body: "Paste a YouTube link, upload a podcast MP3, or import a blog post. PostSpark handles transcripts automatically.",
  },
  {
    icon: iconBrain,
    n: "02",
    title: "AI repurposes in your voice",
    body: "Claude Sonnet 4.5 — tuned to your Brand Voice — spins 30+ platform-native pieces with hooks that actually work.",
  },
  {
    icon: iconStack,
    n: "03",
    title: "Approve. Schedule. Publish.",
    body: "One tap to send to TikTok, YouTube, LinkedIn or X. Save edits to your library and keep the calendar full.",
  },
];

export function HowItWorksV3() {
  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <p className="lv3-chip">How it works</p>
          <h2 className="mt-4 font-display-lux" style={{ fontSize: "clamp(36px, 5vw, 64px)", lineHeight: 1.05, color: "#FAFAF9" }}>
            From idea to inbox in <em className="lv3-text-gradient" style={{ fontStyle: "italic" }}>three steps.</em>
          </h2>
        </div>

        <div className="relative mt-16">
          {/* connecting line */}
          <div aria-hidden className="hidden md:block absolute top-24 left-[12%] right-[12%] h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.5), rgba(6,182,212,0.5), transparent)" }} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {STEPS.map((s) => (
              <div key={s.n} className="relative rounded-3xl p-7 lv3-glass lv3-gradient-border text-center">
                <div className="flex justify-center">
                  <img
                    src={s.icon}
                    alt=""
                    loading="lazy"
                    width={140}
                    height={140}
                    className="lv3-float h-28 w-28 object-contain"
                    style={{ filter: "drop-shadow(0 20px 40px rgba(124,58,237,0.4))" }}
                  />
                </div>
                <div className="mt-4 font-display-lux text-sm tracking-widest" style={{ color: "rgba(167,139,250,0.9)" }}>
                  {s.n}
                </div>
                <h3 className="mt-2 font-display-lux" style={{ fontSize: 28, lineHeight: 1.1, color: "#FAFAF9" }}>
                  {s.title}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed" style={{ color: "rgba(250,250,249,0.65)" }}>
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
