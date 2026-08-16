/**
 * Page-specific content for /tools/youtube-to-blog.
 * A worked before/after example (raw transcript vs. structured article),
 * the exact anatomy of the output, and tool-specific FAQs whose text
 * matches the FAQPage JSON-LD emitted by the route head().
 */

const TRANSCRIPT = `so yeah um today i wanted to talk about like
pricing, right? and the thing is most people
they just copy their competitor and then they
wonder why nobody buys... anyway i tested three
different pages last year and uh the second one
did way better, i'll explain why in a second`;

const ARTICLE = `# SaaS Pricing Pages: What Actually Converts

## Why copying a competitor's pricing fails
Competitor pricing encodes their costs, their
audience and their funnel — not yours.

## The three pages I tested
1. Feature-led table
2. Outcome-led tiers
3. Single-plan with usage add-ons

## What moved the number
Outcome-led tiers won: buyers self-selected...

## FAQ
**How many tiers should I have?** Three...`;

const ANATOMY: { label: string; detail: string }[] = [
  { label: "SEO title + meta description", detail: "Primary keyword pulled from the video title, length-checked for SERP truncation." },
  { label: "H2/H3 outline", detail: "Chapters and topic shifts in the transcript become real headings, not paragraphs." },
  { label: "Body in your voice", detail: "Filler removed, spoken asides rewritten as prose using your Brand Voice profile." },
  { label: "Pull quotes", detail: "The most quotable lines lifted verbatim so the post still sounds like you." },
  { label: "FAQ section", detail: "Questions answered in the video, formatted for FAQ rich results." },
  { label: "Internal link suggestions", detail: "Anchor-text suggestions you can point at your own existing posts." },
];

export const YT_TO_BLOG_FAQS = [
  {
    q: "Is this a transcript tool or a blog post generator?",
    a: "A blog post generator. The transcript is only an input — PostSpark restructures it into a titled, headed article with a meta description, FAQ section and pull quotes, and removes spoken filler.",
  },
  {
    q: "What if my YouTube video has no captions?",
    a: "PostSpark transcribes the audio itself, so videos without captions still work. Only publicly accessible videos can be processed.",
  },
  {
    q: "How long can the video be?",
    a: "Long-form works best — 10 to 60 minute videos usually produce a 1,200 to 2,500 word article, because there is enough material for a full outline.",
  },
  {
    q: "What format do I get, and where can I paste it?",
    a: "Markdown, plus a one-click HTML copy. It pastes cleanly into WordPress, Webflow, Ghost, Notion and Substack, and headings survive the paste.",
  },
  {
    q: "Will it sound like AI wrote it?",
    a: "It reuses your own phrasing from the video, and Pro plans apply a Brand Voice profile trained on your existing writing so tone and vocabulary stay yours.",
  },
  {
    q: "Does it cost anything to try?",
    a: "The free plan includes 3 repurposes per month with no credit card. Pro is $24/mo for unlimited articles and Brand Voice.",
  },
];

export function YoutubeToBlogExample() {
  return (
    <>
      {/* Worked example */}
      <section className="relative py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <p className="lv3-chip">Worked example</p>
          <h2
            className="mt-4 max-w-3xl font-display-lux"
            style={{ fontSize: "clamp(30px, 4.5vw, 52px)", color: "#FAFAF9", lineHeight: 1.05 }}
          >
            A 24-minute video, <em className="lv3-text-gradient" style={{ fontStyle: "italic" }}>before and after.</em>
          </h2>
          <p className="mt-4 max-w-2xl text-sm sm:text-base" style={{ color: "rgba(250,250,249,0.7)", lineHeight: 1.65 }}>
            This is what separates PostSpark from a transcription tool. Left: what a captions
            export gives you. Right: the article PostSpark returns from the same audio.
          </p>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <div className="rounded-3xl p-7 lv3-glass" style={{ borderLeft: "3px solid rgba(239,68,68,0.55)" }}>
              <h3 className="font-display-lux text-xl" style={{ color: "#FAFAF9" }}>
                Raw transcript export
              </h3>
              <pre
                className="mt-4 overflow-x-auto whitespace-pre-wrap text-[12.5px]"
                style={{ color: "rgba(250,250,249,0.62)", lineHeight: 1.7, fontFamily: "ui-monospace, SFMono-Regular, monospace" }}
              >
                {TRANSCRIPT}
              </pre>
              <p className="mt-4 text-xs" style={{ color: "rgba(250,250,249,0.5)" }}>
                No title, no headings, no meta — nothing for Google to rank.
              </p>
            </div>
            <div className="rounded-3xl p-7 lv3-glass lv3-gradient-border" style={{ borderLeft: "3px solid #7C3AED" }}>
              <h3 className="font-display-lux text-xl" style={{ color: "#FAFAF9" }}>
                PostSpark article (markdown)
              </h3>
              <pre
                className="mt-4 overflow-x-auto whitespace-pre-wrap text-[12.5px]"
                style={{ color: "rgba(250,250,249,0.82)", lineHeight: 1.7, fontFamily: "ui-monospace, SFMono-Regular, monospace" }}
              >
                {ARTICLE}
              </pre>
              <p className="mt-4 text-xs" style={{ color: "rgba(250,250,249,0.55)" }}>
                Illustrative output, shortened to fit. Real runs return the full article.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Anatomy of the output */}
      <section className="relative py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <p className="lv3-chip">What lands in the editor</p>
          <h2
            className="mt-4 font-display-lux"
            style={{ fontSize: "clamp(30px, 4.5vw, 52px)", color: "#FAFAF9", lineHeight: 1.05 }}
          >
            Anatomy of the output
          </h2>
          <dl className="mt-10 grid gap-5 md:grid-cols-3">
            {ANATOMY.map((a) => (
              <div key={a.label} className="rounded-3xl p-6 lv3-glass lv3-card-hover">
                <dt className="font-display-lux text-lg" style={{ color: "#FAFAF9" }}>
                  {a.label}
                </dt>
                <dd className="mt-2 text-sm" style={{ color: "rgba(250,250,249,0.68)", lineHeight: 1.65 }}>
                  {a.detail}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-12 rounded-3xl p-8 lv3-glass text-center">
            <h3 className="font-display-lux text-2xl" style={{ color: "#FAFAF9" }}>
              Turn your next YouTube video into a publish-ready article
            </h3>
            <p className="mx-auto mt-3 max-w-2xl text-sm" style={{ color: "rgba(250,250,249,0.7)", lineHeight: 1.7 }}>
              Paste a link, get an SEO-structured draft with title, meta description, H2 outline, FAQ and pull
              quotes — ready to paste into WordPress, Webflow, Ghost or Notion. 3 free articles every month, no
              credit card, no watermark.
            </p>
            <a
              href="/signup"
              className="mt-6 inline-flex items-center justify-center rounded-full px-7 py-3 text-sm font-semibold"
              style={{ background: "#FAFAF9", color: "#0B0B0F" }}
            >
              Convert my first video free
            </a>
          </div>
        </div>
      </section>


      {/* Tool-specific FAQ (mirrors FAQPage JSON-LD) */}
      <section className="relative py-20">
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <p className="lv3-chip">YouTube → Blog questions</p>
          <h2
            className="mt-4 font-display-lux"
            style={{ fontSize: "clamp(30px, 4.5vw, 52px)", color: "#FAFAF9", lineHeight: 1.05 }}
          >
            Before you paste a link
          </h2>
          <div className="mt-10 space-y-4">
            {YT_TO_BLOG_FAQS.map((f) => (
              <details key={f.q} className="rounded-2xl p-6 lv3-glass">
                <summary
                  className="cursor-pointer list-none font-display-lux text-lg"
                  style={{ color: "#FAFAF9" }}
                >
                  {f.q}
                </summary>
                <p className="mt-3 text-sm" style={{ color: "rgba(250,250,249,0.72)", lineHeight: 1.7 }}>
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
