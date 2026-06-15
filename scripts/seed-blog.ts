// One-shot seed for 10 PostSpark blog posts.
// Run: bun run scripts/seed-blog.ts
// Idempotent on slug (uses upsert on conflict).
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, KEY, { auth: { persistSession: false } });

const AUTHOR_ID = "3951bb42-8cb7-44c5-82eb-380ad95c702f"; // postspark-team
const CAT = {
  repurposing: "0a30016d-72db-4314-8572-0fc888594cff",
  ai: "161eb5ea-ad31-446d-a868-35c19bfdfe6d",
  workflows: "4de5fe6f-529b-493f-8000-7199c4c83b27",
  agency: "ae2bedc7-2e75-42f4-8e95-5cea2f361d0b",
};

interface Post {
  slug: string;
  title: string;
  excerpt: string;
  meta_title?: string;
  meta_description?: string;
  category_id: string;
  cover_image_url?: string;
  reading_time_minutes: number;
  daysAgo: number;
  content_md: string;
}

const COVER = (q: string) => `https://images.unsplash.com/photo-${q}?auto=format&fit=crop&w=1600&q=70`;

const POSTS: Post[] = [
  {
    slug: "repurpose-blog-post-30-social-posts-2026",
    title: "How to Repurpose a Blog Post into 30 Social Posts in 2026",
    excerpt: "A concrete, modern workflow for turning one long-form blog post into 30 platform-native pieces of content — without sounding like a robot.",
    meta_title: "Repurpose 1 Blog Post into 30 Social Posts (2026 Workflow)",
    meta_description: "The exact 2026 workflow for turning a single blog post into 30 platform-native social posts in under an hour. Templates, prompts and tools inside.",
    category_id: CAT.repurposing,
    cover_image_url: COVER("1499750310107-5fef28a66643"),
    reading_time_minutes: 8,
    daysAgo: 2,
    content_md: `# How to Repurpose a Blog Post into 30 Social Posts in 2026

Writing a 2,000-word blog post and then publishing it once is the content equivalent of building a Ferrari and driving it once around the block.

In 2026, the winning move is the opposite: write less, distribute more. This is the exact workflow we use at PostSpark to turn one well-written blog post into 30 platform-native pieces of content — usually in under an hour.

## Why 30, not 100

If you've spent any time online in the last 18 months you've seen creators claim they turn one blog post into 100+ pieces of content. They're not lying — but they're not telling you that 80 of those pieces are filler nobody reads.

30 is the sweet spot: enough volume that you ship daily across every platform you actually care about, low enough that every single piece is good.

Here's how the 30 break down:

- **8 X / Twitter posts** (4 single tweets, 2 quote-format, 2 short threads)
- **5 LinkedIn long-form posts** (different angles on the same core idea)
- **3 LinkedIn carousels** (5–10 slides each)
- **4 Instagram captions** (paired with carousel slides or quote cards)
- **3 TikTok / Reels / Shorts scripts** (45–60s vertical)
- **3 email newsletter sections** (intro, deep-dive, follow-up)
- **2 podcast talking points** (if you have a podcast or guest on one)
- **2 YouTube comments / Reddit answers** (organic distribution)

## The 4-step workflow

### 1. Pick the *one* core idea (not the whole post)

Most blog posts contain 3–5 distinct ideas. If you try to repurpose all of them, every social post sounds confused.

Open the post and ask: *what is the single most counter-intuitive thing in here?* That's your anchor. Every one of your 30 pieces will orbit it.

### 2. Generate hook variants first, body second

The hook decides whether anyone reads the rest. In 2026 every platform's algorithm is even more brutal about the first 1.5 seconds (TikTok), first 70 chars (LinkedIn), or first 50 chars (X).

For each piece, write 3 hook options before you write the body. Score them honestly. Use the best one.

### 3. Rewrite for the platform's algorithm, not just its dimensions

Hashtags work on Instagram, hurt on LinkedIn. "I" openings get suppressed on X but work fine on LinkedIn. Long carousels eat impressions on X but get saved on LinkedIn.

Repurposing isn't reformatting — it's translating intent into each platform's local language.

### 4. Schedule across 14 days, not 1 day

Posting all 30 in one day looks like spam and hits the same audience three times. Spreading across two weeks gives the algorithm time to find new viewers for each piece.

## Doing this manually vs with AI

Manually: 6–10 hours per blog post. Realistically, nobody does it consistently.

With a tool like [PostSpark](https://postspark.co): paste the URL → pick the 30 formats you want → generated, on-brand, in 90 seconds.

The output isn't generic AI slop because we [train on your real voice](https://postspark.co) (free plan: 3 repurposes/month, Pro: unlimited).

## What we got wrong the first 6 months

We initially built PostSpark assuming creators wanted *quantity*. Turns out they want quality across just enough platforms to matter. Every product decision since has been about making the 30 pieces feel *more* hand-crafted, not bigger.

If you want the workflow without the tool, the templates above are honest and free. If you want the workflow *with* the tool, [start free](https://postspark.co/signup).
`,
  },
  {
    slug: "postspark-vs-castmagic-honest-comparison",
    title: "PostSpark vs Castmagic: An Honest 2026 Comparison",
    excerpt: "We built a competitor to Castmagic, so this is biased — but here are the real differences between PostSpark and Castmagic, including where Castmagic wins.",
    meta_title: "PostSpark vs Castmagic — Honest Comparison (2026)",
    meta_description: "Picking between PostSpark and Castmagic? Here's the honest, written-by-the-founder breakdown of pricing, output quality and use cases.",
    category_id: CAT.repurposing,
    cover_image_url: COVER("1551434678-e076c223a692"),
    reading_time_minutes: 6,
    daysAgo: 5,
    content_md: `# PostSpark vs Castmagic: An Honest 2026 Comparison

Full disclosure: we build PostSpark. So take the "honest" with the grain of salt it deserves. That said, we use Castmagic, we respect what they built, and we'll happily tell you when they're the better choice.

## Quick verdict

- **Pick Castmagic if** your primary use case is podcast or long-video transcripts and you want a battle-tested tool with strong audio infrastructure.
- **Pick PostSpark if** you want to turn *any* input (blog, video, transcript, idea) into 30 platform-ready posts and care about output that sounds like *you*, not generic AI.

## Pricing (as of 2026-06)

| | PostSpark | Castmagic |
|---|---|---|
| Free | 3 repurposes/mo | Trial only |
| Entry plan | $24/mo (Pro) | ~$23/mo (Starter) |
| Unlimited | Yes on Pro | Higher tier |
| Lifetime deal | $97 (first 50) | No |

## Where Castmagic is better

1. **Audio infrastructure.** They've spent years on transcription accuracy and diarization. If you're processing hours of audio weekly, they're rock solid.
2. **Template library depth.** Their library is broader and battle-tested across many podcast-specific formats.
3. **Brand recognition.** Easier to convince a client you're using "the well-known tool".

## Where PostSpark is better

1. **Output sounds like you.** Brand Voice trains on your real posts. Most AI tools, Castmagic included, produce competent but generic output.
2. **Inputs beyond audio.** Blog URLs, YouTube videos, raw text, transcripts, ideas — PostSpark accepts all of them. Castmagic is audio-first.
3. **Hook quality.** We invest heavily in the Hook Lab — 20 scored hooks per topic with viral framework tagging. Most repurposers ignore hooks entirely.
4. **Shorts Studio.** Full vertical-video script with shot list, captions and CTA per shot. Castmagic gives you transcripts; we give you the recording brief.
5. **Founding lifetime deal.** $97 once for the first 50 customers. Not available anywhere else.

## Where they're a tie

- Transcript quality for clean audio is comparable.
- Both export to common formats.
- Both have a serious team behind them.

## Migration

If you're moving from Castmagic to PostSpark, paste your existing transcripts in as source content — you'll get the full repurposing pipeline on the work you've already paid to transcribe.

[Start free →](https://postspark.co/signup)
`,
  },
  {
    slug: "postspark-vs-opusclip-which-is-right",
    title: "PostSpark vs OpusClip: Which Tool Is Right for You?",
    excerpt: "OpusClip and PostSpark solve different problems. Here's how to pick — and when to use both together.",
    meta_title: "PostSpark vs OpusClip — Pick the Right Tool (2026)",
    meta_description: "OpusClip clips video. PostSpark generates content. Here's a clear-eyed comparison and the use cases where each one wins.",
    category_id: CAT.repurposing,
    cover_image_url: COVER("1611162617213-7d7a39e9b1d7"),
    reading_time_minutes: 5,
    daysAgo: 8,
    content_md: `# PostSpark vs OpusClip: Which Tool Is Right for You?

Short answer: they solve different problems and a lot of creators use both.

## What each one actually does

**OpusClip** is a video-first tool. You feed it a long-form video, it auto-clips the highest-engagement moments into vertical shorts, adds captions, and exports ready-to-post clips. It's the best in class at *video-to-video* repurposing.

**PostSpark** is a text + multi-format tool. You feed it any source (URL, video transcript, audio, blog, raw text) and it generates 30 platform-native pieces of content: tweets, LinkedIn long-form, carousels, newsletters, Shorts *scripts*, SEO blog drafts, image prompts.

If you want clips, use OpusClip. If you want the surrounding written content — tweets, captions, LinkedIn posts, newsletters, shot lists — use PostSpark.

## The stacked workflow

The smart move in 2026 is to combine them:

1. Long-form video → **OpusClip** → 10 vertical clips
2. Long-form transcript → **PostSpark** → 30 written pieces + 3 Shorts scripts for the clips OpusClip didn't auto-detect
3. Schedule across 14 days

That's roughly 40 high-quality pieces from one video, with each tool doing what it's actually best at.

## Pricing

OpusClip starts around $9.50/mo for 90 minutes; full unlimited is much higher.
PostSpark is $24/mo for unlimited Pro, or $97 once for [lifetime](https://postspark.co/deals/lifetime) (first 50).

## When to skip one of them

- **Skip OpusClip if** you don't shoot long-form video. No video, no clips to make.
- **Skip PostSpark if** your *only* goal is vertical clips and you never want written content.

For most solo creators and small teams, the answer is "both, and they don't overlap as much as you'd think."

[Try PostSpark free →](https://postspark.co/signup)
`,
  },
  {
    slug: "postspark-vs-repurpose-io",
    title: "PostSpark vs Repurpose.io: A 2026 Comparison",
    excerpt: "Repurpose.io is a great auto-publisher. PostSpark is a great content generator. Here's how to pick.",
    meta_title: "PostSpark vs Repurpose.io — Honest Breakdown (2026)",
    meta_description: "Repurpose.io publishes the same file to 8 platforms. PostSpark rewrites your content for each one. Here's which problem each solves.",
    category_id: CAT.repurposing,
    cover_image_url: COVER("1432888622747-4eb9a8efeb07"),
    reading_time_minutes: 5,
    daysAgo: 11,
    content_md: `# PostSpark vs Repurpose.io: A 2026 Comparison

These two tools share a category name but solve genuinely different problems.

## The fundamental difference

**Repurpose.io** takes one file (a video, audio episode, livestream) and *re-publishes* it across multiple platforms with light reformatting — resize, add a watermark, cross-post.

**PostSpark** takes one source and *re-writes* it into 30 platform-native pieces of new content — tweets, LinkedIn posts, carousels, newsletters, Shorts scripts. Different copy for each platform.

If you've ever posted the exact same caption on LinkedIn, Twitter and Instagram and felt it land flat on all three, that's the gap PostSpark fills.

## Where Repurpose.io wins

- Auto-publishing infrastructure across many channels.
- Time-saver for podcasters who want their episode on YouTube, Spotify, and TikTok with minimal friction.
- Good fit if your strategy is "be everywhere with the same asset".

## Where PostSpark wins

- Native rewriting per platform, not just reformatting.
- Brand Voice that learns from your real posts.
- Hook Lab with 20 scored hooks per topic.
- Inputs beyond video — blog URLs, raw text, transcripts.
- Shorts Studio with shot list + on-screen captions.

## Pricing

Repurpose.io: roughly $25–$75/mo by channel volume.
PostSpark: $24/mo unlimited, or [$97 lifetime](https://postspark.co/deals/lifetime) for the first 50.

## Combine them

Honestly, if you have podcast or video, use Repurpose.io to *distribute* the raw asset and PostSpark to *write* the surrounding content. They don't fight.

[Try PostSpark free →](https://postspark.co/signup)
`,
  },
  {
    slug: "2026-creator-content-stack",
    title: "The 2026 Creator Content Stack (What Actually Works)",
    excerpt: "The exact tools and workflow we see top creators using in 2026, including the things that quietly disappeared.",
    meta_title: "The 2026 Creator Content Stack — What Works",
    meta_description: "A no-fluff breakdown of the content tools serious creators actually use in 2026: writing, repurposing, video, scheduling, analytics.",
    category_id: CAT.workflows,
    cover_image_url: COVER("1551288049-bebda4e38f71"),
    reading_time_minutes: 7,
    daysAgo: 14,
    content_md: `# The 2026 Creator Content Stack (What Actually Works)

Every six months the "creator stack" lists go viral with the same 30 tools nobody uses. This is what *actually* runs in the workflows of creators doing $10k+ MNR from content in 2026.

## Tier 1 — non-negotiable

1. **Writing & repurposing**: an AI tool that turns one input into many outputs. PostSpark, Castmagic, or stacked GPT prompts. Without this you cap at one platform.
2. **Vertical video**: OpusClip or CapCut. The "clip → caption → vertical" workflow is now table stakes.
3. **Scheduling**: Buffer, Typefully, or a calendar inside your repurposer. The free version is fine.
4. **Notion or equivalent**: idea capture, outline, second brain.

## Tier 2 — once you're past the messy middle

5. **Audio + transcript**: Descript or AssemblyAI integrated into your workflow.
6. **Image / thumbnail**: PostSpark Image Studio, Midjourney, or DALL·E 3 in ChatGPT.
7. **Analytics**: native platform analytics plus one cross-platform tool (Beehiiv stats, X analytics, native Instagram).
8. **Newsletter platform**: Beehiiv or ConvertKit. Substack if you want to lean on their network.

## Tier 3 — only if you're scaling

9. **Team / approvals**: Notion → PostSpark workspaces → published.
10. **Brand voice infra**: store your top 50 posts in a Brand Voice tool so every generation sounds like you.
11. **Programmatic distribution**: Make / Zapier / n8n recipes for the parts that are predictable.

## What quietly disappeared in 2026

- "Aesthetic" link-in-bio tools nobody clicks.
- Standalone hashtag research tools — embedded in repurposers now.
- Most one-feature AI tools — wiped out by general-purpose ones.

## The whole stack on $50/month

If you're solo and starting from zero:

- PostSpark $24 (or $97 lifetime)
- OpusClip $9.50
- Buffer free / Typefully free
- Notion free
- Beehiiv free (under 2,500 subs)

Total: under $40/month, fully operational.

## What we got wrong

Spending three months on tools and three weeks on actual posting is the most common mistake we see. The stack matters less than the publishing cadence. Get to *daily* on one platform first, then add tools.

[Start free with PostSpark →](https://postspark.co/signup)
`,
  },
  {
    slug: "hooks-that-get-100k-views-templates",
    title: "How to Write Hooks That Get 100k Views (With Templates)",
    excerpt: "Twenty viral hook templates with the psychology behind each — copy them, fill in your topic, post.",
    meta_title: "20 Viral Hook Templates (Copy + Paste)",
    meta_description: "20 proven viral hook templates for X, LinkedIn, TikTok and Instagram, with the psychology behind each. Free, no signup.",
    category_id: CAT.ai,
    cover_image_url: COVER("1535303311164-664fc9ec6532"),
    reading_time_minutes: 6,
    daysAgo: 17,
    content_md: `# How to Write Hooks That Get 100k Views (With Templates)

The hook is 90% of a post. If the first line doesn't earn the second, nothing else matters.

Here are 20 hook templates we've seen consistently outperform across X, LinkedIn, TikTok and Instagram. Each comes with the psychology behind it and a fill-in-the-blank version.

## Curiosity gap

1. *"Most people get [X] wrong. Here's what actually works."*
2. *"I spent [N hours] on [X]. Here's what I'd do differently."*
3. *"Nobody talks about [X]. They should."*

The trigger: tension between what the reader knows and what's just out of reach.

## Specific outcome

4. *"How I went from [bad state] to [good state] in [N days]."*
5. *"[Specific number] [unit] of [thing] without [common pain]."*
6. *"This [tactic] got me [specific outcome]. Here's the exact playbook."*

The trigger: proof + curiosity about the method.

## Contrarian

7. *"[Common advice] is wrong. Do this instead."*
8. *"Stop doing [X]. It's actively hurting your [Y]."*
9. *"Everyone says [popular take]. Here's why they're wrong."*

The trigger: pattern-interrupt against received wisdom.

## Question hooks (use sparingly)

10. *"What if [X] was the wrong question all along?"*
11. *"Why does [counter-intuitive thing] keep happening?"*

The trigger: forcing the reader to think before they scroll.

## Story openers

12. *"Three years ago I [embarrassing situation]. Today [outcome]."*
13. *"My biggest mistake was [X]. Don't repeat it."*

The trigger: humans are wired for narrative; vulnerability earns trust.

## Stat-based

14. *"[N]% of [audience] do [X]. Only [small N]% see results. Here's the difference."*
15. *"[Eye-catching number] [unit] in [timeframe]. Here's how."*

The trigger: numbers feel like proof before you read further.

## Warning / mistake

16. *"If you're [common situation], you're probably making this mistake."*
17. *"Avoid [X] at all costs. Here's why."*

The trigger: loss aversion is twice as motivating as gain.

## Numbered list

18. *"[N] things I wish I knew before [X]."*
19. *"[N] frameworks that quietly run [industry]."*

The trigger: implicit promise of organized, scannable value.

## Pattern interrupt

20. *"This is going to sound crazy, but [X]."*

The trigger: signals you're about to break a convention they're tired of.

## Rules to follow with all 20

- **Specificity beats cleverness.** Real numbers, real outcomes.
- **Never start with "I"** on X — algorithmic suppression is real in 2026.
- **Under 70 chars** for LinkedIn (truncation), under 9 words for vertical video, under 140 chars on standalone tweets.
- **Match the platform's culture** — TikTok tolerates chaos, LinkedIn rewards composure.

## Generating 20 at once

Manually writing 20 hooks per topic takes 30+ minutes. [PostSpark Hook Lab](https://postspark.co/dashboard/hook-lab) generates 20 scored, ranked hooks in 15 seconds — Pro feature. Free version available without signup at [/tools/hook-generator](https://postspark.co/tools/hook-generator).
`,
  },
  {
    slug: "brand-voice-ai-what-it-is-why-it-matters",
    title: "Brand Voice AI: What It Is and Why It Matters in 2026",
    excerpt: "Generic AI output is the #1 reason creators give up on AI writing tools. Brand Voice solves it — here's how.",
    meta_title: "Brand Voice AI Explained (2026)",
    meta_description: "What Brand Voice AI actually does, how it works under the hood, and why it's the difference between AI content that lands and AI content that flatlines.",
    category_id: CAT.ai,
    cover_image_url: COVER("1488229297570-58520851e868"),
    reading_time_minutes: 5,
    daysAgo: 20,
    content_md: `# Brand Voice AI: What It Is and Why It Matters in 2026

If you've used AI to write social content and quietly stopped because everything came out sounding like a LinkedIn corporate email — Brand Voice is the feature that fixes that.

## What it actually is

Brand Voice is a layer that sits between your prompt and the model. You give it 3–10 examples of your real writing. It extracts a structured profile of your style — sentence length, vocabulary, rhythm, opener patterns, punctuation quirks, even how you use parentheses.

That profile then runs *every* generation through a transformer pass that nudges the output toward your style, while keeping the underlying content intact.

The result: AI output that sounds like *you*, not like a competent stranger.

## Why generic AI fails for content

Out-of-the-box LLMs are trained to be helpful, polite, balanced and slightly verbose. That's perfect for assistants. It's poison for social content, where being polarizing, sharp and weirdly specific is what gets engagement.

Brand Voice rebalances the output away from "competent assistant" toward "specific human with a take."

## How PostSpark implements it

Inside PostSpark, Brand Voice works like this:

1. Paste 3–10 of your real posts (LinkedIn, X, blog excerpts — anything written by you).
2. We extract a style summary: tone, sentence rhythm, vocabulary, hook patterns, emoji policy, punctuation quirks.
3. Every Pro generation gets the style summary injected into the system prompt.
4. The model produces content that lands on your voice without you re-prompting.

It's a Pro feature ($24/mo or [$97 lifetime](https://postspark.co/deals/lifetime)). Brand Voice without the rest of the platform doesn't make sense, so we don't sell it standalone.

## What Brand Voice doesn't fix

- Bad input. If you feed it a thin outline, you get a thin post in your voice.
- Wrong topic for your audience.
- Generic strategy. Voice is texture; strategy is gravity.

## What Brand Voice quietly fixes

- The "this sounds like AI" gut reaction your audience has within two sentences.
- Inconsistency between platforms — same person, suddenly different voice.
- The hour you spend manually rewriting AI drafts to feel like you.

[Try it free →](https://postspark.co/signup)
`,
  },
  {
    slug: "podcast-to-50-pieces-content-workflow",
    title: "From Podcast to 50 Pieces of Content: The Full Workflow",
    excerpt: "The exact 50-piece content workflow we run on every PostSpark podcast episode — and how long each step actually takes.",
    meta_title: "Podcast → 50 Pieces of Content (Full Workflow)",
    meta_description: "Step-by-step workflow for turning a single podcast episode into 50 platform-ready pieces of content. With time estimates and tool recommendations.",
    category_id: CAT.workflows,
    cover_image_url: COVER("1478737270239-2f02b77fc618"),
    reading_time_minutes: 6,
    daysAgo: 23,
    content_md: `# From Podcast to 50 Pieces of Content: The Full Workflow

One 45-minute podcast episode is roughly the same content density as five blog posts. Here's how to mine all of it.

## The 50-piece breakdown

- 10 short vertical clips (OpusClip auto-detect)
- 3 PostSpark Shorts scripts (for clips OpusClip missed)
- 8 X posts (mix of quotes, lessons, contrarian moments)
- 2 X threads (deep-dive moments)
- 6 LinkedIn long-form posts
- 3 LinkedIn carousels
- 5 Instagram captions paired with quote cards
- 4 newsletter sections
- 2 blog posts (recap + expanded essay)
- 5 quote graphics
- 2 YouTube comments / Reddit replies in relevant communities

## The workflow

### Step 1 — Transcribe (10 min)

Use whatever transcript provider is in your audio tool. AssemblyAI or Whisper are fine. Don't skip diarization — it makes everything downstream easier.

### Step 2 — Mark moments (15 min)

Listen back at 1.5x. Mark every moment that's quotable, controversial, surprising, or a clear lesson. Aim for 25+ marked moments.

### Step 3 — Auto-clip the obvious wins (5 min, OpusClip)

Run the full episode through OpusClip. You'll get 8–12 auto-detected clips ready to post.

### Step 4 — Repurpose into written content (10 min, PostSpark)

Paste the full transcript into [PostSpark](https://postspark.co/dashboard/repurpose). Pick: 8 tweets, 2 threads, 6 LinkedIn posts, 3 carousels, 5 IG captions, 4 newsletter sections, 2 blog drafts.

That's 30 written pieces generated in about 90 seconds.

### Step 5 — Script the missed clips (10 min)

Take 3 marked moments OpusClip ignored. Run each through [PostSpark Shorts Studio](https://postspark.co/dashboard/shorts-studio) to get scripts. Re-record those in a 20-minute studio session.

### Step 6 — Generate quote graphics (15 min)

5 strongest one-liners → Image Studio or Canva. Paste, post, done.

### Step 7 — Distribute across 21 days (5 min/day)

Schedule it all across three weeks. Reuse top-performers as quote retweets on week 4.

## Total time

About 1 hour 5 minutes of content work for 50 pieces. Compared to writing 50 pieces from scratch (~50+ hours), that's a 40x return on the episode you've already recorded.

## What kills this workflow

- Trying to publish all 50 in one week → algorithm fatigue.
- Skipping the marking step → repurposers get less to work with.
- Manually rewriting AI output to sound like you → why we built [Brand Voice](https://postspark.co/dashboard/brand-voice).

[Start free →](https://postspark.co/signup)
`,
  },
  {
    slug: "repurposing-beats-content-creation-2026",
    title: "Why Content Repurposing Beats Content Creation in 2026",
    excerpt: "Volume isn't the bottleneck anymore. Distribution is. Here's the strategic case for repurposing over creating.",
    meta_title: "Repurposing > Creation: The 2026 Case",
    meta_description: "Why repurposing existing content outperforms creating new content for solo creators in 2026 — with data, examples and counter-arguments.",
    category_id: CAT.repurposing,
    cover_image_url: COVER("1486312338219-ce68d2c6f44d"),
    reading_time_minutes: 6,
    daysAgo: 27,
    content_md: `# Why Content Repurposing Beats Content Creation in 2026

For the first 15 years of internet content, the bottleneck was creation. You couldn't write enough. Cameras were expensive. Editing was hard.

In 2026, the bottleneck is the opposite: too much content, not enough distribution. Most creators publish less than 5% of what they could from each piece of work they make. The compounding cost is enormous.

## The math nobody runs

Say you publish one 60-minute video per week.

- Without repurposing: 1 video + maybe 2 social posts about it. 3 pieces total. 156 pieces/year.
- With repurposing (30 pieces per source): 30 pieces × 52 = **1,560 pieces/year**.

Same effort. 10x output. Same audience can only see so much, so the gain isn't 10x reach — it's roughly 3–4x. Still enormous.

## The objection: doesn't the audience see the same thing twice?

Almost never. Cross-platform audience overlap is under 15% for most creators. Even *same-platform* impression overlap is well under 30% in 2026 because algorithms aggressively diversify.

The piece you posted on LinkedIn Monday is new to 85% of your X audience and 92% of your IG audience.

## Why repurposing beats creating (for distribution)

1. **Already validated.** If the source piece performed, the angles in it are pre-validated.
2. **Lower cognitive load.** Rewriting an existing idea is half the work of inventing a new one.
3. **Platform-native rewriting beats cross-posting** — the same caption on LinkedIn, X and IG underperforms a rewritten version every time.
4. **You compound on your back catalog.** A 2-year-old blog post can fuel social content this week.

## When creation still wins

- Net-new ideas (you have to make them first to repurpose them).
- Time-sensitive reactions to news.
- Personal posts that don't translate from another format.

## What repurposing looks like in practice

The mistake most creators make is "repurposing" = "cross-posting the same caption everywhere." That's not repurposing, that's lazy.

Real repurposing rewrites the *same idea* into the language of each platform:

- LinkedIn: composed, slightly authoritative, paragraphs with breathing room.
- X: punchy, lowercase, one idea per tweet.
- TikTok: spoken first, written second, pattern-interrupt hook.
- IG carousel: visual hierarchy, slide-by-slide payoff.
- Newsletter: longer, conversational, links out.

Tools like [PostSpark](https://postspark.co) bake this in by default — different output per platform from the same source.

## The unfair advantage

Once you adopt a repurposing workflow, the asymmetry compounds: every new source piece you create gets 10x distribution, every old piece can be re-mined. After 12 months, your back catalog becomes a content engine.

[Start free →](https://postspark.co/signup)
`,
  },
  {
    slug: "complete-guide-linkedin-carousels-2026",
    title: "The Complete Guide to LinkedIn Carousels in 2026",
    excerpt: "What works, what's dead, and the exact 10-slide structure we use for every PostSpark carousel.",
    meta_title: "LinkedIn Carousels 2026 — Complete Guide",
    meta_description: "The 2026 guide to LinkedIn carousels: ideal length, hook design, slide structure, and how to generate them in under 60 seconds.",
    category_id: CAT.workflows,
    cover_image_url: COVER("1611224923853-80b023f02d71"),
    reading_time_minutes: 7,
    daysAgo: 30,
    content_md: `# The Complete Guide to LinkedIn Carousels in 2026

LinkedIn carousels (technically "document posts") are still one of the highest-engagement formats on the platform in 2026. They get saved, re-opened, and slowly compound impressions for weeks after publishing.

But the format has matured. What worked in 2023 — heavy emojis, 15+ slides, cliché topics — actively hurts now.

Here's what works *today*.

## What's changed in 2026

- Sweet spot is **7–10 slides**, down from 12–15.
- **Single-message slides** beat dense slides. One sentence per slide is fine.
- **Saves > likes** as the ranking signal LinkedIn weights most.
- **Cover slide is everything.** 80% of swipe rate is decided by the cover.
- **Last slide must have a CTA.** Without it, the algorithm sees it as a dead-end.

## The 10-slide structure that works

1. **Cover** — bold headline + 2-word teaser. Stops the scroll.
2. **The problem** — concrete pain in one sentence.
3. **Why it matters** — the cost of not solving it.
4. **The reframe** — your counter-intuitive take.
5. **Step 1** — first concrete action.
6. **Step 2** — second concrete action.
7. **Step 3** — third concrete action.
8. **The result** — what changes when you do this.
9. **The catch** — honest caveat (this builds trust).
10. **CTA** — save / follow / comment a keyword.

## Design that ranks

- **One typeface.** Two max.
- **High contrast.** Skip the "designer" cream backgrounds.
- **Off-white background** (#FAFAF8) beats pure white — easier on screen at 4 AM scrolls.
- **Bottom-right number** ("3 of 10") boosts completion rate.
- **No watermarks** until you have 50k+ followers — looks insecure.

## Topic ideas that consistently land

- *N things I wish I knew before X*
- *The framework I use to decide Y*
- *Why most people get Z wrong*
- *N tools / templates / frameworks for X*
- *A before/after walkthrough of a real example*

## Topic ideas that died in 2026

- Generic motivational quote carousels.
- "Top N apps for productivity" — flooded.
- AI-generated everything without a perspective.
- Anything that sounds like a SlideShare from 2018.

## Generating carousels at scale

Drafting a 10-slide carousel by hand takes 60–90 minutes. [PostSpark Carousel Generator](https://postspark.co/dashboard/carousel) drafts the full 10-slide copy in ~30 seconds — you bring the design.

Pro tip: write the cover slide *last*, after the body slides exist. The cover should advertise the actual payoff, not promise something the body doesn't deliver.

## Posting cadence

One quality carousel per week beats three rushed ones. LinkedIn rewards saves slowly — give each carousel 7–14 days to accumulate.

[Try PostSpark free →](https://postspark.co/signup)
`,
  },
];

async function run() {
  for (const p of POSTS) {
    const published_at = new Date(Date.now() - p.daysAgo * 86400000).toISOString();
    const row = {
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      content_md: p.content_md,
      cover_image_url: p.cover_image_url ?? null,
      author_id: AUTHOR_ID,
      category_id: p.category_id,
      status: "published",
      published_at,
      reading_time_minutes: p.reading_time_minutes,
      meta_title: p.meta_title ?? p.title,
      meta_description: p.meta_description ?? p.excerpt,
    };
    const { error } = await supabase
      .from("blog_posts")
      .upsert(row, { onConflict: "slug" });
    if (error) {
      console.error("FAIL", p.slug, error.message);
    } else {
      console.log("OK", p.slug);
    }
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
