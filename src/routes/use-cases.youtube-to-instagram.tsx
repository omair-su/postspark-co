import { createFileRoute } from "@tanstack/react-router";
import { segmentHead } from "@/components/segment/SegmentPage";
import {
  PremiumShortsLanding,
  Zap, Mic, Film, Wand2, Clock, Music2, Type, ImageIcon, Layers, TrendingUp,
} from "@/components/landing/shorts/PremiumShortsLanding";
import heroImg from "@/assets/yt-to-ig-hero.jpg";
import mosaicImg from "@/assets/shorts-features-mosaic.jpg";

export const Route = createFileRoute("/use-cases/youtube-to-instagram")({
  head: () => segmentHead({
    title: "YouTube to Instagram — Turn Videos into Reels & Square Posts | PostSpark",
    desc: "Repurpose YouTube videos into Instagram Reels, carousels, and square posts. PostSpark auto-extracts highlights and resizes for every Instagram aspect ratio.",
    url: "https://postspark.co/use-cases/youtube-to-instagram",
    path: "/use-cases/youtube-to-instagram",
  }),
  component: YoutubeToInstagramPage,
});

function YoutubeToInstagramPage() {
  return (
    <PremiumShortsLanding
      eyebrow="Use case · YouTube → Instagram"
      h1="Turn one long YouTube video into a week of Instagram Reels."
      sub="Drop your YouTube URL. PostSpark pulls the highest-retention moments, scripts each one as a scroll-stopping Reel, generates the caption + hashtags, and ships a 9:16 cut ready to record or upload — in under 90 seconds."
      heroImage={heroImg}
      heroImageAlt="YouTube video being repurposed into three vertical Instagram Reels"
      mosaicImage={mosaicImg}
      crumbs={[{ label: "Use cases", href: "/#use-cases" }, { label: "YouTube → Instagram" }]}
      ctaPrimary={{ label: "Repurpose Your First Video — Free", to: "/signup" }}
      ctaSecondary={{ label: "Open Shorts Studio →", href: "/dashboard/shorts-studio" }}
      problems={[
        { icon: Clock, title: "An afternoon per Reel", body: "Watching back a 20-minute video to find the 3 best moments eats a whole work session." },
        { icon: Film, title: "Cropping kills the framing", body: "Manual 16:9 → 9:16 cuts off heads, hides slides, and buries the on-screen captions." },
        { icon: TrendingUp, title: "Reel hooks ≠ YouTube hooks", body: "What works as a YouTube intro flat-lines on Reels — the first 1.5 seconds need a different angle." },
        { icon: Layers, title: "Caption fatigue", body: "Writing fresh Instagram captions + hashtags for every clip is the part most creators quietly skip." },
      ]}
      steps={[
        { title: "Paste your YouTube URL", body: "Any public video — long-form, podcast, tutorial. PostSpark handles the transcript." },
        { title: "AI finds the gold", body: "Highest-retention moments scored 0-100 and matched to Reel-shaped angles." },
        { title: "Get the Reel pack", body: "5 vertical scripts, captions in your brand voice, hashtags, and on-screen text." },
        { title: "Record or upload", body: "Use the script as a teleprompter, generate a voiceover, or burn captions in-browser." },
      ]}
      features={[
        { icon: Wand2, title: "Highlight extraction", body: "Claude scans the full transcript and surfaces the 5 most repostable moments with a virality score." },
        { icon: Film, title: "9:16 auto-reframing", body: "Subjects stay centered, slides stay readable, no manual cropping." },
        { icon: Mic, title: "AI voiceover (Reels-tuned)", body: "6 voices optimized for Instagram pacing — drop straight into your edit.", tag: "Pro" },
        { icon: Type, title: "Burned-in captions", body: "Reels-style on-screen captions exported as SRT or burned into the clip in-browser." },
        { icon: Music2, title: "Reels trending audio", body: "Curated Reels-specific sounds per niche — copy the exact in-app search string." },
        { icon: ImageIcon, title: "Cover image generator", body: "AI-generated cover frames that match Instagram's grid aesthetic.", tag: "Pro" },
      ]}
      competitors={{
        otherNames: ["Opus Clip", "Repurpose.io", "Submagic"],
        rows: [
          { label: "AI hook score per clip", postspark: true, others: [false, false, false] },
          { label: "Reels-specific tone (not just TikTok)", postspark: true, others: [false, false, "limited"] },
          { label: "Brand voice training", postspark: true, others: [false, false, false] },
          { label: "AI voiceover", postspark: true, others: [false, false, false] },
          { label: "Cover image generator", postspark: true, others: [false, false, false] },
          { label: "5 scripts from 1 source (Series mode)", postspark: true, others: [false, false, false] },
          { label: "Free tier with full output", postspark: "3/mo", others: ["60s clips", "limited", "limited"] },
          { label: "Lifetime deal", postspark: "$97", others: [false, false, false] },
        ],
      }}
      samples={[
        { platform: "Reel #1", hook: "I watched 200 hours of my own footage so you don't have to", cta: "Save this — episode 2 drops Friday", tag: "Score 93" },
        { platform: "Reel #2", hook: "The 8-second mistake every YouTuber makes when cutting Reels", cta: "Full walkthrough on the channel link in bio", tag: "Score 90" },
        { platform: "Reel #3", hook: "If your Reels are flat-lining, it's not the algo — it's this", cta: "Comment 'reels' and I'll DM the template", tag: "Score 87" },
      ]}
      faq={[
        { q: "Does it download the YouTube video?", a: "PostSpark pulls the public transcript and the highlight timestamps. For the actual video edit you upload your own MP4 — your channel, your footage." },
        { q: "What if my video doesn't have captions?", a: "PostSpark generates a transcript automatically (Claude + AssemblyAI). 100+ languages supported." },
        { q: "How many Reels do I get per video?", a: "Free tier: 1 script per video, 3 videos/month. Pro: unlimited scripts and Series mode for 5 episodic Reels per source." },
        { q: "Can I match my Instagram tone?", a: "Yes — Brand Voice training (Pro) learns from your top Reels and auto-applies your tone to every generation." },
        { q: "Does it publish to Instagram directly?", a: "Instagram publishing rolls out as Meta approves our app — your scripts, captions and 9:16 cuts are ready to paste or upload today." },
        { q: "Is it really free?", a: "Yes — 3 full Reel scripts per month, no credit card. Pro is $24/mo (or $19 annual) for unlimited." },
        { q: "What about podcast → Reels?", a: "Same workflow. Paste a podcast YouTube link and PostSpark extracts the 5 most clip-worthy moments." },
        { q: "Will the scripts feel like AI slop?", a: "No — hooks are scored against 10,000+ top Reels, and Brand Voice training matches your phrasing. Most users only edit 1-2 words." },
      ]}
    />
  );
}
