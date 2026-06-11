// Central catalog of public marketing tools/features/alternatives/use-cases.
// Drives navbar dropdown, footer columns, homepage grid, related-tools widget,
// and breadcrumbs labelling. Search volumes are Semrush US monthly estimates
// (refreshed 2026-06) — kept here so titles can be tuned against demand.

export type ToolCatalogEntry = {
  path: string;
  name: string;
  short: string;
  emoji: string;
  category: "Tools" | "Features" | "Compare" | "Solutions";
  volume?: number; // monthly US searches, Semrush estimate
};

export const TOOLS_CATALOG: ToolCatalogEntry[] = [
  // High-volume tools
  { path: "/tools/ai-image-generator", name: "AI Image Generator", short: "Platform-sized AI images, brand-matched.", emoji: "🎨", category: "Tools", volume: 823000 },
  { path: "/tools/youtube-thumbnail-maker", name: "YouTube Thumbnail Maker", short: "Click-worthy thumbnails in seconds.", emoji: "🖼️", category: "Tools", volume: 5400 },
  { path: "/tools/linkedin-video-downloader", name: "LinkedIn Video Downloader", short: "Save any public LinkedIn video as MP4.", emoji: "⬇️", category: "Tools", volume: 2400 },
  { path: "/tools/hook-generator", name: "Hook Generator", short: "Scroll-stopping first lines for any post.", emoji: "🪝", category: "Tools", volume: 1600 },
  { path: "/tools/podcast-transcript-generator", name: "Podcast Transcript Generator", short: "Accurate transcripts + show notes.", emoji: "🎙️", category: "Tools", volume: 480 },
  { path: "/tools/reply-generator", name: "Reply Generator", short: "On-brand replies that grow your reach.", emoji: "💬", category: "Tools", volume: 390 },
  { path: "/tools/youtube-to-blog", name: "YouTube → Blog", short: "Turn videos into SEO-ready posts.", emoji: "▶️", category: "Tools", volume: 70 },
  { path: "/tools/blog-to-newsletter", name: "Blog → Newsletter", short: "Convert long-form into a newsletter.", emoji: "📧", category: "Tools", volume: 20 },
  { path: "/tools/youtube-to-twitter-thread", name: "YouTube → Tweet Thread", short: "Best moments as a viral thread.", emoji: "🧵", category: "Tools" },
  { path: "/tools/blog-to-linkedin-carousel", name: "Blog → LinkedIn Carousel", short: "Long-form into a swipeable carousel.", emoji: "📇", category: "Tools" },
  { path: "/tools/podcast-to-newsletter", name: "Podcast → Newsletter", short: "Episode highlights as an email.", emoji: "✉️", category: "Tools" },
  { path: "/tools/newsletter-to-social", name: "Newsletter → Social", short: "Recycle issues into platform posts.", emoji: "🔁", category: "Tools" },

  // Features (flagship)
  { path: "/features/linkedin-post-generator", name: "LinkedIn Post Generator", short: "Brand-voice LinkedIn posts at scale.", emoji: "💼", category: "Features", volume: 880 },
  { path: "/features/youtube-to-tweets", name: "YouTube → Tweets", short: "Auto-extract the best moments.", emoji: "🐦", category: "Features" },
  { path: "/features/repurpose-blog-to-social", name: "Blog → Social", short: "1 post → 30 platform-ready pieces.", emoji: "📝", category: "Features", volume: 390 },

  // Compare
  { path: "/alternatives/buffer-vs-postspark", name: "Buffer Alternative", short: "Writes posts, not just schedules.", emoji: "⚖️", category: "Compare", volume: 170 },
  { path: "/alternatives/hootsuite-vs-postspark", name: "Hootsuite Alternative", short: "Modern AI vs legacy scheduler.", emoji: "⚖️", category: "Compare", volume: 390 },
  { path: "/alternatives/typefully-vs-postspark", name: "Typefully Alternative", short: "Beyond Twitter — every platform.", emoji: "⚖️", category: "Compare", volume: 10 },
  { path: "/alternatives/chatgpt-for-content-repurposing", name: "vs ChatGPT", short: "Purpose-built vs generic chat.", emoji: "⚖️", category: "Compare" },
  { path: "/alternatives/jasper-vs-postspark", name: "vs Jasper", short: "Repurposing-first vs generic writer.", emoji: "⚖️", category: "Compare" },

  // Solutions
  { path: "/for/creators", name: "For Creators", short: "Solo creators going multi-platform.", emoji: "✨", category: "Solutions" },
  { path: "/for/agencies", name: "For Agencies", short: "Scale client content 10×.", emoji: "🏢", category: "Solutions" },
  { path: "/for/podcasters", name: "For Podcasters", short: "Every episode, 20 pieces of content.", emoji: "🎧", category: "Solutions" },
  { path: "/for/youtubers", name: "For YouTubers", short: "Turn videos into LinkedIn + X gold.", emoji: "📺", category: "Solutions" },
  { path: "/use-cases/linkedin-ghostwriters", name: "LinkedIn Ghostwriters", short: "Write 10× more in client voice.", emoji: "✍️", category: "Solutions" },
  { path: "/use-cases/podcast-to-social", name: "Podcast → Social", short: "Auto-clip + caption episodes.", emoji: "🎙️", category: "Solutions" },
  { path: "/use-cases/youtube-to-linkedin", name: "YouTube → LinkedIn", short: "Long video → executive post.", emoji: "📹", category: "Solutions" },
  { path: "/use-cases/content-repurposing-agencies", name: "Repurposing for Agencies", short: "White-label workflows.", emoji: "🏭", category: "Solutions" },
];

export function getRelatedTools(currentPath: string, count = 4): ToolCatalogEntry[] {
  const others = TOOLS_CATALOG.filter((t) => t.path !== currentPath);
  // Prefer same category first, then fill with high-volume picks.
  const current = TOOLS_CATALOG.find((t) => t.path === currentPath);
  const sameCat = current ? others.filter((t) => t.category === current.category) : [];
  const rest = others.filter((t) => !sameCat.includes(t));
  const sorted = [
    ...sameCat,
    ...rest.sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0)),
  ];
  return sorted.slice(0, count);
}

export function getCatalogByCategory(category: ToolCatalogEntry["category"]) {
  return TOOLS_CATALOG.filter((t) => t.category === category);
}
