
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS is_official boolean NOT NULL DEFAULT false;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS platform text;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS preview_text text;
ALTER TABLE public.templates ALTER COLUMN user_id DROP NOT NULL;

-- Officials are publicly visible: ensure flag implies is_public
UPDATE public.templates SET is_public = true WHERE is_official = true AND is_public = false;

CREATE INDEX IF NOT EXISTS idx_templates_official ON public.templates(is_official) WHERE is_official = true;

-- Seed PostSpark Official templates (idempotent on slug)
INSERT INTO public.templates
  (user_id, name, description, category, platform, tone, custom_instructions, is_official, is_public, preview_text, use_count, selected_types, slug)
VALUES
(NULL, 'Founder Story Thread', 'Turn a personal founder experience into a 10-tweet story thread', 'thread', 'Twitter/X', 'storytelling',
 'Write as a founder sharing a raw, honest experience. Open with a bold statement. Each tweet advances the story. End with a lesson. No hashtags. No emojis. Use line breaks for punchy rhythm.',
 true, true,
 'I almost shut down my company 3 months in. Here''s the moment that changed everything (and what I wish I knew on day 1)...',
 2847, '["thread"]'::jsonb, 'founder-story-thread'),

(NULL, 'LinkedIn Authority Post', 'Position yourself as an industry expert with a data-driven insight', 'social', 'LinkedIn', 'professional',
 'Write in first person. Open with a counterintuitive statement. Back it up with 2-3 specific insights. Use 1-2 line paragraphs. End with a CTA question. Under 600 words. No corporate jargon.',
 true, true,
 'Most founders price their SaaS wrong from day one. Here''s the data that changed how we think about pricing...',
 1923, '["linkedin"]'::jsonb, 'linkedin-authority-post'),

(NULL, 'Viral Twitter Hook Pack', '10 scroll-stopping hooks for any topic — ready to A/B test', 'social', 'Twitter/X', 'bold',
 'Generate exactly 10 hooks. Mix question hooks, stat hooks, story hooks, and contrarian hooks. Each must be under 140 characters. Start with the strongest word. No filler. Rank by estimated engagement.',
 true, true,
 'Hook 1: "Most people waste their first hour of work doing the wrong thing." Hook 2: "I tracked every hour of my 6-figure freelance year..."',
 3641, '["tweets"]'::jsonb, 'viral-twitter-hook-pack'),

(NULL, 'Instagram Carousel Captions', '10-slide carousel captions that educate and convert', 'social', 'Instagram', 'educational',
 'Write 10 captions for a carousel. Slide 1: hook that makes people swipe. Slides 2-9: one insight per slide, max 3 lines each. Slide 10: CTA. Use simple language. Include relevant emojis on each slide.',
 true, true,
 'Slide 1: 🔥 5 things I wish I knew before starting my business. Slide 2: 1/ The market doesn''t care about your idea...',
 1456, '["instagram"]'::jsonb, 'instagram-carousel-captions'),

(NULL, 'TikTok Video Hook Script', '60-second TikTok script with a viral-ready opening hook', 'video', 'TikTok', 'casual',
 'Write a 60-second spoken script. First 3 seconds: bold hook that creates tension. Body: deliver the value in 45 seconds with short punchy sentences. CTA: 12 seconds. Add [PAUSE] markers for delivery.',
 true, true,
 '[HOOK] Stop scrolling. I made $50k last month working 4 hours a day. Here''s exactly how — no fluff, no BS...',
 2103, '["tiktok","video"]'::jsonb, 'tiktok-video-hook-script'),

(NULL, 'Facebook Community Post', 'Engagement-focused post for Facebook Groups and Pages', 'social', 'Facebook', 'casual',
 'Write a post that sparks conversation. Ask a genuine question. Share a relatable struggle or win. Keep it under 250 words. Use natural language. End with an open-ended question.',
 true, true,
 'Real talk: I spent 6 months building a product nobody wanted. What''s the most valuable mistake you''ve made in your business?',
 892, '["facebook"]'::jsonb, 'facebook-community-post'),

(NULL, 'Weekly Wisdom Newsletter', 'Curated insights newsletter with 3 key lessons', 'newsletter', 'Email', 'professional',
 'Structure: Subject line (curiosity + benefit). Opener (1 paragraph personal story). 3 numbered insights (each 50-80 words with a bold title). Closing CTA. Sign-off. Total: 400-500 words.',
 true, true,
 'Subject: The counterintuitive thing I learned about pricing this week. This week I made a mistake that taught me more than 3 years of "doing it right"...',
 1734, '["email"]'::jsonb, 'weekly-wisdom-newsletter'),

(NULL, 'Product Launch Email Sequence', '3-email launch sequence — teaser, launch day, last chance', 'newsletter', 'Email', 'bold',
 'Write 3 emails: Email 1 (teaser - build anticipation, no reveal), Email 2 (launch day - full offer, benefits, CTA), Email 3 (last chance - urgency, overcome objections). Each email under 300 words.',
 true, true,
 'Email 1 Subject: Something big is coming... Email 2 Subject: It''s live — [Product Name] is here',
 987, '["email"]'::jsonb, 'product-launch-email-sequence'),

(NULL, 'Newsletter Deep Dive', 'Long-form newsletter section that establishes authority', 'newsletter', 'Email', 'educational',
 'Write a newsletter deep-dive section. 400-600 words. Start with a surprising fact or question. Teach one concept thoroughly. Include a practical "try this today" section. End with a related insight.',
 true, true,
 'The thing about growth that no one talks about: it''s not linear, it''s episodic. Here''s what I mean...',
 654, '["email"]'::jsonb, 'newsletter-deep-dive'),

(NULL, 'Lessons Learned Thread', 'Powerful "X things I learned from Y" format thread', 'thread', 'Twitter/X', 'inspirational',
 'Write a 12-tweet thread. Tweet 1: hook with specific number and outcome. Tweets 2-11: one lesson each, bold statement first, then context. Tweet 12: summary + CTA. Each tweet standalone-readable.',
 true, true,
 '12 lessons from building 3 startups in 5 years (most founders learn these the hard way):',
 4201, '["thread"]'::jsonb, 'lessons-learned-thread'),

(NULL, 'Contrarian Take Thread', 'Challenge conventional wisdom and make people think', 'thread', 'Twitter/X', 'bold',
 'Write a 10-tweet thread that challenges a popular belief. Tweet 1: state the conventional wisdom then flip it. Tweets 2-8: evidence, examples, and reasoning. Tweet 9: nuance. Tweet 10: the real takeaway.',
 true, true,
 'Unpopular opinion: "Follow your passion" is terrible advice. Here''s what works instead (and why the data backs this up):',
 3102, '["thread"]'::jsonb, 'contrarian-take-thread'),

(NULL, 'How I Did It Thread', 'Step-by-step breakdown of achieving a specific result', 'thread', 'Twitter/X', 'storytelling',
 'Write a 15-tweet breakdown thread. Tweet 1: state the result with specific numbers. Tweets 2-14: one step per tweet, numbered, with the WHY not just the WHAT. Tweet 15: lessons + mistakes.',
 true, true,
 'How I grew from 0 to 10,000 newsletter subscribers in 90 days (exact steps, no vague advice):',
 5847, '["thread"]'::jsonb, 'how-i-did-it-thread'),

(NULL, 'YouTube Video Script', 'Full 8-minute YouTube video script with chapters', 'video', 'YouTube', 'educational',
 'Write a complete video script. Hook (30 sec): bold promise. Intro (60 sec): who this is for + what they''ll learn. Main content (5 min): 3 sections with examples. CTA (30 sec). Include [B-ROLL] notes.',
 true, true,
 '[HOOK] In the next 8 minutes, I''m going to show you exactly how I [result]. [B-ROLL: Screen recording of result]...',
 1203, '["video"]'::jsonb, 'youtube-video-script'),

(NULL, 'Reels/Shorts Script', '30-second vertical video script for Reels, Shorts, TikTok', 'video', 'Instagram', 'bold',
 'Write a 30-second spoken script. [0-3 sec] Hook: one bold sentence. [3-20 sec] Value: 2-3 punchy points. [20-28 sec] Reveal/payoff. [28-30 sec] CTA. Mark [PAUSE] and [EMPHASIS] points.',
 true, true,
 '[0-3s] The one thing successful people never tell you... [PAUSE]',
 2341, '["video","instagram","tiktok"]'::jsonb, 'reels-shorts-script'),

(NULL, 'Product Hunt Launch Post', 'Compelling Product Hunt launch copy that gets upvotes', 'launch', 'Other', 'professional',
 'Write: Tagline (under 60 chars), Intro paragraph (what + why you built it, 100 words), 3 key features (one sentence each), "Who is it for?" section, Maker comment (personal note, 150 words).',
 true, true,
 'PostSpark — Turn one piece of content into a week of posts, in seconds. Hey PH! I built this after spending 4 hours repurposing one blog post...',
 1876, '["seo"]'::jsonb, 'product-hunt-launch-post'),

(NULL, 'Cold DM/Email Outreach', 'Short, non-salesy outreach message that gets replies', 'launch', 'Email', 'casual',
 'Write a cold outreach message. Under 100 words. Research-based opener (reference specific work). One-sentence value prop. Soft CTA (question, not pitch). No "I hope this finds you well". No attachments.',
 true, true,
 'Hey [Name], saw your thread on pricing SaaS products — the point about value-based pricing resonated. Quick question: how do you currently handle content for [Company]?',
 2654, '["email"]'::jsonb, 'cold-dm-email-outreach')
ON CONFLICT (slug) DO NOTHING;
