import { useMemo, useState } from "react";
import { analyzeText } from "@/lib/humanizeMetrics";

/**
 * Page-specific content for /tools/ai-humanizer.
 * The before/after demo runs PostSpark's real scoring model in the browser
 * (same module the dashboard uses), so the numbers on this page are not mocked.
 */

const SAMPLES: { id: string; label: string; ai: string; human: string }[] = [
  {
    id: "linkedin",
    label: "LinkedIn post",
    ai: `In today's fast-paced digital landscape, it is important to note that building a personal brand is crucial for professional success. Furthermore, consistency is a key factor that enables professionals to leverage their expertise effectively. Moreover, by utilizing a robust content strategy, individuals can seamlessly establish themselves as thought leaders in their respective industries. Ultimately, the ability to deliver value consistently is what separates successful creators from the rest.`,
    human: `I posted every weekday for 90 days. Nothing happened for the first six weeks.

Then one post did 140,000 views. Same topic I'd been writing about since day one, same opinions, same account.

Here's what changed: I stopped explaining what I do and started showing what I'd figured out that week. Specific numbers. Things that went wrong.

Personal brand isn't a strategy deck. It's just being the person who keeps showing up with something real to say.`,
  },
  {
    id: "blog",
    label: "Blog intro",
    ai: `Email marketing remains a pivotal component of any comprehensive digital strategy. In the ever-evolving landscape of customer acquisition, businesses must utilize cutting-edge tools to foster meaningful engagement. It's worth mentioning that segmentation is not only essential but also transformative, as it empowers marketers to deliver personalized experiences at scale. This article will delve into the best practices that drive actionable insights.`,
    human: `Email still outperforms almost everything else we run. Last quarter it drove 41% of revenue on about 4% of the budget.

That sounds like a case for sending more email. It isn't.

The lists that work are the ones we cut down. We deleted 12,000 addresses that hadn't opened anything in a year, split the rest by what people actually clicked, and sent fewer campaigns to smaller groups.

Open rates went from 18% to 34%. Same product, same copywriter, fewer sends.`,
  },
  {
    id: "email",
    label: "Cold email",
    ai: `I hope this email finds you well. I am reaching out to explore potential synergies between our organizations. Our cutting-edge platform empowers teams to streamline their workflows and unlock unparalleled efficiency. I would love to schedule a brief call at your earliest convenience to delve deeper into how we can add value to your operations.`,
    human: `Saw your team is hiring three more support reps this quarter. Guessing ticket volume is up.

We do one narrow thing: cut first-response time by drafting replies from your existing help docs. One customer went from 9 hours to 40 minutes without adding headcount.

Worth 15 minutes? If not, no follow-up from me.`,
  },
];

export const HUMANIZER_FAQS = [
  {
    q: "How does PostSpark humanize AI text?",
    a: "It runs three passes. First it analyses your text and reports exactly which machine-writing tells it found. Then it rewrites with those findings plus your purpose, style and Brand Voice. Finally it re-reads its own draft, checks your facts and numbers are intact, and repairs only the sentences that still read mechanical.",
  },
  {
    q: "Will it get past AI detectors like GPTZero or Originality.ai?",
    a: "We do not promise that, and any tool that guarantees it is not being straight with you. Detectors change weekly and none of them publish their model. What PostSpark does is measurably reduce the statistical signals detectors look for, then show you the numbers so you can decide whether to publish.",
  },
  {
    q: "What is the score on the results screen?",
    a: "It is PostSpark's own estimate, not a detector verdict. We measure burstiness (sentence-length variation), word predictability, stock AI phrasing, rhythm and passive voice, readability, and human voice cues like contractions. Every signal is shown separately with its before and after value, and the estimate is labelled as an estimate everywhere it appears.",
  },
  {
    q: "Does it change my facts, numbers or names?",
    a: "It is instructed not to, and we verify it. After every run we extract the numbers, percentages, dates, names and links from your source and check each one is still present in the output. If anything is missing, a repair pass restores it and the results screen flags what changed.",
  },
  {
    q: "Can I edit the rewrite sentence by sentence?",
    a: "Yes. The Diff view shows every sentence that changed next to your original. You can accept it, revert to your wording, or re-roll that single sentence in context as many times as you want. The final text rebuilds from your choices, so you own the copy.",
  },
  {
    q: "How long can the text be?",
    a: "Up to 20,000 words. Anything over roughly 1,200 words is split on paragraph boundaries and humanized section by section, with the output streaming in as each section finishes. Long-form batch mode is a Pro feature and one document counts as one run, not one per section.",
  },
  {
    q: "Does it write in my voice or a generic one?",
    a: "In yours, if you have trained a Brand Voice. Pro plans feed your voice profile and active Brand Kit tone into the rewrite pass, so the output keeps your vocabulary and register instead of drifting into generic blog voice.",
  },
  {
    q: "What does it cost?",
    a: "The free plan includes 3 runs per month with no credit card. Pro is $24/mo ($19/mo billed annually) for unlimited runs, long-form batch mode, Brand Voice and full run history.",
  },
];

const SIGNALS = [
  { name: "Burstiness", detail: "Human writing swings between 4-word lines and 25-word lines. Models hold a steady 15 to 20. We measure the spread and rebuild it." },
  { name: "Word predictability", detail: "Models pick the statistically likeliest next word. We track lexical variety and repeated phrasing, then push the rewrite toward less predictable, more specific wording." },
  { name: "Stock phrasing", detail: "A library of 120+ tells: “in today’s landscape”, “it’s important to note”, utilize, leverage, seamless, tapestry, “not only… but also”, em-dash pivots." },
  { name: "Rhythm & structure", detail: "Repeated sentence openers, passive voice, uniform paragraph shape, and a topic-sentence announcement at the head of every paragraph." },
  { name: "Readability", detail: "Thesaurus-soup output beats detectors and loses readers. We hold Flesch reading ease inside a human band instead of maximising complexity." },
  { name: "Meaning integrity", detail: "Numbers, percentages, dates, names and URLs are extracted from your source and verified present in the output. Nothing quietly drifts." },
];

const COMPARISON: { row: string; postspark: string; others: string }[] = [
  { row: "Detection claim", postspark: "Honest estimate, shown per signal", others: "“100% undetectable” guarantees" },
  { row: "Rewrite depth", postspark: "3 passes: analyse, rewrite, repair", others: "Single synonym-swap pass" },
  { row: "Editing control", postspark: "Per-sentence accept, revert, re-roll", others: "One block of text, take it or leave it" },
  { row: "Fact safety", postspark: "Numbers and names verified after each run", others: "No verification" },
  { row: "Your voice", postspark: "Trained Brand Voice + Brand Kit tone", others: "Generic “casual” presets" },
  { row: "Long documents", postspark: "Up to 20,000 words, section by section", others: "Hard caps around 1,000 words" },
  { row: "History", postspark: "Every run saved with versions and scores", others: "Gone on refresh" },
];

function Ring({ ai, caption }: { ai: number; caption: string }) {
  const human = 100 - ai;
  const size = 92;
  const r = size / 2 - 7;
  const c = 2 * Math.PI * r;
  const color = ai >= 60 ? "#EF4444" : ai >= 35 ? "#F59E0B" : "#34D399";
  return (
    <div className="flex items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={7} stroke="rgba(250,250,249,0.12)" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={7}
            strokeLinecap="round"
            stroke={color}
            strokeDasharray={c}
            strokeDashoffset={c - (c * human) / 100}
            style={{ transition: "stroke-dashoffset 800ms cubic-bezier(.2,.8,.2,1), stroke 400ms ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[20px] font-bold leading-none" style={{ color }}>{human}</span>
          <span className="text-[8.5px] uppercase tracking-wider" style={{ color: "rgba(250,250,249,0.5)" }}>human</span>
        </div>
      </div>
      <div>
        <p className="m-0 text-xs font-semibold" style={{ color: "#FAFAF9" }}>{caption}</p>
        <p className="m-0 mt-1 text-[11px]" style={{ color: "rgba(250,250,249,0.55)" }}>
          {ai}% estimated AI likelihood
        </p>
      </div>
    </div>
  );
}

export function HumanizerExample() {
  const [sampleId, setSampleId] = useState(SAMPLES[0].id);
  const [side, setSide] = useState<"ai" | "human">("human");
  const sample = SAMPLES.find((s) => s.id === sampleId) || SAMPLES[0];

  const aiScore = useMemo(() => analyzeText(sample.ai), [sample.ai]);
  const humanScore = useMemo(() => analyzeText(sample.human), [sample.human]);

  return (
    <>
      {/* LIVE BEFORE / AFTER */}
      <section className="relative py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <p className="lv3-chip">Scored live in your browser</p>
          <h2
            className="mt-4 max-w-3xl font-display-lux"
            style={{ fontSize: "clamp(30px, 4.5vw, 52px)", color: "#FAFAF9", lineHeight: 1.05 }}
          >
            Same message. <em className="lv3-text-gradient" style={{ fontStyle: "italic" }}>Two very different reads.</em>
          </h2>
          <p className="mt-4 max-w-2xl text-sm sm:text-base" style={{ color: "rgba(250,250,249,0.7)", lineHeight: 1.65 }}>
            These scores are computed right now, on this page, by the exact model the PostSpark editor
            uses. Nothing here is a screenshot.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-2">
            {SAMPLES.map((s) => (
              <button
                key={s.id}
                onClick={() => setSampleId(s.id)}
                className="rounded-full px-4 py-2 text-xs font-semibold transition"
                style={
                  sampleId === s.id
                    ? { background: "#FAFAF9", color: "#0B0B0F" }
                    : { background: "rgba(250,250,249,0.07)", color: "rgba(250,250,249,0.75)" }
                }
              >
                {s.label}
              </button>
            ))}
            <div className="ml-auto flex rounded-full p-1" style={{ background: "rgba(250,250,249,0.07)" }}>
              {(["ai", "human"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setSide(v)}
                  className="rounded-full px-4 py-1.5 text-xs font-semibold transition"
                  style={
                    side === v
                      ? { background: "#7C3AED", color: "#FAFAF9" }
                      : { color: "rgba(250,250,249,0.7)" }
                  }
                >
                  {v === "ai" ? "Before" : "After"}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
            <div
              className="rounded-3xl p-7 lv3-glass"
              style={{ borderLeft: `3px solid ${side === "ai" ? "rgba(239,68,68,0.55)" : "#7C3AED"}` }}
            >
              <h3 className="font-display-lux text-xl" style={{ color: "#FAFAF9" }}>
                {side === "ai" ? "Raw AI draft" : "After PostSpark"}
              </h3>
              <p
                className="mt-4 whitespace-pre-wrap text-[13.5px]"
                style={{ color: "rgba(250,250,249,0.82)", lineHeight: 1.75 }}
              >
                {side === "ai" ? sample.ai : sample.human}
              </p>
            </div>

            <div className="rounded-3xl p-7 lv3-glass lv3-gradient-border">
              <div className="space-y-5">
                <Ring ai={aiScore.aiLikelihood} caption="Raw AI draft" />
                <Ring ai={humanScore.aiLikelihood} caption="After PostSpark" />
              </div>

              <div className="mt-6 space-y-3">
                {humanScore.subScores.map((s) => {
                  const beforeS = aiScore.subScores.find((x) => x.key === s.key)?.score ?? 0;
                  return (
                    <div key={s.key}>
                      <div className="flex items-baseline justify-between text-[11px]">
                        <span style={{ color: "rgba(250,250,249,0.8)" }}>{s.label}</span>
                        <span style={{ color: "rgba(250,250,249,0.55)" }}>
                          {beforeS} → <strong style={{ color: "#FAFAF9" }}>{s.score}</strong>
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full" style={{ background: "rgba(250,250,249,0.1)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.max(2, s.score)}%`,
                            background: s.score >= 75 ? "#34D399" : s.score >= 50 ? "#F59E0B" : "#EF4444",
                            transition: "width 700ms cubic-bezier(.2,.8,.2,1)",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="mt-5 text-[10.5px]" style={{ color: "rgba(250,250,249,0.45)", lineHeight: 1.6 }}>
                PostSpark's own estimate from measurable text signals. It is not a verdict from any
                third-party detector, and no tool can promise one.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT WE ACTUALLY MEASURE */}
      <section className="relative py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <p className="lv3-chip">How detection actually works</p>
          <h2
            className="mt-4 font-display-lux"
            style={{ fontSize: "clamp(30px, 4.5vw, 52px)", color: "#FAFAF9", lineHeight: 1.05 }}
          >
            Six signals, measured every run
          </h2>
          <p className="mt-4 max-w-2xl text-sm sm:text-base" style={{ color: "rgba(250,250,249,0.7)", lineHeight: 1.65 }}>
            Detectors don't read for meaning. They look for statistical regularity. So that's what we
            measure, show you, and rewrite against.
          </p>
          <dl className="mt-10 grid gap-5 md:grid-cols-3">
            {SIGNALS.map((s) => (
              <div key={s.name} className="rounded-3xl p-6 lv3-glass lv3-card-hover">
                <dt className="font-display-lux text-lg" style={{ color: "#FAFAF9" }}>{s.name}</dt>
                <dd className="mt-2 text-sm" style={{ color: "rgba(250,250,249,0.68)", lineHeight: 1.65 }}>
                  {s.detail}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* COMPARISON */}
      <section className="relative py-20">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <p className="lv3-chip">Honest comparison</p>
          <h2
            className="mt-4 font-display-lux"
            style={{ fontSize: "clamp(30px, 4.5vw, 52px)", color: "#FAFAF9", lineHeight: 1.05 }}
          >
            Why this isn't another spinner
          </h2>
          <div className="mt-10 overflow-hidden rounded-3xl lv3-glass">
            <div className="grid grid-cols-[1.1fr_1.2fr_1.2fr] gap-0 border-b px-5 py-4 text-[11px] font-semibold uppercase tracking-wide" style={{ borderColor: "rgba(250,250,249,0.1)", color: "rgba(250,250,249,0.55)" }}>
              <span />
              <span style={{ color: "#FAFAF9" }}>PostSpark</span>
              <span>Typical humanizer</span>
            </div>
            {COMPARISON.map((c) => (
              <div
                key={c.row}
                className="grid grid-cols-[1.1fr_1.2fr_1.2fr] gap-0 border-b px-5 py-4 text-[12.5px]"
                style={{ borderColor: "rgba(250,250,249,0.07)" }}
              >
                <span style={{ color: "rgba(250,250,249,0.6)" }}>{c.row}</span>
                <span style={{ color: "#FAFAF9" }}>{c.postspark}</span>
                <span style={{ color: "rgba(250,250,249,0.5)" }}>{c.others}</span>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-3xl p-8 lv3-glass text-center">
            <h3 className="font-display-lux text-2xl" style={{ color: "#FAFAF9" }}>
              Rewrite your next draft in your own voice
            </h3>
            <p className="mx-auto mt-3 max-w-2xl text-sm" style={{ color: "rgba(250,250,249,0.7)", lineHeight: 1.7 }}>
              Three passes, a full signal breakdown, sentence-level control and a meaning check on every
              run. 3 free runs every month, no credit card.
            </p>
            <a
              href="/signup"
              className="mt-6 inline-flex items-center justify-center rounded-full px-7 py-3 text-sm font-semibold"
              style={{ background: "#FAFAF9", color: "#0B0B0F" }}
            >
              Humanize my first draft free
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative py-20">
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <p className="lv3-chip">Humanizer questions</p>
          <h2
            className="mt-4 font-display-lux"
            style={{ fontSize: "clamp(30px, 4.5vw, 52px)", color: "#FAFAF9", lineHeight: 1.05 }}
          >
            Before you paste a draft
          </h2>
          <div className="mt-10 space-y-4">
            {HUMANIZER_FAQS.map((f) => (
              <details key={f.q} className="rounded-2xl p-6 lv3-glass">
                <summary className="cursor-pointer list-none font-display-lux text-lg" style={{ color: "#FAFAF9" }}>
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
