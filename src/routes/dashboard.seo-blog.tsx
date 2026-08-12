import { ToolHero } from "@/components/dashboard/ToolHero";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  FileText, Loader2, Sparkles, Copy, Check, Download, Search, Plus, Trash2,
  RefreshCw, Wand2, Calendar as CalIcon,
} from "lucide-react";
import { generateBlog, generateOutline, refreshOldBlog } from "@/lib/seoBlog.functions";
import { withAIProgress } from "@/lib/aiProgress";
import { DriveImportButton } from "@/components/google/DriveImportButton";
import { ExportToGoogleDocs } from "@/components/google/ExportToGoogleDocs";
import {
  StudioCard,
  StudioLabel,
  SubLabel as StudioSubLabel,
  ChoicePill,
} from "@/components/tools/studio";
import { ArticlePreview } from "@/components/tools/ArticlePreview";
import { SeoAnalyzer } from "@/components/tools/SeoAnalyzer";


export const Route = createFileRoute("/dashboard/seo-blog")({
  component: SeoBlogPage,
});

interface Blog {
  title: string;
  metaDescription: string;
  slug: string;
  outline: string[];
  markdown: string;
  faq: { q: string; a: string }[];
  seoScore?: number;
}

interface Outline {
  title: string;
  outline: { h2: string; h3?: string[] }[];
  competitorHeadings: { url: string; headings: string[] }[];
  suggestedInternalLinks: { title: string; slug: string; anchor: string }[];
}

const LANGS = [
  { code: "English", flag: "🇺🇸" }, { code: "Arabic", flag: "🇸🇦" }, { code: "Urdu", flag: "🇵🇰" },
  { code: "Spanish", flag: "🇪🇸" }, { code: "German", flag: "🇩🇪" }, { code: "French", flag: "🇫🇷" },
  { code: "Portuguese", flag: "🇵🇹" }, { code: "Italian", flag: "🇮🇹" }, { code: "Hindi", flag: "🇮🇳" },
  { code: "Chinese (Simplified)", flag: "🇨🇳" }, { code: "Japanese", flag: "🇯🇵" }, { code: "Korean", flag: "🇰🇷" },
];

const ARTICLE_TYPES = ["How-to Guide", "Listicle", "Comparison / vs.", "Deep-dive", "Opinion/Thought Leadership", "Case Study", "FAQ page"];
const NICHES = ["SaaS", "E-commerce", "Marketing", "Health", "Finance", "Education", "Real Estate", "Tech", "Other"];
const WORD_TARGETS = [800, 1200, 1800, 2500, 3500];
const TONES = ["Professional", "Casual/Conversational", "Authoritative", "Educational", "Storytelling", "Data-driven"];
const SECTIONS = [
  "Meta title + description", "FAQ section (5 Q&As)", "Table of contents",
  "Key takeaways box", "Introduction hook", "Expert quotes/stats",
  "Pro tips callout boxes", "Conclusion CTA",
];

function SeoBlogPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"blog" | "outline" | "refresh">("blog");

  // shared
  const [topic, setTopic] = useState("");
  const [keyword, setKeyword] = useState("");
  const [secondaryKeywords, setSecondaryKeywords] = useState("");
  const [language, setLanguage] = useState("English");

  // blog tab
  const [articleType, setArticleType] = useState("How-to Guide");
  const [audience, setAudience] = useState("");
  const [niche, setNiche] = useState("SaaS");
  const [wordTarget, setWordTarget] = useState(1200);
  const [tone, setTone] = useState("Professional");
  const [sections, setSections] = useState<string[]>([
    "Meta title + description", "FAQ section (5 Q&As)", "Table of contents", "Introduction hook",
  ]);
  const [competitorAngle, setCompetitorAngle] = useState("");
  const [loading, setLoading] = useState(false);
  const [blog, setBlog] = useState<Blog | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // outline tab
  const [competitors, setCompetitors] = useState<string[]>([""]);
  const [outline, setOutline] = useState<Outline | null>(null);
  const [outlineLoading, setOutlineLoading] = useState(false);

  // refresh tab
  const [oldPost, setOldPost] = useState("");
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [refreshed, setRefreshed] = useState("");

  const toggleSection = (s: string) =>
    setSections((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));

  const generateOutlineFn = async () => {
    if (!session) return toast.error("Please sign in");
    if (topic.trim().length < 3) return toast.error("Add a topic");
    if (keyword.trim().length < 2) return toast.error("Add a target keyword");
    setOutlineLoading(true);
    setOutline(null);
    try {
      const urls = competitors.map((u) => u.trim()).filter((u) => /^https?:\/\//i.test(u));
      const res: any = await withAIProgress(generateOutline({
        data: { topic: topic.trim(), keyword: keyword.trim(), language, competitorUrls: urls },
      }));
      if (res.error) toast.error(res.error);
      else if (!res.outline?.length) toast.error("No outline returned");
      else { setOutline(res); toast.success("Outline ready"); }
    } catch (e) { console.error(e); toast.error("Outline failed"); }
    finally { setOutlineLoading(false); }
  };

  const generate = async () => {
    if (!session) return toast.error("Please sign in");
    if (topic.trim().length < 3) return toast.error("Add a topic");
    if (keyword.trim().length < 2) return toast.error("Add a target keyword");
    if (audience.trim().length < 3) return toast.error("Add a target audience");
    setLoading(true);
    setBlog(null);
    try {
      const res = await withAIProgress(generateBlog({
        data: {
          topic: topic.trim(), keyword: keyword.trim(), wordTarget, language,
          articleType, audience: audience.trim(), niche, tone, sections,
          secondaryKeywords: secondaryKeywords.trim() || undefined,
          competitorAngle: competitorAngle.trim() || undefined,
        },
      }));
      if (res.error) toast.error(res.error);
      else if (!res.markdown) toast.error("No blog returned");
      else { setBlog(res as Blog); toast.success("Blog ready"); }
    } catch (e) { console.error(e); toast.error("Generation failed"); }
    finally { setLoading(false); }
  };

  const runRefresh = async () => {
    if (oldPost.trim().length < 100) return toast.error("Paste a post (100+ chars)");
    if (keyword.trim().length < 2) return toast.error("Add target keyword");
    setRefreshLoading(true);
    setRefreshed("");
    try {
      const res = await withAIProgress(refreshOldBlog({
        data: { content: oldPost.trim(), keyword: keyword.trim(), language },
      }));
      if (res.error) toast.error(res.error);
      else { setRefreshed(res.markdown); toast.success("Post refreshed"); }
    } catch (e) { console.error(e); toast.error("Refresh failed"); }
    finally { setRefreshLoading(false); }
  };

  const copy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const download = (fmt: "md" | "txt") => {
    if (!blog) return;
    const ext = fmt === "md" ? "md" : "txt";
    const front = fmt === "md"
      ? `---\ntitle: "${blog.title.replace(/"/g, '\\"')}"\ndescription: "${blog.metaDescription.replace(/"/g, '\\"')}"\nslug: ${blog.slug}\n---\n\n`
      : `${blog.title}\n\n${blog.metaDescription}\n\n`;
    const blob = new Blob([front + blog.markdown], { type: fmt === "md" ? "text/markdown" : "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${blog.slug || "post"}.${ext}`; a.click();
    URL.revokeObjectURL(url);
  };

  const sendToHumanizer = () => {
    if (!blog) return;
    try { sessionStorage.setItem("postspark.humanizer.text", blog.markdown); } catch {}
    toast.success("Sent to AI Humanizer");
    navigate({ to: "/dashboard/humanizer" });
  };

  return (
    <div className="mx-auto max-w-[900px] px-6 pb-20 pt-6 space-y-6">
      {/* HERO */}
      <ToolHero
        eyebrow="SEO Blog Generator"
        icon={<FileText className="h-3 w-3" />}
        accent="#10B981"
        art="seo"
        title="Long-form articles that rank"
        subtitle="Search-optimized blogs with meta, structure and FAQ included."
        steps={["Pick keyword", "Generate draft", "Publish & rank"]}
      />
      <div className="flex flex-wrap gap-1.5">
        {([
          { id: "blog" as const, label: "Full Blog" },
          { id: "outline" as const, label: "Outline + Research" },
          { id: "refresh" as const, label: "Refresh Old Post" },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg border px-3.5 py-1.5 text-[12.5px] font-medium transition ${
              tab === t.id
                ? "border-transparent bg-primary text-primary-foreground"
                : "border-[color:var(--ds-border)] bg-[color:var(--ds-card)] text-[color:var(--ds-muted)] hover:text-[color:var(--ds-text)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>


      {tab === "blog" && (
        <>
          {/* TOPIC */}
          <Card>
            <Label>Topic & keyword</Label>
            <div className="space-y-3">
              <div>
                <SubLabel>Topic / angle *</SubLabel>
                <textarea value={topic} onChange={(e) => setTopic(e.target.value)} rows={2} placeholder="e.g. How small SaaS teams can ship faster with async workflows" className="ps-input w-full" />
                <div className="mt-1 text-[11px] text-[#9CA3AF]">Be specific. "10 ways to..." outranks "How to..." by 34%.</div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <SubLabel>Primary keyword *</SubLabel>
                  <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="e.g. async workflows" className="ps-input w-full" />
                </div>
                <div>
                  <SubLabel>Secondary keywords (optional)</SubLabel>
                  <input value={secondaryKeywords} onChange={(e) => setSecondaryKeywords(e.target.value)} placeholder="e.g. remote team, SaaS productivity" className="ps-input w-full" />
                </div>
              </div>
            </div>
          </Card>

          {/* CONTENT SETUP */}
          <Card>
            <Label>Content setup</Label>
            <SubLabel>Article type *</SubLabel>
            <div className="mb-4 flex flex-wrap gap-2">
              {ARTICLE_TYPES.map((t) => <Pill key={t} active={articleType === t} onClick={() => setArticleType(t)}>{t}</Pill>)}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <SubLabel>Target audience *</SubLabel>
                <input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. SaaS founders, B2B marketers" className="ps-input w-full" />
              </div>
              <div>
                <SubLabel>Your niche / industry</SubLabel>
                <select value={niche} onChange={(e) => setNiche(e.target.value)} className="ps-input w-full">
                  {NICHES.map((n) => <option key={n}>{n}</option>)}
                </select>
              </div>
            </div>
          </Card>

          {/* STYLE & LENGTH */}
          <Card>
            <Label>Style & length</Label>
            <SubLabel>Word target</SubLabel>
            <div className="mb-4 flex flex-wrap gap-2">
              {WORD_TARGETS.map((w) => (
                <Pill key={w} active={wordTarget === w} onClick={() => setWordTarget(w)}>~{w.toLocaleString()} words</Pill>
              ))}
            </div>
            <SubLabel>Writing tone</SubLabel>
            <div className="mb-4 flex flex-wrap gap-2">
              {TONES.map((t) => <Pill key={t} active={tone === t} onClick={() => setTone(t)}>{t}</Pill>)}
            </div>
            <SubLabel>Include these sections</SubLabel>
            <div className="grid grid-cols-2 gap-1.5">
              {SECTIONS.map((s) => (
                <label key={s} className="flex cursor-pointer items-center gap-2 rounded-md p-1.5 text-[12.5px] text-[#1A1A2E] hover:bg-[#F3F0FF]">
                  <input type="checkbox" checked={sections.includes(s)} onChange={() => toggleSection(s)} className="h-3.5 w-3.5 accent-[#6B4EFF]" />
                  <span>{s}</span>
                </label>
              ))}
            </div>
          </Card>

          {/* SEO SETTINGS */}
          <Card>
            <Label>SEO settings</Label>
            <SubLabel>Language</SubLabel>
            <div className="mb-4 flex flex-wrap gap-1.5">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLanguage(l.code)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] transition ${
                    language === l.code ? "border-[#6B4EFF] bg-[#6B4EFF]/[0.08] text-[#6B4EFF]" : "border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#6B4EFF]/40"
                  }`}
                >
                  <span>{l.flag}</span><span>{l.code}</span>
                </button>
              ))}
            </div>
            <SubLabel>Competitor angle (optional)</SubLabel>
            <input value={competitorAngle} onChange={(e) => setCompetitorAngle(e.target.value)} placeholder='e.g. "Most guides miss the async setup — we cover it first"' className="ps-input w-full" />
          </Card>

          <button onClick={generate} disabled={loading} className="ps-generate-btn">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Writing your article…</> : <><Sparkles className="h-4 w-4" /> Generate SEO Blog</>}
          </button>
        </>
      )}

      {tab === "outline" && (
        <>
          <Card>
            <Label>Get an SEO outline first</Label>
            <p className="mb-3 text-[12.5px] text-[#6B7280]">Review the proposed outline before committing to the full article. Add competitor URLs to beat their structure.</p>
            <div className="space-y-3">
              <div>
                <SubLabel>Topic / angle *</SubLabel>
                <textarea value={topic} onChange={(e) => setTopic(e.target.value)} rows={2} className="ps-input w-full" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <SubLabel>Primary keyword *</SubLabel>
                  <input value={keyword} onChange={(e) => setKeyword(e.target.value)} className="ps-input w-full" />
                </div>
                <div>
                  <SubLabel>Language</SubLabel>
                  <select value={language} onChange={(e) => setLanguage(e.target.value)} className="ps-input w-full">
                    {LANGS.map((l) => <option key={l.code}>{l.code}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <SubLabel>Competitor URLs (up to 3)</SubLabel>
                <div className="space-y-2">
                  {competitors.map((url, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={url} onChange={(e) => { const next = [...competitors]; next[i] = e.target.value; setCompetitors(next); }} placeholder="https://competitor.com/article" className="ps-input flex-1" />
                      <button onClick={() => setCompetitors(competitors.filter((_, idx) => idx !== i))} className="rounded-lg border border-[#E5E7EB] p-2 text-[#9CA3AF] hover:bg-[#F3F4F6]"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                  {competitors.length < 3 && (
                    <button onClick={() => setCompetitors([...competitors, ""])} className="inline-flex items-center gap-1 text-[12px] font-medium text-[#6B4EFF] hover:underline">
                      <Plus className="h-3 w-3" /> Add competitor
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <button onClick={generateOutlineFn} disabled={outlineLoading} className="ps-generate-btn">
            {outlineLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing competitors…</> : <><Search className="h-4 w-4" /> Generate Outline</>}
          </button>

          {outline && (
            <Card>
              <Label>Proposed outline</Label>
              <div className="mb-3 rounded-lg bg-[#FAFAF8] p-3">
                <div className="text-[11px] font-semibold uppercase text-[#9CA3AF]">H1</div>
                <div className="text-[15px] font-semibold text-[#1A1A2E]">{outline.title}</div>
              </div>
              <ol className="list-decimal space-y-2 pl-5 text-[13px]">
                {outline.outline.map((s, i) => (
                  <li key={i}>
                    <p className="font-semibold text-[#1A1A2E]">H2: {s.h2}</p>
                    {s.h3 && s.h3.length > 0 && (
                      <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[12px] text-[#6B7280]">
                        {s.h3.map((h, j) => <li key={j}>H3: {h}</li>)}
                      </ul>
                    )}
                  </li>
                ))}
              </ol>
              <button
                onClick={() => { setTab("blog"); toast.success("Outline copied to Full Blog tab — generate when ready"); }}
                className="ps-generate-btn mt-4"
              >
                <Sparkles className="h-4 w-4" /> Generate Full Article from This Outline
              </button>
            </Card>
          )}
        </>
      )}

      {tab === "refresh" && (
        <>
          <Card>
            <Label>Refresh an old post</Label>
            <p className="mb-3 text-[12.5px] text-[#6B7280]">We'll update stats, improve keyword density, add a FAQ + TOC, and tighten the intro.</p>
            <div className="space-y-3">
              <div className="flex justify-end">
                <DriveImportButton onImported={(text) => setOldPost(text)} label="Import from Drive" />
              </div>
              <textarea value={oldPost} onChange={(e) => setOldPost(e.target.value)} rows={10} placeholder="Paste your existing post here…" className="ps-input w-full" />
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <SubLabel>Target keyword to improve for *</SubLabel>
                  <input value={keyword} onChange={(e) => setKeyword(e.target.value)} className="ps-input w-full" />
                </div>
                <div>
                  <SubLabel>Language</SubLabel>
                  <select value={language} onChange={(e) => setLanguage(e.target.value)} className="ps-input w-full">
                    {LANGS.map((l) => <option key={l.code}>{l.code}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </Card>

          <button onClick={runRefresh} disabled={refreshLoading} className="ps-generate-btn">
            {refreshLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Refreshing your post…</> : <><RefreshCw className="h-4 w-4" /> Refresh This Post</>}
          </button>

          {refreshed && (
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <Label>Refreshed post</Label>
                <div className="flex gap-2">
                  <button onClick={() => copy(refreshed, "refreshed")} className="output-action-btn">
                    {copied === "refreshed" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} Copy
                  </button>
                  <ExportToGoogleDocs
                    content={refreshed}
                    defaultTitle={`PostSpark — Refreshed post${keyword ? ` (${keyword})` : ""}`}
                    sourceTool="SEO Blog · Refresh"
                  />
                </div>
              </div>
              <pre className="max-h-[500px] overflow-auto whitespace-pre-wrap rounded-lg bg-[#FAFAF8] p-4 text-[12.5px] leading-relaxed text-[#1A1A2E]">{refreshed}</pre>
            </Card>
          )}
        </>
      )}

      {/* BLOG OUTPUT */}
      {blog && tab === "blog" && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-[12px] text-[#6B7280]">
              ✓ Blog generated · {blog.markdown.split(/\s+/).length.toLocaleString()} words
            </p>
            {blog.seoScore !== undefined && <SeoScoreBadge score={blog.seoScore} />}
          </div>

          <Card>
            <Label>Meta section</Label>
            <div className="space-y-3">
              <MetaRow label="Title" value={blog.title} id="title" copy={copy} copied={copied} />
              <MetaRow label="Meta description" value={blog.metaDescription} id="meta" copy={copy} copied={copied} />
              <MetaRow label="Slug" value={`/${blog.slug}`} id="slug" copy={copy} copied={copied} mono />
            </div>
          </Card>

          {blog.outline.length > 0 && (
            <Card>
              <Label>Table of contents</Label>
              <ol className="list-decimal space-y-1 pl-5 text-[13px] text-[#1A1A2E]">
                {blog.outline.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            </Card>
          )}

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <Label>Full article (Markdown)</Label>
              <div className="flex gap-2">
                <button onClick={() => copy(blog.markdown, "md")} className="output-action-btn">
                  {copied === "md" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} Copy
                </button>
                <button onClick={() => download("md")} className="output-action-btn"><Download className="h-3 w-3" /> .md</button>
                <button onClick={() => download("txt")} className="output-action-btn"><Download className="h-3 w-3" /> .txt</button>
                <ExportToGoogleDocs
                  content={blog.markdown}
                  defaultTitle={blog.title || "PostSpark — Blog post"}
                  sourceTool="SEO Blog"
                />
              </div>
            </div>
            <pre className="max-h-[600px] overflow-auto whitespace-pre-wrap rounded-lg bg-[#FAFAF8] p-4 text-[12.5px] leading-relaxed text-[#1A1A2E]">{blog.markdown}</pre>
          </Card>

          {blog.faq.length > 0 && (
            <Card>
              <Label>FAQ (People Also Ask)</Label>
              <div className="space-y-3">
                {blog.faq.map((f, i) => (
                  <div key={i} className="rounded-lg border border-[#E5E7EB] bg-[#FAFAF8] p-3">
                    <p className="text-[13px] font-semibold text-[#1A1A2E]">{f.q}</p>
                    <p className="mt-1 text-[12.5px] text-[#6B7280]">{f.a}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <Label>Actions</Label>
            <div className="flex flex-wrap gap-2">
              <ActionBtn onClick={sendToHumanizer} icon={<Wand2 className="h-3.5 w-3.5" />}>Send to AI Humanizer</ActionBtn>
              <ActionBtn onClick={() => navigate({ to: "/dashboard/calendar" })} icon={<CalIcon className="h-3.5 w-3.5" />}>Schedule on Calendar</ActionBtn>
              <ActionBtn onClick={generate} icon={<RefreshCw className="h-3.5 w-3.5" />}>Regenerate</ActionBtn>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function SeoScoreBadge({ score }: { score: number }) {
  const cls =
    score >= 8.5 ? "bg-[#D1FAE5] text-[#065F46]" :
    score >= 7 ? "bg-[#FEF3C7] text-[#92400E]" :
    "bg-[#FEE2E2] text-[#991B1B]";
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold ${cls}`}>SEO Score: {score.toFixed(1)}/10</span>;
}

function MetaRow({ label, value, id, copy, copied, mono }: { label: string; value: string; id: string; copy: (t: string, id: string) => void; copied: string | null; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-[#E5E7EB] bg-[#FAFAF8] p-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]">{label}</span>
        <button onClick={() => copy(value, id)} className="text-[#9CA3AF] hover:text-[#6B4EFF]">
          {copied === id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
      <p className={`text-[13px] text-[#1A1A2E] ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function ActionBtn({ children, onClick, icon }: { children: React.ReactNode; onClick: () => void; icon: React.ReactNode }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-[12.5px] font-medium text-[#1A1A2E] transition hover:border-[#6B4EFF] hover:text-[#6B4EFF]">
      {icon}{children}
    </button>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <StudioCard>{children}</StudioCard>;
}
function Label({ children }: { children: React.ReactNode }) {
  return <StudioLabel>{children}</StudioLabel>;
}
function SubLabel({ children }: { children: React.ReactNode }) {
  return <StudioSubLabel>{children}</StudioSubLabel>;
}
function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <ChoicePill active={active} onClick={onClick}>
      {children}
    </ChoicePill>
  );
}

