// Sample inputs used by Onboarding auto-run and Dashboard "Suggest Content" widget.

export type SampleSuggestion = {
  id: string;
  title: string;
  emoji: string;
  description: string;
  text: string;
};

export const SAMPLE_SUGGESTIONS: SampleSuggestion[] = [
  {
    id: "founder-lesson",
    title: "Founder lesson",
    emoji: "🚀",
    description: "Turn a hard-won lesson into a thread, LinkedIn post, and email.",
    text:
      "After 3 years of building my SaaS, here's the one lesson I wish I learned sooner: " +
      "your first 100 customers will not come from product features — they will come from " +
      "showing up consistently in one channel and being genuinely useful before you ever " +
      "ask for the sale. I spent year one obsessing over a perfect feature roadmap. " +
      "What actually moved revenue: writing 3 honest posts a week, replying to every comment, " +
      "and shipping small wins publicly. Distribution beats polish in the early days.",
  },
  {
    id: "creator-hook",
    title: "Creator playbook",
    emoji: "✍️",
    description: "Repurpose a content tip into multiple platforms instantly.",
    text:
      "The hook is 80% of your post. Here's how I write hooks that stop the scroll: " +
      "1) Promise a specific outcome, not a vague benefit. " +
      "2) Use a number — odd numbers convert better than round ones. " +
      "3) Lead with the pain your reader felt yesterday, not a generic problem. " +
      "4) Cut every word that isn't earning its place. " +
      "If your first line doesn't make the reader curious about line two, nothing else matters.",
  },
  {
    id: "product-launch",
    title: "Product launch",
    emoji: "🎉",
    description: "Announce a new feature across X, LinkedIn, and email.",
    text:
      "Today we're launching our biggest update yet. Three things changed: " +
      "First, our new editor is 4x faster and works offline. " +
      "Second, we added one-click publishing to LinkedIn and X. " +
      "Third, every paid plan now includes unlimited brand voices. " +
      "We built this because our users told us the editor was the #1 thing slowing them down. " +
      "Free users get the new editor today. Paid users also get publishing and brand voices.",
  },
  {
    id: "marketing-tip",
    title: "Marketing tip",
    emoji: "📈",
    description: "Convert a marketing insight into shareable formats.",
    text:
      "Stop writing for everyone. The best-performing content I've ever shipped was written " +
      "for one specific person — usually a customer I had just talked to. When you write to " +
      "one person, your message gets sharper, your examples get concrete, and your tone gets " +
      "human. The irony: writing for one person is what makes content resonate with thousands. " +
      "Generic content gets generic results. Specific content gets shared.",
  },
];
