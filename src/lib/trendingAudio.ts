export interface SoundEntry {
  name: string;
  bpm: number;
  vibe: string;
  search_hint: string;
}

export type Platform = "tiktok" | "shorts" | "reels";
export type Niche = "Tech" | "Fitness" | "Founder" | "Lifestyle" | "Marketing" | "Education";

export const NICHES: Niche[] = ["Tech", "Fitness", "Founder", "Lifestyle", "Marketing", "Education"];

type Catalog = Record<Niche, Record<Platform, SoundEntry[]>>;

export const TRENDING_AUDIO: Catalog = {
  Tech: {
    tiktok: [
      { name: "Lofi Café Study", bpm: 85, vibe: "calm focus", search_hint: "lofi café beats study tiktok" },
      { name: "Synthwave Drive", bpm: 110, vibe: "futuristic hype", search_hint: "synthwave neon drive tiktok" },
      { name: "Glitch Ambient", bpm: 90, vibe: "techy mysterious", search_hint: "glitch ambient tech tiktok" },
      { name: "Chill Phonk", bpm: 140, vibe: "edgy cool", search_hint: "chill phonk drift tiktok 2025" },
    ],
    shorts: [
      { name: "Retro Wave Pop", bpm: 120, vibe: "upbeat nostalgic", search_hint: "retrowave pop youtube shorts" },
      { name: "Lo-fi Hip Hop", bpm: 88, vibe: "relaxed productive", search_hint: "lofi hip hop chill shorts" },
      { name: "Cyberpunk Beats", bpm: 130, vibe: "intense futuristic", search_hint: "cyberpunk beats shorts 2025" },
      { name: "Acoustic Focus", bpm: 70, vibe: "clear calm", search_hint: "acoustic focus minimal shorts" },
    ],
    reels: [
      { name: "Tech Minimal House", bpm: 124, vibe: "sleek modern", search_hint: "tech house minimal reels instagram" },
      { name: "Phonk Energy", bpm: 135, vibe: "bold dramatic", search_hint: "phonk energy reels 2025" },
      { name: "Chill Trap Beat", bpm: 100, vibe: "laid-back cool", search_hint: "chill trap instrumental reels" },
      { name: "Lo-fi Beats to Code", bpm: 80, vibe: "focus productive", search_hint: "lofi beats coding reels" },
    ],
  },
  Fitness: {
    tiktok: [
      { name: "Hard Trap Gym", bpm: 150, vibe: "aggressive power", search_hint: "hard trap gym motivation tiktok" },
      { name: "Hype EDM Drop", bpm: 128, vibe: "explosive energy", search_hint: "edm drop hype workout tiktok" },
      { name: "Rap Workout Mix", bpm: 140, vibe: "raw intense", search_hint: "rap workout mix tiktok 2025" },
      { name: "Phonk Workout", bpm: 145, vibe: "dark powerful", search_hint: "phonk gym workout tiktok" },
    ],
    shorts: [
      { name: "EDM Motivational", bpm: 130, vibe: "uplifting high-energy", search_hint: "edm motivational workout shorts" },
      { name: "Hip Hop Push", bpm: 100, vibe: "gritty determined", search_hint: "hip hop gym push shorts" },
      { name: "Dubstep Power", bpm: 140, vibe: "intense drops", search_hint: "dubstep power workout shorts" },
      { name: "Trap Run", bpm: 155, vibe: "fast aggressive", search_hint: "trap run cardio shorts" },
    ],
    reels: [
      { name: "Pop Fitness Remix", bpm: 128, vibe: "fun upbeat", search_hint: "pop fitness remix reels 2025" },
      { name: "Latin Workout Heat", bpm: 135, vibe: "passionate energetic", search_hint: "latin workout heat reels" },
      { name: "R&B Body Goals", bpm: 95, vibe: "smooth confident", search_hint: "rnb body goals reels instagram" },
      { name: "House Cardio", bpm: 125, vibe: "steady groovy", search_hint: "house cardio reels" },
    ],
  },
  Founder: {
    tiktok: [
      { name: "Calm Piano Hustle", bpm: 75, vibe: "reflective driven", search_hint: "calm piano hustle founder tiktok" },
      { name: "Motivational Cinematic", bpm: 60, vibe: "epic inspiring", search_hint: "cinematic motivational founder tiktok" },
      { name: "Lo-fi Grind", bpm: 85, vibe: "determined quiet", search_hint: "lofi grind entrepreneur tiktok" },
      { name: "Upbeat Indie Pop", bpm: 118, vibe: "optimistic fresh", search_hint: "indie pop upbeat founder tiktok 2025" },
    ],
    shorts: [
      { name: "Cinematic Build", bpm: 65, vibe: "epic journey", search_hint: "cinematic build startup shorts" },
      { name: "Piano Motivation", bpm: 72, vibe: "emotional driving", search_hint: "piano motivation entrepreneur shorts" },
      { name: "Acoustic Hustle", bpm: 90, vibe: "authentic raw", search_hint: "acoustic hustle founder shorts" },
      { name: "Hip Hop Grind", bpm: 92, vibe: "ambitious street", search_hint: "hip hop grind startup shorts" },
    ],
    reels: [
      { name: "Soft Cinematic Hope", bpm: 68, vibe: "hopeful inspiring", search_hint: "soft cinematic hope entrepreneur reels" },
      { name: "Indie Hustle Pop", bpm: 112, vibe: "fresh ambitious", search_hint: "indie hustle pop founder reels 2025" },
      { name: "Deep House Work", bpm: 122, vibe: "focused sophisticated", search_hint: "deep house work reels founder" },
      { name: "Lo-fi CEO", bpm: 82, vibe: "calm authoritative", search_hint: "lofi ceo grind reels instagram" },
    ],
  },
  Lifestyle: {
    tiktok: [
      { name: "Dreamy Pop Vlog", bpm: 105, vibe: "airy aesthetic", search_hint: "dreamy pop vlog aesthetic tiktok" },
      { name: "Indie Morning Vibes", bpm: 95, vibe: "cozy warm", search_hint: "indie morning vibes lifestyle tiktok" },
      { name: "Aesthetic Synth", bpm: 100, vibe: "luxe visual", search_hint: "aesthetic synth lifestyle tiktok 2025" },
      { name: "Chill R&B Day", bpm: 88, vibe: "smooth confident", search_hint: "chill rnb lifestyle tiktok" },
    ],
    shorts: [
      { name: "Upbeat Travel Pop", bpm: 120, vibe: "adventurous bright", search_hint: "upbeat travel pop lifestyle shorts" },
      { name: "Sunny Acoustic", bpm: 92, vibe: "happy carefree", search_hint: "sunny acoustic lifestyle shorts" },
      { name: "Fashion House", bpm: 124, vibe: "chic cool", search_hint: "fashion house beat lifestyle shorts" },
      { name: "Chillhop Afternoon", bpm: 86, vibe: "relaxed golden", search_hint: "chillhop afternoon lifestyle shorts" },
    ],
    reels: [
      { name: "Aesthetic Pop Bop", bpm: 115, vibe: "trendy playful", search_hint: "aesthetic pop bop reels 2025" },
      { name: "Luxury Ambient", bpm: 78, vibe: "refined elegant", search_hint: "luxury ambient lifestyle reels" },
      { name: "Boho Guitar", bpm: 90, vibe: "earthy free", search_hint: "boho acoustic guitar reels instagram" },
      { name: "Summer Indie", bpm: 108, vibe: "nostalgic warm", search_hint: "summer indie vibes reels lifestyle" },
    ],
  },
  Marketing: {
    tiktok: [
      { name: "Hype Countdown Beat", bpm: 128, vibe: "urgent exciting", search_hint: "hype countdown beat marketing tiktok" },
      { name: "Bold Pop Ad Vibes", bpm: 118, vibe: "punchy commercial", search_hint: "bold pop ad marketing tiktok 2025" },
      { name: "Trap Commercial", bpm: 140, vibe: "modern edgy", search_hint: "trap commercial beat marketing tiktok" },
      { name: "Inspiring Acoustic Ad", bpm: 80, vibe: "authentic warm", search_hint: "inspiring acoustic ad tiktok marketing" },
    ],
    shorts: [
      { name: "Corporate Pop Win", bpm: 122, vibe: "confident professional", search_hint: "corporate pop win marketing shorts" },
      { name: "Motivational Strings", bpm: 70, vibe: "epic inspiring", search_hint: "motivational strings ad shorts" },
      { name: "Upbeat Whistle Jingle", bpm: 126, vibe: "catchy memorable", search_hint: "upbeat whistle jingle shorts marketing" },
      { name: "Hip Hop Brand", bpm: 96, vibe: "cool credible", search_hint: "hip hop brand beat shorts 2025" },
    ],
    reels: [
      { name: "Trendy Ad House", bpm: 126, vibe: "slick modern", search_hint: "trendy ad house beat reels 2025" },
      { name: "Pop Brand Anthem", bpm: 116, vibe: "big optimistic", search_hint: "pop brand anthem marketing reels" },
      { name: "Emotional Piano Ad", bpm: 66, vibe: "touching memorable", search_hint: "emotional piano ad reels instagram" },
      { name: "Retro Jingle Pop", bpm: 130, vibe: "nostalgic fun", search_hint: "retro jingle pop marketing reels" },
    ],
  },
  Education: {
    tiktok: [
      { name: "Lo-fi Study Session", bpm: 80, vibe: "focused calm", search_hint: "lofi study session tiktok education" },
      { name: "Upbeat Explainer Pop", bpm: 112, vibe: "friendly engaging", search_hint: "upbeat explainer pop education tiktok" },
      { name: "Curious Ukulele", bpm: 95, vibe: "playful wonder", search_hint: "curious ukulele education tiktok 2025" },
      { name: "Chill Tutorial Beat", bpm: 88, vibe: "clear relaxed", search_hint: "chill tutorial beat tiktok education" },
    ],
    shorts: [
      { name: "Smart Pop Piano", bpm: 105, vibe: "bright energetic", search_hint: "smart pop piano education shorts" },
      { name: "Lo-fi How-To", bpm: 84, vibe: "calm instructional", search_hint: "lofi how to tutorial shorts" },
      { name: "Bright Acoustic Fun", bpm: 100, vibe: "joyful approachable", search_hint: "bright acoustic education shorts" },
      { name: "Minimal Cinematic", bpm: 72, vibe: "serious thoughtful", search_hint: "minimal cinematic education shorts" },
    ],
    reels: [
      { name: "Indie Education Pop", bpm: 108, vibe: "engaging modern", search_hint: "indie education pop reels 2025" },
      { name: "Acoustic Learn", bpm: 88, vibe: "warm trustworthy", search_hint: "acoustic learn education reels instagram" },
      { name: "Lo-fi Knowledge", bpm: 82, vibe: "deep reflective", search_hint: "lofi knowledge reels education" },
      { name: "Upbeat Quiz Pop", bpm: 120, vibe: "fun competitive", search_hint: "upbeat quiz pop education reels" },
    ],
  },
};
