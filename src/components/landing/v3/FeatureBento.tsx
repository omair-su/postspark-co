import iconStack from "@/assets/landing-v3/icon-stack.png";
import iconBolt from "@/assets/landing-v3/icon-bolt.png";
import iconBrain from "@/assets/landing-v3/icon-brain.png";
import iconMic from "@/assets/landing-v3/icon-mic.png";
import iconVideo from "@/assets/landing-v3/icon-video.png";
import iconCalendar from "@/assets/landing-v3/icon-calendar.png";

const TILES = [
  {
    icon: iconBrain,
    title: "Trained on your voice",
    body: "Upload 5 posts. PostSpark learns your tone, cadence, and quirks — every output sounds like you wrote it.",
    span: "md:col-span-2 md:row-span-2",
    accent: "Brand Voice",
  },
  {
    icon: iconBolt,
    title: "60-second repurpose",
    body: "Paste a YouTube link. Get 30+ platform-ready pieces before your coffee cools.",
    span: "md:col-span-2",
    accent: "Speed",
  },
  {
    icon: iconVideo,
    title: "Shorts Studio",
    body: "Auto-generate vertical scripts, B-roll, voiceover and captions for TikTok, Reels, Shorts.",
    span: "md:col-span-2",
    accent: "Video",
  },
  {
    icon: iconStack,
    title: "Every platform, native",
    body: "X, LinkedIn, Instagram, Threads, newsletters, blog. Length and format tuned per channel.",
    span: "md:col-span-2",
    accent: "Distribution",
  },
  {
    icon: iconMic,
    title: "Podcast → posts",
    body: "Upload an MP3. Get show notes, timestamps, viral quotes, and 20 social posts.",
    span: "md:col-span-2",
    accent: "Audio",
  },
  {
    icon: iconCalendar,
    title: "Schedule in one click",
    body: "Approve once. Publish to TikTok, YouTube, LinkedIn, X without leaving PostSpark.",
    span: "md:col-span-2",
    accent: "Publishing",
  },
];

export function FeatureBento() {
  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <p className="lv3-chip">Everything you need</p>
          <h2 className="mt-4 font-display-lux" style={{ fontSize: "clamp(36px, 5vw, 64px)", lineHeight: 1.05, color: "#FAFAF9" }}>
            One workspace. <em className="lv3-text-gradient" style={{ fontStyle: "italic" }}>Every output.</em>
          </h2>
          <p className="mt-4 text-base sm:text-lg" style={{ color: "rgba(250,250,249,0.65)" }}>
            Built for creators and agencies who refuse to copy-paste between tabs.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-6 md:auto-rows-[minmax(220px,auto)] gap-4 sm:gap-5">
          {TILES.map((t, i) => (
            <article
              key={i}
              className={`relative overflow-hidden rounded-3xl p-7 sm:p-8 lv3-glass lv3-gradient-border lv3-card-hover ${t.span}`}
            >
              <div className="flex items-start justify-between gap-4">
                <span className="lv3-chip" style={{ fontSize: 11 }}>{t.accent}</span>
                <img
                  src={t.icon}
                  alt=""
                  loading="lazy"
                  width={120}
                  height={120}
                  className="lv3-float h-20 w-20 sm:h-24 sm:w-24 object-contain -mr-2 -mt-2"
                  style={{ filter: "drop-shadow(0 18px 30px rgba(124,58,237,0.35))" }}
                />
              </div>
              <h3 className="mt-6 font-display-lux" style={{ fontSize: "clamp(22px, 2.4vw, 30px)", lineHeight: 1.1, color: "#FAFAF9" }}>
                {t.title}
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed" style={{ color: "rgba(250,250,249,0.65)" }}>
                {t.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
