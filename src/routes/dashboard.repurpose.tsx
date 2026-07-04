import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { withAIProgress } from "@/lib/aiProgress";
import {
  Sparkles, Loader2, Copy, Check, RefreshCw, AlertTriangle, Download, Eye, FileText,
  Youtube, Link as LinkIcon, Calendar as CalendarIcon, Save, X, Repeat, Type as TypeIcon,
  Languages, Bookmark, Wand2, Circle, ChevronDown,
} from "lucide-react";
import { repurposeOneFormat, getMonthlyUsage, saveToSwipeFile } from "@/lib/repurpose.functions";
import { importFromUrl } from "@/lib/import.functions";
import { getBrandKit } from "@/lib/brandKit.functions";
import { createScheduledPost } from "@/lib/calendar.functions";
import { PostToTikTokButton } from "@/components/PostToTikTokButton";
import { PostToLinkedInButton } from "@/components/PostToLinkedInButton";
import { createTemplate } from "@/lib/templates.functions";
import { exportToPdf } from "@/lib/exportPdf";
import { useSubscription } from "@/hooks/useSubscription";
import { VisualPreview } from "@/components/VisualPreview";
import { ImportInputPanel } from "@/components/ImportInputPanel";
import { PublishMenu } from "@/components/PublishMenu";
import { HookABTester } from "@/components/HookABTester";
import { Link } from "@tanstack/react-router";

// -------- Format catalog (the new world-class spec) --------------------

type FormatId =
  | "tweets" | "linkedin" | "instagram" | "facebook"
  | "thread" | "email" | "video" | "tiktok"
  | "podcast" | "seo" | "carousel";

interface FormatDef {
  id: FormatId;
  name: string;
  emoji: string;
  group: "Social Media" | "Long-form" | "Discovery & SEO" | "Visual";
  quantities?: number[];     // numeric "How many?"
  defaultQty?: number;
  qtyLabel?: string;         // e.g. "Tweets", "Slides"
  styles?: string[];         // dropdown "Style"
  lengths?: string[];        // for video script
}

const FORMATS: FormatDef[] = [
  { id: "tweets",    name: "Twitter / X",    emoji: "🐦", group: "Social Media", quantities: [1,3,5,7,10,15,20], defaultQty: 5, qtyLabel: "Tweets",
    styles: ["Standalone tweets","Punchy (under 100 chars)","With hooks"] },
  { id: "linkedin",  name: "LinkedIn",       emoji: "💼", group: "Social Media", quantities: [1,2,3,5], defaultQty: 2, qtyLabel: "Posts",
    styles: ["Long-form story","Short insight","List post","Data-driven"] },
  { id: "instagram", name: "Instagram",      emoji: "📸", group: "Social Media", quantities: [3,5,7], defaultQty: 3, qtyLabel: "Captions",
    styles: ["With hashtags","Minimal","Story-style"] },
  { id: "facebook",  name: "Facebook",       emoji: "👍", group: "Social Media", quantities: [1,3,5], defaultQty: 3, qtyLabel: "Posts" },
  { id: "tiktok",    name: "TikTok / Reels", emoji: "🎵", group: "Social Media", quantities: [1,3,5], defaultQty: 3, qtyLabel: "Scripts" },

  { id: "thread",    name: "X Thread",       emoji: "🧵", group: "Long-form", quantities: [5,8,10,12,15,20], defaultQty: 10, qtyLabel: "Tweets" },
  { id: "email",     name: "Email Newsletter", emoji: "📧", group: "Long-form",
    styles: ["Newsletter","Promotional","Educational digest","Weekly roundup"] },
  { id: "video",     name: "Video Script",   emoji: "🎬", group: "Long-form",
    lengths: ["30 seconds","60 seconds","3 minutes","5 minutes","10 minutes"] },

  { id: "seo",       name: "SEO Summary",    emoji: "🔍", group: "Discovery & SEO",
    styles: ["Blog intro","Meta description","Full outline","FAQ section"] },
  { id: "podcast",   name: "Podcast Notes",  emoji: "🎙️", group: "Discovery & SEO",
    styles: ["Show notes + quotes","Episode summary","Chapters + timestamps"] },

  { id: "carousel",  name: "Carousel",       emoji: "🖼️", group: "Visual", quantities: [5,7,8,10,12,15], defaultQty: 8, qtyLabel: "Slides" },
];

const FORMAT_BY_ID = Object.fromEntries(FORMATS.map((f) => [f.id, f])) as Record<FormatId, FormatDef>;

const STYLE_MODIFIERS: { id: string; label: string }[] = [
  { id: "emojis", label: "Include emojis" },
  { id: "short_paragraphs", label: "Use short paragraphs (1-2 lines)" },
  { id: "hashtags", label: "Add hashtags" },
  { id: "hook_start", label: "Start with a hook/question" },
  { id: "numbered_lists", label: "Use numbered lists" },
  { id: "cta_end", label: "Include a CTA at the end" },
  { id: "first_person", label: "Write in first person" },
  { id: "human", label: "Keep it human (no AI-sounding phrases)" },
  { id: "stats", label: "Include statistics" },
  { id: "conversational", label: "Use conversational language" },
];

const TONES = [
  "professional","casual","humorous","inspirational","educational",
  "bold","storytelling","conversational","data-driven",
];

const POPULAR_LANGUAGES = [
  { flag: "🇺🇸", name: "English" }, { flag: "🇸🇦", name: "Arabic" },
  { flag: "🇵🇰", name: "Urdu" },    { flag: "🇪🇸", name: "Spanish" },
  { flag: "🇫🇷", name: "French" },   { flag: "🇩🇪", name: "German" },
  { flag: "🇧🇷", name: "Portuguese" }, { flag: "🇮🇳", name: "Hindi" },
  { flag: "🇯🇵", name: "Japanese" }, { flag: "🇰🇷", name: "Korean" },
];
const ALL_LANGUAGES = [
  "English","Spanish","French","German","Portuguese","Italian","Dutch","Polish","Swedish","Turkish",
  "Arabic","Urdu","Hindi","Bengali","Indonesian","Vietnamese","Thai","Japanese","Korean",
  "Chinese (Simplified)","Chinese (Traditional)","Russian","Ukrainian","Hebrew","Greek","Romanian",
  "Czech","Hungarian","Finnish","Norwegian","Danish",
];

const PLATFORM_MAP: Record<string, "twitter"|"linkedin"|"instagram"|"facebook"|"tiktok"|"youtube"|"blog"|"email"> = {
  tweets: "twitter", thread: "twitter", linkedin: "linkedin", instagram: "instagram",
  facebook: "facebook", tiktok: "tiktok", video: "youtube", email: "email",
  podcast: "blog", seo: "blog",
};

// -------- State types --------------------------------------------------

interface FormatPick { count?: number; style?: string; length?: string }
type FormatStatus = "idle" | "waiting" | "generating" | "done" | "error";

export const Route = createFileRoute("/dashboard/repurpose")({
  component: RepurposePage,
});

function RepurposePage() {
  const { user, session } = useAuth();
  const { tier } = useSubscription();

  // Source
  const [sourceTab, setSourceTab] = useState<"text"|"url"|"youtube"|"pdf"|"voice">("text");
  const [importSubTab, setImportSubTab] = useState<"url"|"pdf"|"docx"|"audio">("url");
  const [inputText, setInputText] = useState("");
  const [importMeta, setImportMeta] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [urlBusy, setUrlBusy] = useState(false);

  // Format selection
  const [picks, setPicks] = useState<Partial<Record<FormatId, FormatPick>>>(() => ({
    tweets:   { count: 5, style: "Standalone tweets" },
    linkedin: { count: 2, style: "Long-form story" },
    email:    { style: "Newsletter" },
    video:    { length: "60 seconds" },
  }));

  // Tone & style
  const [tone, setTone] = useState("professional");
  const [styleModifiers, setStyleModifiers] = useState<Set<string>>(new Set(["short_paragraphs","human"]));
  const [customInstructions, setCustomInstructions] = useState("");
  const [language, setLanguage] = useState("English");
  const [langQuery, setLangQuery] = useState("");

  // Brand kit
  const [brandKit, setBrandKit] = useState<{ brand_name: string|null; tagline: string|null; preferred_tone: string|null } | null>(null);
  const [overrideTone, setOverrideTone] = useState(false);

  // Usage
  const [usage, setUsage] = useState<{ used: number; limit: number; plan?: string } | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Generation
  const [statuses, setStatuses] = useState<Partial<Record<FormatId, FormatStatus>>>({});
  const [results, setResults] = useState<Partial<Record<FormatId, string>>>({});
  const [timings, setTimings] = useState<Partial<Record<FormatId, number>>>({});
  const [packId, setPackId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeOutputTab, setActiveOutputTab] = useState<FormatId | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<string>(() => {
    const d = new Date(); d.setDate(d.getDate()+1); return d.toISOString().slice(0,10);
  });
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [scheduleSpread, setScheduleSpread] = useState<"same"|"daily">("daily");
  const [scheduleBusy, setScheduleBusy] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateBusy, setTemplateBusy] = useState(false);

  // Bootstrap: usage + brand kit + URL params
  useEffect(() => {
    if (user && session) {
      const auth = { headers: { Authorization: `Bearer ${session.access_token}` } };
      getMonthlyUsage(auth).then(setUsage).catch(()=>{});
      getBrandKit(auth).then(({ kit }) => {
        if (kit) {
          setBrandKit({
            brand_name: (kit as any).brand_name ?? null,
            tagline: (kit as any).tagline ?? null,
            preferred_tone: (kit as any).preferred_tone ?? null,
          });
        }
      }).catch(()=>{});
    }
  }, [user, session]);

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const tpl = url.searchParams.get("tpl");
      if (tpl) {
        const p = new URLSearchParams(tpl);
        const t = p.get("tone"); const types = p.get("types"); const instr = p.get("instructions");
        if (t) setTone(t);
        if (types) {
          const next: Partial<Record<FormatId, FormatPick>> = {};
          types.split(",").forEach((id) => {
            const def = FORMAT_BY_ID[id as FormatId];
            if (def) next[def.id] = { count: def.defaultQty, style: def.styles?.[0], length: def.lengths?.[1] };
          });
          if (Object.keys(next).length) setPicks(next);
        }
        if (instr) setCustomInstructions(instr);
      }
      const imported = sessionStorage.getItem("postspark.import.text");
      if (imported) {
        setInputText(imported); setSourceTab("text");
        sessionStorage.removeItem("postspark.import.text");
      }
    } catch {}
  }, []);

  // -------- Derived state --------
  const selectedIds = useMemo(() => Object.keys(picks) as FormatId[], [picks]);
  const totalPieces = useMemo(() => {
    return selectedIds.reduce((sum, id) => {
      const def = FORMAT_BY_ID[id]; const pick = picks[id];
      if (def.quantities) return sum + (pick?.count || def.defaultQty || 1);
      return sum + 1;
    }, 0);
  }, [selectedIds, picks]);

  const qualityLabel: "Excellent"|"Good"|"Compressed" =
    selectedIds.length <= 4 ? "Excellent" : selectedIds.length <= 6 ? "Good" : "Compressed";
  const qualityPct = qualityLabel === "Excellent" ? 95 : qualityLabel === "Good" ? 55 : 25;
  const qualityClass = qualityLabel === "Excellent" ? "bg-emerald-500" : qualityLabel === "Good" ? "bg-amber-500" : "bg-red-500";

  const wordCount = useMemo(() => inputText.trim() ? inputText.trim().split(/\s+/).length : 0, [inputText]);
  const wordQuality: "too-short"|"good"|"too-long"|"empty" =
    wordCount === 0 ? "empty" : wordCount < 100 ? "too-short" : wordCount > 5000 ? "too-long" : "good";

  const isUnlimited = usage?.limit === -1;
  const remaining = usage && !isUnlimited ? usage.limit - usage.used : null;

  // -------- Actions --------
  const toggleFormat = (id: FormatId) => {
    setPicks((prev) => {
      const next = { ...prev };
      if (next[id]) { delete next[id]; }
      else {
        const def = FORMAT_BY_ID[id];
        next[id] = {
          count: def.defaultQty,
          style: def.styles?.[0],
          length: def.lengths?.[1] || def.lengths?.[0],
        };
      }
      return next;
    });
  };
  const updatePick = (id: FormatId, patch: FormatPick) => {
    setPicks((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };
  const toggleModifier = (id: string) => {
    setStyleModifiers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleFetchUrl = async (url: string) => {
    if (!session) return toast.error("Please sign in");
    if (!url.trim()) return toast.error("Paste a URL");
    setUrlBusy(true);
    try {
      const res = await importFromUrl({
        data: { url: url.trim() },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.error || !res.text) { toast.error(res.error || "Couldn't fetch that URL"); return; }
      setInputText(res.text);
      setImportMeta(res.title ? `From: ${res.title}` : `From: ${url}`);
      setSourceTab("text");
      toast.success("Content loaded");
    } finally { setUrlBusy(false); }
  };

  const handleGenerate = async () => {
    if (!session) return toast.error("Please sign in");
    if (!inputText.trim()) { toast.error("Add some source content first"); return; }
    if (selectedIds.length === 0) { toast.error("Choose at least one format"); return; }
    if (remaining !== null && remaining <= 0) { setShowUpgradeModal(true); return; }

    const newPackId = crypto.randomUUID();
    setPackId(newPackId);
    setResults({}); setTimings({});
    const initial: Partial<Record<FormatId, FormatStatus>> = {};
    selectedIds.forEach((id) => { initial[id] = "waiting"; });
    setStatuses(initial);
    setLoading(true);
    setActiveOutputTab(null);

    const useBrandTone = !!brandKit?.preferred_tone && !overrideTone;
    const effectiveTone = useBrandTone ? undefined : tone;
    const modifierLabels = Array.from(styleModifiers).map((id) => STYLE_MODIFIERS.find((m) => m.id === id)?.label || id);

    const authHeaders = { Authorization: `Bearer ${session.access_token}` };

    const runOne = async (formatId: FormatId, isFirst: boolean): Promise<void> => {
      setStatuses((s) => ({ ...s, [formatId]: "generating" }));
      const start = Date.now();
      try {
        const pick = picks[formatId] || {};
        const res = await repurposeOneFormat({
          data: {
            packId: newPackId,
            isFirstInPack: isFirst,
            inputText: inputText.slice(0, 50000),
            format: formatId,
            count: pick.count,
            style: pick.style,
            length: pick.length,
            tone: effectiveTone,
            styleModifiers: modifierLabels,
            customInstructions: customInstructions || undefined,
            language,
          },
          headers: authHeaders,
        });
        if (res.error) {
          if (res.error === "LIMIT_REACHED") {
            setShowUpgradeModal(true);
          }
          setStatuses((s) => ({ ...s, [formatId]: "error" }));
          toast.error(`${FORMAT_BY_ID[formatId].name}: ${res.error}`);
          return;
        }
        setResults((r) => ({ ...r, [formatId]: res.output }));
        setTimings((t) => ({ ...t, [formatId]: Math.round((Date.now() - start) / 100) / 10 }));
        setStatuses((s) => ({ ...s, [formatId]: "done" }));
        setActiveOutputTab((curr) => curr || formatId);
      } catch {
        setStatuses((s) => ({ ...s, [formatId]: "error" }));
      }
    };

    try {
      await withAIProgress((async () => {
        // First call must complete first (creates the pack row), then parallelize the rest.
        const [first, ...rest] = selectedIds;
        await runOne(first, true);
        await Promise.all(rest.map((id) => runOne(id, false)));
      })());

      if (session) {
        getMonthlyUsage({ headers: authHeaders }).then(setUsage).catch(()=>{});
      }
      try {
        if (typeof window !== "undefined" && localStorage.getItem("ps_pwa_ready_v1") !== "1") {
          localStorage.setItem("ps_pwa_ready_v1", "1");
          window.dispatchEvent(new Event("postspark:pwa-ready"));
        }
      } catch {}
      toast.success("Content pack ready");
    } finally {
      setLoading(false);
    }
  };

  const regenerateOne = async (formatId: FormatId) => {
    if (!session || !packId) return handleGenerate();
    setStatuses((s) => ({ ...s, [formatId]: "generating" }));
    const pick = picks[formatId] || {};
    const useBrandTone = !!brandKit?.preferred_tone && !overrideTone;
    const modifierLabels = Array.from(styleModifiers).map((id) => STYLE_MODIFIERS.find((m) => m.id === id)?.label || id);
    try {
      const res = await withAIProgress(repurposeOneFormat({
        data: {
          packId, isFirstInPack: false,
          inputText: inputText.slice(0, 50000), format: formatId,
          count: pick.count, style: pick.style, length: pick.length,
          tone: useBrandTone ? undefined : tone,
          styleModifiers: modifierLabels,
          customInstructions: customInstructions || undefined,
          language,
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      }));
      if (res.error) { toast.error(res.error); setStatuses((s) => ({ ...s, [formatId]: "done" })); return; }
      setResults((r) => ({ ...r, [formatId]: res.output }));
      setStatuses((s) => ({ ...s, [formatId]: "done" }));
      toast.success(`${FORMAT_BY_ID[formatId].name} regenerated`);
    } catch {
      setStatuses((s) => ({ ...s, [formatId]: "done" }));
    }
  };

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(null), 2000);
  };

  const handleSaveToSwipe = async (formatId: FormatId) => {
    if (!session) return toast.error("Please sign in");
    const content = results[formatId]; if (!content) return;
    const def = FORMAT_BY_ID[formatId];
    const res = await saveToSwipeFile({
      data: {
        title: `${def.name} · ${new Date().toLocaleDateString()}`,
        content, platform: PLATFORM_MAP[formatId], type: "repurpose",
      },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (res.success) toast.success("Saved to Swipe File"); else toast.error("Save failed");
  };

  const exportPackPdf = () => {
    const brand = brandKit?.brand_name?.trim();
    const stamp = new Date().toISOString().slice(0, 10);
    const filename = `${brand ? `${brand.replace(/[^a-z0-9-_]+/gi, "-")}-` : ""}content-pack-${stamp}`;
    const all = (Object.entries(results) as [FormatId, string][])
      .filter(([k]) => k !== "carousel")
      .map(([k, v]) => ({ title: `${FORMAT_BY_ID[k].emoji} ${FORMAT_BY_ID[k].name}`, content: v }));
    if (!all.length) return toast.error("Nothing to export yet");
    exportToPdf(all, filename, { watermark: tier === "free" });
    toast.success("PDF exported");
  };

  const doneCount = selectedIds.filter((id) => statuses[id] === "done").length;
  const progressPct = selectedIds.length ? Math.round((doneCount / selectedIds.length) * 100) : 0;
  const hasAnyResult = Object.keys(results).length > 0;

  // -------- Render --------
  return (
    <div className="mx-auto max-w-4xl pb-24 md:pb-8">
      {/* ============== HERO ============== */}
      <section
        className="relative overflow-hidden rounded-2xl px-6 py-7 sm:px-8 sm:py-9 shadow-2xl"
        style={{
          background:
            "radial-gradient(120% 140% at 0% 0%, #2a1b54 0%, transparent 55%), radial-gradient(120% 140% at 100% 100%, #0F3460 0%, transparent 55%), linear-gradient(135deg, #0B0B1F 0%, #16213E 60%, #0F1B3D 100%)",
          color: "#FFFFFF",
          border: "1px solid rgba(167,139,250,0.18)",
        }}
      >
        {/* subtle grid texture */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div
          className="pointer-events-none absolute -right-16 -top-28 h-80 w-80 rounded-full opacity-70 blur-2xl"
          style={{
            background: "radial-gradient(circle, rgba(167,139,250,0.55) 0%, transparent 70%)",
            animation: "rs-drift 15s ease-in-out infinite",
          }}
        />
        <div
          className="pointer-events-none absolute -left-24 bottom-[-120px] h-96 w-96 rounded-full opacity-50 blur-2xl"
          style={{
            background: "radial-gradient(circle, rgba(56,189,248,0.38) 0%, transparent 70%)",
            animation: "rs-drift 22s ease-in-out infinite reverse",
          }}
        />
        {/* gold hairline shimmer */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-6 top-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(201,168,124,0.6), transparent)" }}
        />
        <style>{`@keyframes rs-drift { 0%,100%{transform:translate(0,0)} 33%{transform:translate(-20px,15px)} 66%{transform:translate(10px,-10px)} }`}</style>

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
              style={{
                background: "rgba(167,139,250,0.14)",
                border: "1px solid rgba(167,139,250,0.35)",
                color: "#DDD6FE",
              }}
            >
              <Repeat className="h-3 w-3" /> Repurpose Studio
            </span>
            <h1
              className="ps-display mt-3 text-[26px] leading-[1.1] sm:text-[32px]"
              style={{ color: "#FFFFFF" }}
            >
              One source.{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #C9A87C 0%, #F0D78C 50%, #A78BFA 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  color: "transparent",
                }}
              >
                Every platform.
              </span>
            </h1>
            <p className="mt-2.5 max-w-md text-sm" style={{ color: "rgba(255,255,255,0.72)" }}>
              Paste a blog, YouTube video, podcast, or URL — PostSpark turns it into a full content drop in seconds.
            </p>
          </div>
          <div className="flex flex-shrink-0 gap-5 sm:gap-7">
            <HeroStat num="10+" label="Formats" />
            <HeroStat num="30+" label="Languages" />
            <HeroStat num="1" label="Source" />
          </div>
        </div>
      </section>

      {/* ============== USAGE PILL ============== */}
      {usage && (
        <div className={`mt-4 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
          isUnlimited ? "border-primary/20 bg-primary/5 text-foreground" :
          remaining === 0 ? "border-destructive/30 bg-destructive/5 text-destructive" :
          remaining !== null && remaining <= 2 ? "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400" :
          "border-primary/15 bg-primary/5 text-foreground"
        }`}>
          {remaining === 0 ? <AlertTriangle className="h-4 w-4 shrink-0" /> : <Sparkles className="h-4 w-4 shrink-0 text-primary" />}
          <span>
            {isUnlimited ? (
              <><strong className="capitalize">{usage.plan}</strong> plan — unlimited repurposes. Used <strong>{usage.used}</strong> this month.</>
            ) : (
              <><strong>{Math.max(0, remaining ?? 0)}</strong> repurpose{remaining === 1 ? "" : "s"} left this month{remaining !== null && remaining <= 2 ? <> · <button onClick={() => setShowUpgradeModal(true)} className="font-semibold underline">Upgrade to Pro</button></> : null}</>
            )}
          </span>
        </div>
      )}

      {brandKit?.preferred_tone && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-xs">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="font-semibold text-foreground">Brand Kit active</span>
          {brandKit.brand_name && <span className="rounded-full bg-background px-2 py-0.5 text-muted-foreground">{brandKit.brand_name}</span>}
          <span className="rounded-full bg-background px-2 py-0.5 text-muted-foreground">
            Tone: <span className="font-medium capitalize text-foreground">{brandKit.preferred_tone}</span>
          </span>
          <label className="ml-auto inline-flex cursor-pointer items-center gap-1.5">
            <input type="checkbox" checked={overrideTone} onChange={(e) => setOverrideTone(e.target.checked)} className="h-3.5 w-3.5 accent-primary" />
            <span className="font-medium text-foreground">Override</span>
          </label>
        </div>
      )}

      {/* ============== STEP 1 — SOURCE ============== */}
      <StepCard step="1" title="Your Source Content">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <SourceTab active={sourceTab==="text"}    onClick={() => setSourceTab("text")}    emoji="📄" label="Paste Text" />
          <SourceTab active={sourceTab==="url"}     onClick={() => setSourceTab("url")}     emoji="🔗" label="URL / Article" />
          <SourceTab active={sourceTab==="youtube"} onClick={() => setSourceTab("youtube")} emoji="▶"  label="YouTube" />
          <SourceTab active={sourceTab==="pdf"}     onClick={() => { setSourceTab("pdf"); setImportSubTab("pdf"); }}   emoji="📎" label="PDF / Doc" />
          <SourceTab active={sourceTab==="voice"}   onClick={() => { setSourceTab("voice"); setImportSubTab("audio"); }} emoji="🎤" label="Voice / Audio" />
        </div>

        {sourceTab === "text" && (
          <>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste your blog post, article, newsletter, notes…"
              className="mt-3 min-h-[180px] w-full resize-y rounded-xl border-[1.5px] border-input bg-muted/40 p-4 text-sm leading-relaxed text-foreground placeholder:italic placeholder:text-muted-foreground transition-all focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{wordCount.toLocaleString()} words · Ideal 300–3,000 for best quality</span>
              {wordCount > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  wordQuality === "good" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" :
                  wordQuality === "too-short" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400" :
                  "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
                }`}>
                  {wordQuality === "good" ? "Great length" : wordQuality === "too-short" ? "A bit short" : "Very long"}
                </span>
              )}
            </div>
            {importMeta && (
              <div className="mt-3 flex items-start gap-3 rounded-xl border border-primary/15 bg-gradient-to-br from-primary/[0.04] to-transparent p-3.5">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">Content loaded</p>
                  <p className="truncate text-xs text-muted-foreground">{importMeta}</p>
                </div>
              </div>
            )}
          </>
        )}

        {sourceTab === "url" && (
          <UrlFetchRow
            value={urlInput} onChange={setUrlInput}
            placeholder="🔗 Paste any article or blog URL…"
            busy={urlBusy} onFetch={() => handleFetchUrl(urlInput)}
          />
        )}
        {sourceTab === "youtube" && (
          <>
            <UrlFetchRow
              value={urlInput} onChange={setUrlInput}
              placeholder="▶ youtube.com/watch?v=…"
              busy={urlBusy} onFetch={() => handleFetchUrl(urlInput)}
            />
            <p className="mt-2 text-xs text-muted-foreground">AI extracts transcript and key ideas automatically.</p>
          </>
        )}
        {(sourceTab === "pdf" || sourceTab === "voice") && (
          <div className="mt-3">
            <ImportInputPanel
              subTab={importSubTab}
              onSubTabChange={setImportSubTab}
              onExtracted={(text, meta) => {
                setInputText(text); setImportMeta(meta || ""); setSourceTab("text");
                toast.success("Loaded — review & edit below");
              }}
            />
          </div>
        )}
      </StepCard>

      {/* ============== STEP 2 — FORMATS ============== */}
      <StepCard step="2" title="Choose Your Formats">
        {(["Social Media","Long-form","Discovery & SEO","Visual"] as const).map((group) => {
          const items = FORMATS.filter((f) => f.group === group);
          const groupSelectedAll = items.every((f) => picks[f.id]);
          return (
            <div key={group} className="mb-5 last:mb-0">
              <div className="mb-2.5 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">{group}</span>
                <button
                  onClick={() => {
                    setPicks((prev) => {
                      const next = { ...prev };
                      if (groupSelectedAll) {
                        items.forEach((f) => { delete next[f.id]; });
                      } else {
                        items.forEach((f) => {
                          if (!next[f.id]) next[f.id] = { count: f.defaultQty, style: f.styles?.[0], length: f.lengths?.[1] || f.lengths?.[0] };
                        });
                      }
                      return next;
                    });
                  }}
                  className="text-[11px] font-medium text-primary hover:underline"
                >
                  {groupSelectedAll ? "Clear group" : "Select all"}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                {items.map((f) => (
                  <FormatCard
                    key={f.id}
                    def={f}
                    pick={picks[f.id]}
                    onToggle={() => toggleFormat(f.id)}
                    onUpdate={(patch) => updatePick(f.id, patch)}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* Quality budget meter */}
        <div className="mt-2 flex flex-col gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">
                {selectedIds.length} format{selectedIds.length === 1 ? "" : "s"} · {totalPieces} piece{totalPieces === 1 ? "" : "s"}
              </span>
              <span className={`font-semibold ${
                qualityLabel === "Excellent" ? "text-emerald-600 dark:text-emerald-400" :
                qualityLabel === "Good" ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"
              }`}>Quality: {qualityLabel}</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className={`h-full rounded-full transition-all duration-500 ${qualityClass}`} style={{ width: `${qualityPct}%` }} />
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              {qualityLabel === "Excellent" ? "Each format gets full AI focus." :
               qualityLabel === "Good" ? "Output is solid. For peak quality, try 3–4 formats per run." :
               "Heads-up: too many formats can compress quality. Consider running in smaller batches."}
            </p>
          </div>
        </div>
      </StepCard>

      {/* ============== STEP 3 — TONE ============== */}
      <StepCard step="3" title="Tone & Writing Style">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Preset tones</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {TONES.map((t) => (
              <button
                key={t}
                onClick={() => setTone(t)}
                disabled={!!brandKit?.preferred_tone && !overrideTone}
                className={`rounded-full border-[1.5px] px-3.5 py-1.5 text-xs font-medium capitalize transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                  tone === t ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >{t}</button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Style modifiers</p>
          <p className="mt-1 text-xs text-muted-foreground">Layer these on top of your base tone.</p>
          <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {STYLE_MODIFIERS.map((m) => {
              const checked = styleModifiers.has(m.id);
              return (
                <label key={m.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm text-foreground transition-colors hover:bg-primary/5">
                  <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-[1.5px] transition-all ${checked ? "border-primary bg-primary" : "border-input"}`}>
                    {checked && <Check className="h-3 w-3 text-primary-foreground" />}
                  </span>
                  <input type="checkbox" checked={checked} onChange={() => toggleModifier(m.id)} className="sr-only" />
                  <span className="text-[13px]">{m.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="mt-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Custom instructions (optional)</p>
          <textarea
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value.slice(0, 500))}
            placeholder='e.g. "Write like Gary Vee — raw, direct, no fluff. Always start tweets with a bold statement. No corporate jargon."'
            className="mt-2 min-h-[80px] w-full resize-y rounded-xl border-[1.5px] border-input bg-muted/40 p-3 text-sm placeholder:italic placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10"
          />
          <div className="mt-1 text-right text-[11px] text-muted-foreground">{customInstructions.length}/500</div>
        </div>
      </StepCard>

      {/* ============== STEP 4 — LANGUAGE ============== */}
      <StepCard step="4" title="Output Language" icon={<Languages className="h-4 w-4 text-primary" />}>
        <p className="text-xs text-muted-foreground">Generate content in any language. AI uses native idioms and tone.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {POPULAR_LANGUAGES.map((l) => (
            <button
              key={l.name}
              onClick={() => setLanguage(l.name)}
              className={`inline-flex items-center gap-1.5 rounded-full border-[1.5px] px-3 py-1.5 text-xs font-medium transition-all ${
                language === l.name ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            ><span>{l.flag}</span>{l.name}</button>
          ))}
        </div>
        <div className="mt-3">
          <div className="relative">
            <input
              value={langQuery} onChange={(e) => setLangQuery(e.target.value)}
              placeholder="🔍 Search all languages…"
              className="w-full rounded-lg border-[1.5px] border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
          </div>
          {langQuery && (
            <div className="mt-2 max-h-48 overflow-auto rounded-lg border border-border bg-background">
              {ALL_LANGUAGES.filter((l) => l.toLowerCase().includes(langQuery.toLowerCase())).slice(0, 30).map((l) => (
                <button key={l} onClick={() => { setLanguage(l); setLangQuery(""); }} className={`block w-full px-3 py-2 text-left text-sm hover:bg-primary/5 ${language === l ? "bg-primary/10 font-medium text-primary" : ""}`}>{l}</button>
              ))}
            </div>
          )}
          <p className="mt-2 text-xs text-muted-foreground">Current: <span className="font-medium text-foreground">{language}</span></p>
        </div>
      </StepCard>

      {/* ============== GENERATE SUMMARY + BUTTON ============== */}
      <div className="mt-5 rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.05] via-transparent to-primary/[0.02] p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Summary of your repurpose pack</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selectedIds.length === 0 ? (
            <span className="text-sm text-muted-foreground">No formats selected yet.</span>
          ) : selectedIds.map((id) => {
            const def = FORMAT_BY_ID[id]; const p = picks[id];
            const qty = def.quantities ? `${p?.count || def.defaultQty} ` : "";
            return (
              <span key={id} className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                <span>{def.emoji}</span>{qty}{def.name}
              </span>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {totalPieces} content piece{totalPieces===1?"":"s"} · Est. ~{Math.max(8, selectedIds.length * 6)} seconds · 1 generation credit
        </p>
        <button
          onClick={handleGenerate}
          disabled={loading || selectedIds.length === 0 || !inputText.trim()}
          className="repurpose-cta group relative mt-4 flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-violet-500 px-6 py-4 text-base font-bold text-primary-foreground shadow-[0_10px_30px_-5px_rgba(124,58,237,0.4)] transition-all hover:-translate-y-0.5 hover:shadow-[0_15px_40px_-5px_rgba(124,58,237,0.55)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent transition-all duration-700 group-hover:left-full" />
          {loading ? (<><Loader2 className="h-5 w-5 animate-spin" /> Generating your content pack…</>)
            : (<><Sparkles className="h-5 w-5" /> Repurpose Now</>)}
        </button>
      </div>

      {/* ============== LOADING / PROGRESS ============== */}
      {loading && (
        <div className="mt-5 rounded-2xl border border-primary/15 bg-card p-6 shadow-sm">
          <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Sparkles className="h-4 w-4 text-primary" /> Generating your content pack…
          </h3>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-gradient-to-r from-primary to-violet-500 transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{progressPct}% — {doneCount} of {selectedIds.length} pieces done</p>
          <div className="mt-4 space-y-1">
            {selectedIds.map((id) => {
              const st = statuses[id] || "waiting"; const def = FORMAT_BY_ID[id];
              return (
                <div key={id} className="flex items-center gap-3 border-b border-border/40 py-2 text-sm last:border-b-0">
                  <span className="w-5 shrink-0 text-center">
                    {st === "done"    && <Check className="mx-auto h-4 w-4 text-emerald-500" />}
                    {st === "generating" && <Loader2 className="mx-auto h-4 w-4 animate-spin text-primary" />}
                    {st === "waiting" && <Circle className="mx-auto h-3.5 w-3.5 text-muted-foreground" />}
                    {st === "error"   && <AlertTriangle className="mx-auto h-4 w-4 text-red-500" />}
                  </span>
                  <span className="flex-1 text-foreground">{def.emoji} {def.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {st === "done" ? `Done in ${timings[id] ?? "?"}s` : st === "generating" ? "Generating…" : st === "waiting" ? "Waiting" : "Error"}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-center text-xs italic text-muted-foreground">
            AI is giving each format its full attention for maximum quality.
          </p>
        </div>
      )}

      {/* ============== OUTPUT ============== */}
      {hasAnyResult && (
        <section className="mt-6 animate-fade-in">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold text-foreground">
              <Sparkles className="mr-1.5 inline h-4 w-4 text-primary" />
              Your content pack is ready · {Object.keys(results).length} piece{Object.keys(results).length===1?"":"s"} · Saved automatically
            </h2>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setShowScheduleModal(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:border-primary/40 hover:text-primary">
                <CalendarIcon className="h-3.5 w-3.5" /> Schedule
              </button>
              <button onClick={exportPackPdf} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:border-primary/40 hover:text-primary">
                <Download className="h-3.5 w-3.5" /> Export PDF
              </button>
              <button onClick={() => { setTemplateName(`My pack · ${new Date().toLocaleDateString()}`); setShowSaveTemplateModal(true); }} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:border-primary/40 hover:text-primary">
                <Save className="h-3.5 w-3.5" /> Save template
              </button>
            </div>
          </div>

          {/* Format tabs */}
          <div className="-mx-1 flex gap-1 overflow-x-auto border-b-[1.5px] border-border px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {selectedIds.filter((id) => results[id]).map((id) => {
              const def = FORMAT_BY_ID[id];
              const active = activeOutputTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveOutputTab(id)}
                  className={`-mb-[1.5px] flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm transition-all ${
                    active ? "border-primary font-semibold text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>{def.emoji}</span>{def.name}
                </button>
              );
            })}
          </div>

          {/* Active tab content */}
          {activeOutputTab && results[activeOutputTab] && (
            <div className="mt-5 animate-fade-in">
              <OutputCard
                formatId={activeOutputTab}
                content={results[activeOutputTab]!}
                onCopy={handleCopy}
                copied={copied}
                onRegenerate={() => regenerateOne(activeOutputTab)}
                onSaveSwipe={() => handleSaveToSwipe(activeOutputTab)}
                regenerating={statuses[activeOutputTab] === "generating"}
              />
            </div>
          )}

          {/* Hook A/B (legacy bonus widget — keep) */}
          {activeOutputTab === "tweets" && <div className="mt-4"><HookABTester inputText={inputText} jobId={packId} /></div>}

          {/* Carousel CTA */}
          {results.carousel && (
            <div className="mt-4 rounded-xl border border-primary/25 bg-gradient-to-br from-primary/10 to-transparent p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-foreground">🖼️ Open in Carousel Designer</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">Pick a theme, edit slides inline, export PNG/PDF.</p>
                </div>
                <Link to="/dashboard/carousel" search={{ topic: inputText.slice(0, 500) } as any}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-violet-500 px-4 py-2 text-xs font-bold text-primary-foreground shadow hover:opacity-90">
                  <Sparkles className="h-3.5 w-3.5" /> Open designer
                </Link>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ============== MODALS ============== */}
      {showUpgradeModal && (
        <Modal onClose={() => setShowUpgradeModal(false)}>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-center text-xl font-bold text-foreground">You've hit your monthly limit</h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">Free accounts get 3 repurposes per month. Upgrade to <strong>Pro</strong> for unlimited.</p>
          <div className="mt-6 space-y-3">
            <Link to="/dashboard/billing" className="block w-full rounded-xl bg-gradient-to-r from-primary to-violet-500 px-6 py-3 text-center text-sm font-bold text-primary-foreground shadow hover:opacity-90">
              Upgrade to Pro — $19/mo
            </Link>
            <button onClick={() => setShowUpgradeModal(false)} className="w-full rounded-xl border border-border px-6 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground">Maybe later</button>
          </div>
        </Modal>
      )}

      {showScheduleModal && hasAnyResult && (
        <Modal onClose={() => !scheduleBusy && setShowScheduleModal(false)}>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-violet-500 text-white"><CalendarIcon className="h-4 w-4" /></div>
            <div><h2 className="text-base font-bold text-foreground">Schedule this pack</h2><p className="text-xs text-muted-foreground">Saves every post to your calendar.</p></div>
          </div>
          <div className="space-y-3">
            <label className="block text-xs font-medium text-foreground">Start date
              <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} min={new Date().toISOString().slice(0,10)} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
            </label>
            <label className="block text-xs font-medium text-foreground">Time of day
              <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
            </label>
            <div>
              <span className="text-xs font-medium text-foreground">Spread</span>
              <div className="mt-1 grid grid-cols-2 gap-2">
                <button onClick={() => setScheduleSpread("daily")} className={`rounded-lg border px-3 py-2 text-xs font-medium ${scheduleSpread==="daily"?"border-primary bg-primary/10":"border-border text-muted-foreground"}`}>One per day</button>
                <button onClick={() => setScheduleSpread("same")} className={`rounded-lg border px-3 py-2 text-xs font-medium ${scheduleSpread==="same"?"border-primary bg-primary/10":"border-border text-muted-foreground"}`}>All same day</button>
              </div>
            </div>
          </div>
          <button
            disabled={scheduleBusy || !session}
            onClick={async () => {
              if (!session) return;
              setScheduleBusy(true);
              const entries = (Object.entries(results) as [FormatId, string][]).filter(([k, v]) => PLATFORM_MAP[k] && v?.trim());
              const [h, m] = scheduleTime.split(":").map((n) => parseInt(n,10) || 0);
              let ok=0, fail=0;
              for (let i=0; i<entries.length; i++) {
                const [key, content] = entries[i];
                const d = new Date(`${scheduleDate}T00:00:00`);
                if (scheduleSpread === "daily") d.setDate(d.getDate() + i);
                d.setHours(h, m, 0, 0);
                try {
                  const res = await createScheduledPost({
                    data: { title: FORMAT_BY_ID[key].name, content: content.slice(0, 10000), platform: PLATFORM_MAP[key], scheduled_for: d.toISOString() },
                    headers: { Authorization: `Bearer ${session.access_token}` },
                  });
                  if (res.success) ok++; else fail++;
                } catch { fail++; }
              }
              setScheduleBusy(false); setShowScheduleModal(false);
              if (ok > 0) toast.success(`Scheduled ${ok} post${ok===1?"":"s"}${fail?` (${fail} failed)`:""}`);
              else toast.error("Failed to schedule");
            }}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-violet-500 px-6 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {scheduleBusy ? <><Loader2 className="h-4 w-4 animate-spin" />Scheduling…</> : <><CalendarIcon className="h-4 w-4" />Save to calendar</>}
          </button>
        </Modal>
      )}

      {showSaveTemplateModal && (
        <Modal onClose={() => !templateBusy && setShowSaveTemplateModal(false)}>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-violet-500 text-white"><Save className="h-4 w-4" /></div>
            <div><h2 className="text-base font-bold text-foreground">Save as template</h2><p className="text-xs text-muted-foreground">Reuse this format mix later.</p></div>
          </div>
          <label className="block text-xs font-medium text-foreground">Template name
            <input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="e.g. Weekly LinkedIn pack" maxLength={100} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
          </label>
          <div className="mt-3 space-y-1 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            <div><span className="font-semibold text-foreground">Tone:</span> {tone}</div>
            <div><span className="font-semibold text-foreground">Formats:</span> {selectedIds.map((id) => FORMAT_BY_ID[id].name).join(", ") || "—"}</div>
          </div>
          <button
            disabled={templateBusy || !session || !templateName.trim()}
            onClick={async () => {
              if (!session) return; setTemplateBusy(true);
              try {
                const res = await createTemplate({
                  data: { name: templateName.trim().slice(0,100), tone, customInstructions: customInstructions.slice(0,500), selectedTypes: selectedIds },
                  headers: { Authorization: `Bearer ${session.access_token}` },
                });
                if (res.success) { toast.success("Template saved"); setShowSaveTemplateModal(false); }
                else toast.error(res.error || "Failed to save");
              } finally { setTemplateBusy(false); }
            }}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-violet-500 px-6 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {templateBusy ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</> : <><Save className="h-4 w-4" />Save template</>}
          </button>
        </Modal>
      )}
    </div>
  );
}

// ============== SUB-COMPONENTS ============================================

function HeroStat({ num, label }: { num: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold leading-none text-white">{num}</div>
      <div className="mt-1 text-[11px] text-white/55">{label}</div>
    </div>
  );
}

function StepCard({ step, title, icon, children }: { step: string; title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mt-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">{step}</span>
        {icon}
        <h2 className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function SourceTab({ active, onClick, emoji, label }: { active: boolean; onClick: () => void; emoji: string; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border-[1.5px] px-3.5 py-2 text-xs font-medium transition-all ${
        active ? "border-primary bg-primary/10 font-semibold text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
      }`}
    >
      <span>{emoji}</span>{label}
    </button>
  );
}

function UrlFetchRow({ value, onChange, placeholder, busy, onFetch }: {
  value: string; onChange: (v: string) => void; placeholder: string; busy: boolean; onFetch: () => void;
}) {
  return (
    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
      <div className="relative flex-1">
        <LinkIcon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={value} onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !busy) onFetch(); }}
          placeholder={placeholder}
          className="w-full rounded-lg border-[1.5px] border-input bg-background py-2.5 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
        />
      </div>
      <button
        onClick={onFetch} disabled={busy}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-violet-500 px-5 py-2.5 text-sm font-bold text-primary-foreground shadow hover:opacity-90 disabled:opacity-60"
      >
        {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Fetching…</> : <><Sparkles className="h-4 w-4" /> Fetch content</>}
      </button>
    </div>
  );
}

function FormatCard({ def, pick, onToggle, onUpdate }: {
  def: FormatDef; pick: FormatPick | undefined; onToggle: () => void; onUpdate: (p: FormatPick) => void;
}) {
  const selected = !!pick;
  return (
    <div className={`group relative rounded-xl border-[1.5px] p-3 transition-all ${
      selected ? "border-primary bg-primary/[0.04] shadow-sm" : "border-border bg-card hover:border-primary/40"
    }`}>
      <button onClick={onToggle} className="block w-full text-left">
        {selected && (
          <span className="absolute right-2 top-2 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">✓</span>
        )}
        <div className="text-xl leading-none">{def.emoji}</div>
        <div className="mt-1.5 text-[13px] font-semibold text-foreground">{def.name}</div>
      </button>

      {selected && (def.quantities || def.styles || def.lengths) && (
        <div className="mt-2.5 space-y-1.5 border-t border-border/60 pt-2.5">
          {def.quantities && (
            <SelectRow
              label={def.qtyLabel || "How many?"}
              value={String(pick?.count || def.defaultQty || def.quantities[0])}
              onChange={(v) => onUpdate({ count: Number(v) })}
              options={def.quantities.map((n) => ({ value: String(n), label: String(n) }))}
            />
          )}
          {def.styles && (
            <SelectRow
              label="Style"
              value={pick?.style || def.styles[0]}
              onChange={(v) => onUpdate({ style: v })}
              options={def.styles.map((s) => ({ value: s, label: s }))}
            />
          )}
          {def.lengths && (
            <SelectRow
              label="Length"
              value={pick?.length || def.lengths[1] || def.lengths[0]}
              onChange={(v) => onUpdate({ length: v })}
              options={def.lengths.map((s) => ({ value: s, label: s }))}
            />
          )}
        </div>
      )}
    </div>
  );
}

function SelectRow({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <label className="flex items-center gap-2 text-[11px]">
      <span className="shrink-0 text-muted-foreground">{label}:</span>
      <div className="relative flex-1">
        <select
          value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full cursor-pointer appearance-none rounded-md border border-input bg-background px-2 py-1 pr-6 text-[11px] font-medium text-foreground focus:border-primary focus:outline-none"
        >
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
      </div>
    </label>
  );
}

function OutputCard({ formatId, content, onCopy, copied, onRegenerate, onSaveSwipe, regenerating }: {
  formatId: FormatId; content: string; onCopy: (text: string, id: string) => void; copied: string | null;
  onRegenerate: () => void; onSaveSwipe: () => void; regenerating: boolean;
}) {
  const def = FORMAT_BY_ID[formatId];
  const previewable = ["tweets","thread","linkedin","instagram","facebook","tiktok","email"].includes(formatId);
  const [view, setView] = useState<"raw"|"preview">(previewable ? "preview" : "raw");
  const [edited, setEdited] = useState(content);
  useEffect(() => { setEdited(content); }, [content]);
  const wordCount = edited.split(/\s+/).filter(Boolean).length;
  const isCopied = copied === formatId;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{def.emoji} {def.name}</h3>
          <p className="text-[11px] text-muted-foreground">{wordCount} words · {edited.length} chars</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {previewable && (
            <div className="flex overflow-hidden rounded-lg border border-border bg-card">
              <button onClick={() => setView("preview")} className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium ${view==="preview" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                <Eye className="h-3 w-3" /> Preview
              </button>
              <button onClick={() => setView("raw")} className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium ${view==="raw" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                <FileText className="h-3 w-3" /> Raw
              </button>
            </div>
          )}
          <button onClick={() => onCopy(edited, formatId)} className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${isCopied ? "border-emerald-500 text-emerald-600" : "border-border text-muted-foreground hover:border-primary hover:text-primary"}`}>
            {isCopied ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
          </button>
          <button onClick={onSaveSwipe} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary">
            <Bookmark className="h-3 w-3" /> Save
          </button>
          <button onClick={onRegenerate} disabled={regenerating} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-60">
            <RefreshCw className={`h-3 w-3 ${regenerating ? "animate-spin" : ""}`} /> {regenerating ? "Regenerating…" : "Regenerate"}
          </button>
          <PublishMenu content={edited} formatId={formatId} />
          <PostToTikTokButton content={edited} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary" />
        </div>
      </div>

      {regenerating ? (
        <div className="mt-4 space-y-2">
          <div className="h-3 w-[90%] animate-pulse rounded bg-muted" />
          <div className="h-3 w-[75%] animate-pulse rounded bg-muted" />
          <div className="h-3 w-[85%] animate-pulse rounded bg-muted" />
        </div>
      ) : view === "preview" && previewable ? (
        <div className="mt-4 animate-fade-in"><VisualPreview typeId={formatId} content={edited} /></div>
      ) : (
        <textarea
          value={edited}
          onChange={(e) => setEdited(e.target.value)}
          className="mt-4 min-h-[260px] w-full resize-y rounded-xl border border-input bg-muted/30 p-4 text-sm leading-relaxed text-foreground focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10"
        />
      )}
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"><X className="h-4 w-4" /></button>
        {children}
      </div>
    </div>
  );
}
