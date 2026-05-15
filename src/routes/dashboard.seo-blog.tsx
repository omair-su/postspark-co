import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { FileText, Loader2, Sparkles, Copy, Check, Download, Search, Plus, Trash2 } from "lucide-react";
import { generateBlog, generateOutline } from "@/lib/seoBlog.functions";
import { withAIProgress } from "@/lib/aiProgress";

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
}

const LANGS = [
  "English","Spanish","French","German","Portuguese","Italian","Dutch",
  "Polish","Swedish","Turkish","Arabic","Hindi","Japanese","Korean",
  "Chinese (Simplified)","Russian","Ukrainian","Indonesian","Vietnamese",
];

interface Outline {
  title: string;
  outline: { h2: string; h3?: string[] }[];
  competitorHeadings: { url: string; headings: string[] }[];
  suggestedInternalLinks: { title: string; slug: string; anchor: string }[];
}

function SeoBlogPage() {
  const { session } = useAuth();
  const [tab, setTab] = useState<"blog" | "outline">("blog");
  const [topic, setTopic] = useState("");
  const [keyword, setKeyword] = useState("");
  const [wordTarget, setWordTarget] = useState(1200);
  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState(false);
  const [blog, setBlog] = useState<Blog | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Outline tab state
  const [competitors, setCompetitors] = useState<string[]>([""]);
  const [outline, setOutline] = useState<Outline | null>(null);
  const [outlineLoading, setOutlineLoading] = useState(false);
  const [selectedLinks, setSelectedLinks] = useState<Set<number>>(new Set());

  const generateOutlineFn = async () => {
    if (!session) return toast.error("Please sign in");
    if (topic.trim().length < 3) return toast.error("Add a topic");
    if (keyword.trim().length < 2) return toast.error("Add a target keyword");
    setOutlineLoading(true);
    setOutline(null);
    setSelectedLinks(new Set());
    try {
      const urls = competitors.map((u) => u.trim()).filter((u) => /^https?:\/\//i.test(u));
      const res: any = await withAIProgress(generateOutline({
        data: { topic: topic.trim(), keyword: keyword.trim(), language, competitorUrls: urls },
        headers: { Authorization: `Bearer ${session.access_token}` },
      }));
      if (res.error) toast.error(res.error);
      else if (!res.outline?.length) toast.error("No outline returned");
      else { setOutline(res); toast.success("Outline ready"); }
    } catch (e) {
      console.error(e);
      toast.error("Outline failed");
    } finally {
      setOutlineLoading(false);
    }
  };

  const generate = async () => {
    if (!session) return toast.error("Please sign in");
    if (topic.trim().length < 3) return toast.error("Add a topic");
    if (keyword.trim().length < 2) return toast.error("Add a target keyword");
    setLoading(true);
    setBlog(null);
    try {
      const res = await withAIProgress(generateBlog({
        data: { topic: topic.trim(), keyword: keyword.trim(), wordTarget, language },
        headers: { Authorization: `Bearer ${session.access_token}` },
      }));
      if (res.error) {
        toast.error(res.error);
      } else if (!res.markdown) {
        toast.error("No blog returned");
      } else {
        setBlog(res);
        toast.success("Blog ready");
      }
    } catch (e) {
      console.error(e);
      toast.error("Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const copy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const download = () => {
    if (!blog) return;
    const front = `---\ntitle: "${blog.title.replace(/"/g, '\\"')}"\ndescription: "${blog.metaDescription.replace(/"/g, '\\"')}"\nslug: ${blog.slug}\n---\n\n`;
    const blob = new Blob([front + blog.markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${blog.slug || "post"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-electric">
          <FileText className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SEO Blog Generator</h1>
          <p className="text-sm text-muted-foreground">
            Long-form, search-optimized articles with title, meta, outline, body, and FAQ.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {(["blog", "outline"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
              tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "blog" ? "Full blog" : "Outline + competitors"}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">Topic / angle</label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            rows={2}
            placeholder="e.g. How small SaaS teams can ship faster with async workflows"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium">Target keyword</label>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g. async workflow"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Word target</label>
            <select
              value={wordTarget}
              onChange={(e) => setWordTarget(Number(e.target.value))}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              <option value={800}>~800 words</option>
              <option value={1200}>~1,200 words</option>
              <option value={1800}>~1,800 words</option>
              <option value={2500}>~2,500 words</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {LANGS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        {tab === "outline" && (
          <div className="space-y-2 rounded-lg border border-dashed border-border p-3">
            <label className="block text-sm font-medium">Competitor URLs (up to 3)</label>
            {competitors.map((url, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={url}
                  onChange={(e) => {
                    const next = [...competitors];
                    next[i] = e.target.value;
                    setCompetitors(next);
                  }}
                  placeholder="https://competitor.com/article"
                  className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setCompetitors(competitors.filter((_, idx) => idx !== i))}
                  className="rounded-lg border border-input p-2 text-muted-foreground hover:bg-accent"
                  aria-label="Remove URL"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {competitors.length < 3 && (
              <button
                type="button"
                onClick={() => setCompetitors([...competitors, ""])}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Plus className="h-3 w-3" /> Add competitor
              </button>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {tab === "blog" ? (
            <button
              onClick={generate}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg gradient-electric px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-60"
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Writing your article…</> : <><Sparkles className="h-4 w-4" /> Generate SEO blog</>}
            </button>
          ) : (
            <button
              onClick={generateOutlineFn}
              disabled={outlineLoading}
              className="inline-flex items-center gap-2 rounded-lg gradient-electric px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-60"
            >
              {outlineLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing competitors…</> : <><Search className="h-4 w-4" /> Generate outline</>}
            </button>
          )}
        </div>
      </div>

      {tab === "outline" && outline && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Suggested title</h3>
            <p className="text-base font-semibold text-foreground">{outline.title}</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-3 text-sm font-semibold">Proposed outline</h3>
            <ol className="list-decimal space-y-3 pl-5 text-sm text-foreground">
              {outline.outline.map((s, i) => (
                <li key={i}>
                  <p className="font-semibold">{s.h2}</p>
                  {s.h3 && s.h3.length > 0 && (
                    <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
                      {s.h3.map((h, j) => <li key={j}>{h}</li>)}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          </div>

          {outline.suggestedInternalLinks.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="mb-3 text-sm font-semibold">Internal links to include</h3>
              <div className="space-y-2">
                {outline.suggestedInternalLinks.map((l, i) => (
                  <label key={i} className="flex cursor-pointer items-start gap-2 rounded-lg border border-border p-2 hover:bg-accent">
                    <input
                      type="checkbox"
                      checked={selectedLinks.has(i)}
                      onChange={(e) => {
                        const next = new Set(selectedLinks);
                        if (e.target.checked) next.add(i);
                        else next.delete(i);
                        setSelectedLinks(next);
                      }}
                      className="mt-1"
                    />
                    <div className="flex-1 text-sm">
                      <p className="font-medium text-foreground">{l.title}</p>
                      <p className="text-xs text-muted-foreground">/blog/{l.slug} → "<span className="italic">{l.anchor}</span>"</p>
                    </div>
                  </label>
                ))}
              </div>
              {selectedLinks.size > 0 && (
                <button
                  onClick={() => {
                    const md = Array.from(selectedLinks)
                      .map((i) => outline.suggestedInternalLinks[i])
                      .map((l) => `[${l.anchor}](/blog/${l.slug})`)
                      .join("\n");
                    navigator.clipboard.writeText(md);
                    toast.success("Copied as markdown links");
                  }}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-input px-3 py-1.5 text-xs hover:bg-accent"
                >
                  <Copy className="h-3 w-3" /> Copy {selectedLinks.size} as markdown
                </button>
              )}
            </div>
          )}

          {outline.competitorHeadings.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="mb-3 text-sm font-semibold">Competitor headings analyzed</h3>
              <div className="space-y-3">
                {outline.competitorHeadings.map((c, i) => (
                  <div key={i}>
                    <p className="truncate text-xs font-mono text-muted-foreground">{c.url}</p>
                    {c.headings.length > 0 ? (
                      <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs">
                        {c.headings.slice(0, 12).map((h, j) => <li key={j}>{h}</li>)}
                      </ul>
                    ) : (
                      <p className="text-xs italic text-muted-foreground">No headings extracted (page may block bots)</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {blog && (
        <div className="space-y-4">
          {/* Meta panel */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <MetaRow label="Title" value={blog.title} id="title" copy={copy} copied={copied} />
            <MetaRow label="Meta description" value={blog.metaDescription} id="meta" copy={copy} copied={copied} />
            <MetaRow label="Slug" value={blog.slug} id="slug" copy={copy} copied={copied} mono />
          </div>

          {/* Outline */}
          {blog.outline.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="mb-3 text-sm font-semibold">Outline</h3>
              <ol className="list-decimal space-y-1 pl-5 text-sm text-foreground">
                {blog.outline.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            </div>
          )}

          {/* Markdown body */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Article (Markdown)</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => copy(blog.markdown, "md")}
                  className="inline-flex items-center gap-1 rounded-lg border border-input px-2.5 py-1.5 text-xs hover:bg-accent"
                >
                  {copied === "md" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} Copy
                </button>
                <button
                  onClick={download}
                  className="inline-flex items-center gap-1 rounded-lg border border-input px-2.5 py-1.5 text-xs hover:bg-accent"
                >
                  <Download className="h-3 w-3" /> .md
                </button>
              </div>
            </div>
            <pre className="max-h-[500px] overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-4 text-xs leading-relaxed text-foreground">
              {blog.markdown}
            </pre>
          </div>

          {/* FAQ */}
          {blog.faq.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="mb-3 text-sm font-semibold">FAQ (People Also Ask)</h3>
              <div className="space-y-3">
                {blog.faq.map((f, i) => (
                  <div key={i} className="rounded-lg border border-border p-3">
                    <p className="text-sm font-semibold text-foreground">{f.q}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{f.a}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MetaRow({
  label, value, id, copy, copied, mono,
}: {
  label: string; value: string; id: string;
  copy: (t: string, id: string) => void; copied: string | null; mono?: boolean;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <button
          onClick={() => copy(value, id)}
          className="text-muted-foreground hover:text-foreground"
        >
          {copied === id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
      <p className={`text-sm ${mono ? "font-mono" : ""} text-foreground`}>{value}</p>
    </div>
  );
}
