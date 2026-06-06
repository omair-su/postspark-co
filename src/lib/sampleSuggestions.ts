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

// Role-tailored "first content pack" presets — used by onboarding and the
// dashboard empty state to get a new user to value in under 2 minutes.
export type RolePreset = {
  role: string;
  title: string;
  emoji: string;
  tone: string;
  selectedTypes: string[];
  guidance: string;
  sampleText: string;
};

export const ROLE_PRESETS: Record<string, RolePreset> = {
  agency: {
    role: "agency",
    title: "Agency client case study",
    emoji: "🏢",
    tone: "professional",
    selectedTypes: ["linkedin", "thread", "email", "carousel"],
    guidance:
      "Position as a credible agency. Lead with the client outcome, show the process, and end with a soft CTA to work with us.",
    sampleText:
      "Case study: We helped a B2B SaaS client grow inbound demos by 3.2x in 90 days.\n\nProblem: Their LinkedIn was a graveyard — 1-2 posts a month, mostly product updates, almost no engagement.\n\nWhat we changed:\n1. Built a content engine around 3 pillars: founder lessons, customer wins, and contrarian industry takes.\n2. Repurposed every long-form piece into 6 native formats (LinkedIn, X thread, newsletter, carousel, short video, email).\n3. Shipped daily for 12 weeks straight with a tight approval loop.\n\nResult: 4.1M impressions, 18K new followers, 62 qualified demos booked directly from content.\n\nLesson for other agencies: clients don't pay for posts. They pay for pipeline. Tie every piece of content to a number that shows up in their revenue meeting.",
  },
  creator: {
    role: "creator",
    title: "Creator playbook",
    emoji: "✍️",
    tone: "casual",
    selectedTypes: ["tweets", "thread", "linkedin", "instagram"],
    guidance:
      "Punchy, hook-driven, first-person voice. Use short sentences, examples, and a clear takeaway readers can apply today.",
    sampleText:
      "I grew from 0 to 50,000 followers in 11 months without a single viral hit.\n\nHere's the boring system that actually worked:\n\n1. I picked ONE topic (creator monetization) and refused to post about anything else for 6 months.\n2. Every Monday, I wrote one long-form essay (~1,500 words). That essay became:\n   - 8-10 standalone tweets\n   - 1 thread\n   - 1 LinkedIn post\n   - 1 carousel\n   - 1 newsletter intro\n3. I replied to 20 accounts every morning before posting anything of my own. Distribution > creation.\n4. I tracked one number: replies per post. Not likes. Replies meant the idea landed.\n\nThe big lesson: consistency beats genius. Most creators quit at month 3, right before the algorithm starts trusting them.",
  },
  founder: {
    role: "founder",
    title: "Founder lesson",
    emoji: "🚀",
    tone: "storyteller",
    selectedTypes: ["thread", "linkedin", "email", "tweets"],
    guidance:
      "Write like a founder sharing a hard-earned lesson. Be specific, vulnerable, and end with a takeaway for other builders.",
    sampleText:
      "We almost killed our SaaS last year by listening to the wrong customers.\n\nWe were 18 months in, $14K MRR, and our 5 biggest customers kept asking for enterprise features: SSO, audit logs, custom roles, dedicated support.\n\nSo we built it. 4 months of engineering. Zero new revenue.\n\nMeanwhile, 200+ self-serve users were quietly churning because we'd ignored the onboarding for a year. The product was getting harder to use for the people who actually paid us on time.\n\nWhat I'd tell my younger self:\n- Loud customers are not your best customers.\n- The feature 5 people demand is usually less valuable than the friction 500 people silently tolerate.\n- Talk to churned users every week. They tell you the truth your active users won't.\n\nWe killed the enterprise tier, rebuilt onboarding in 3 weeks, and tripled activation. MRR finally started moving again.",
  },
  freelancer: {
    role: "freelancer",
    title: "Freelancer positioning post",
    emoji: "💼",
    tone: "bold",
    selectedTypes: ["linkedin", "tweets", "email"],
    guidance:
      "Position the freelancer as an expert, not a vendor. Lead with a strong opinion, back it with results, and end with a clear way to hire them.",
    sampleText:
      "Most freelance designers are stuck at $3K projects because they sell pixels instead of outcomes.\n\nHere's how I went from $2.5K logo gigs to $25K brand sprints in 14 months — same skills, completely different positioning.\n\n1. I stopped saying 'I design logos.' I started saying 'I help DTC brands look like the category leader before they actually are.'\n2. I built one signature offer: a 2-week brand sprint with a fixed price, fixed deliverables, and a guaranteed outcome.\n3. I wrote in public about every project — what worked, what didn't, what the client did with the assets after launch.\n4. I raised my price every 3 clients until someone said no. Then I held there for 60 days and raised again.\n\nFreelancers don't get paid more for working harder. They get paid more for being the obvious choice in a narrow lane.\n\nIf you're a founder building a DTC brand and you want yours to look like the leader of the category, DM me. I take 2 sprints a month.",
  },
};

export function getRolePreset(role?: string | null): RolePreset {
  if (!role) return ROLE_PRESETS.creator;
  const key = role.toLowerCase();
  if (key.includes("agency")) return ROLE_PRESETS.agency;
  if (key.includes("founder") || key.includes("indie")) return ROLE_PRESETS.founder;
  if (key.includes("freelanc")) return ROLE_PRESETS.freelancer;
  if (key.includes("creator")) return ROLE_PRESETS.creator;
  if (key.includes("market")) return ROLE_PRESETS.agency;
  if (key.includes("coach") || key.includes("consult")) return ROLE_PRESETS.freelancer;
  return ROLE_PRESETS.creator;
}
