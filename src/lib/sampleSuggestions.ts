// Sample inputs used by Onboarding auto-run and Dashboard "Suggest Content" widget.

export type SampleSuggestion = {
  id: string;
  title: string;
  emoji: string;
  description: string;
  guidance: string;
  selectedTypes: string[];
};

export const SAMPLE_SUGGESTIONS: SampleSuggestion[] = [
  {
    id: "founder-lesson",
    title: "Founder lesson",
    emoji: "🚀",
    description: "Set up a thread, LinkedIn post, and email from your own lesson.",
    guidance: "Turn the user's own founder lesson into practical, story-driven content with a clear takeaway and CTA.",
    selectedTypes: ["thread", "linkedin", "email"],
  },
  {
    id: "creator-hook",
    title: "Creator playbook",
    emoji: "✍️",
    description: "Prepare formats for your own content tip or playbook.",
    guidance: "Repurpose the user's own creator tip into punchy, actionable posts with strong hooks and examples.",
    selectedTypes: ["tweets", "linkedin", "instagram"],
  },
  {
    id: "product-launch",
    title: "Product launch",
    emoji: "🎉",
    description: "Set up launch formats for your own product or feature update.",
    guidance: "Turn the user's own product launch details into clear announcement copy with benefits, proof, and CTA.",
    selectedTypes: ["tweets", "linkedin", "email"],
  },
  {
    id: "marketing-tip",
    title: "Marketing tip",
    emoji: "📈",
    description: "Prepare formats for your own marketing insight.",
    guidance: "Convert the user's own marketing insight into concise, shareable, platform-native content.",
    selectedTypes: ["thread", "linkedin", "seo"],
  },
];
