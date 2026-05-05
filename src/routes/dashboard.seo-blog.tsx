import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { FileText, Loader2, Sparkles, Copy, Check, Download } from "lucide-react";
import { generateBlog } from "@/lib/seoBlog.functions";
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

function SeoBlogPage() {
  const { session } = useAuth();
  const [topic, setTopic] = useState("");
  const [keyword, setKeyword] = useState("");
  const [wordTarget, setWordTarget] = useState(1200);
  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState(false);
  const [blog, setBlog] = useState<Blog | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

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

        <button
          onClick={generate}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg gradient-electric px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Writing your article…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Generate SEO blog
            </>
          )}
        </button>
      </div>

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
