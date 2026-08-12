import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check, Code2, Eye, FileCode2, Pencil, Save, X } from "lucide-react";
import { GhostButton, StudioLabel } from "@/components/tools/studio";

/**
 * Premium article canvas: rendered preview, raw markdown, HTML export view,
 * plus inline editing of the whole draft.
 */
export function ArticlePreview({
  markdown,
  onChange,
  actions,
}: {
  markdown: string;
  onChange?: (md: string) => void;
  actions?: React.ReactNode;
}) {
  const [mode, setMode] = useState<"preview" | "md" | "html">("preview");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(markdown);
  const [copied, setCopied] = useState<string | null>(null);

  const html = useMemo(() => markdownToHtml(markdown), [markdown]);

  const copy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1400);
  };

  const startEdit = () => {
    setDraft(markdown);
    setEditing(true);
  };

  return (
    <div className="pw-surface p-5">
      <StudioLabel
        action={
          <div className="flex flex-wrap items-center gap-1.5">
            <GhostButton
              icon={<Eye className="h-3.5 w-3.5" />}
              onClick={() => setMode("preview")}
              className={mode === "preview" ? "border-primary/60 text-primary" : ""}
            >
              Preview
            </GhostButton>
            <GhostButton
              icon={<Code2 className="h-3.5 w-3.5" />}
              onClick={() => setMode("md")}
              className={mode === "md" ? "border-primary/60 text-primary" : ""}
            >
              Markdown
            </GhostButton>
            <GhostButton
              icon={<FileCode2 className="h-3.5 w-3.5" />}
              onClick={() => setMode("html")}
              className={mode === "html" ? "border-primary/60 text-primary" : ""}
            >
              HTML
            </GhostButton>
            {onChange && !editing && (
              <GhostButton icon={<Pencil className="h-3.5 w-3.5" />} onClick={startEdit}>
                Edit
              </GhostButton>
            )}
            {onChange && editing && (
              <>
                <GhostButton
                  icon={<Save className="h-3.5 w-3.5" />}
                  onClick={() => {
                    onChange(draft);
                    setEditing(false);
                  }}
                >
                  Save
                </GhostButton>
                <GhostButton icon={<X className="h-3.5 w-3.5" />} onClick={() => setEditing(false)}>
                  Cancel
                </GhostButton>
              </>
            )}
            <GhostButton
              icon={copied === "body" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              onClick={() => copy(mode === "html" ? html : markdown, "body")}
            >
              Copy
            </GhostButton>
            {actions}
          </div>
        }
      >
        Article canvas
      </StudioLabel>

      {editing ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={26}
          className="ps-input w-full font-mono text-[12.5px] leading-relaxed"
        />
      ) : mode === "preview" ? (
        <div className="ps-prose max-h-[700px] overflow-auto rounded-xl border border-border bg-card/40 p-5">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
        </div>
      ) : (
        <pre className="max-h-[700px] overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-card/40 p-4 text-[12.5px] leading-relaxed text-foreground/90">
          {mode === "html" ? html : markdown}
        </pre>
      )}
    </div>
  );
}

/** Minimal, dependency-free markdown to HTML for the export view. */
export function markdownToHtml(md: string): string {
  const inline = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|\W)\*([^*]+)\*/g, "$1<em>$2</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  const out: string[] = [];
  let inList = false;
  const closeList = () => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };

  (md || "").split("\n").forEach((raw) => {
    const line = raw.trimEnd();
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      closeList();
      const lvl = h[1].length;
      out.push(`<h${lvl}>${inline(h[2])}</h${lvl}>`);
      return;
    }
    const li = /^\s*[-*]\s+(.*)$/.exec(line);
    if (li) {
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${inline(li[1])}</li>`);
      return;
    }
    if (!line.trim()) {
      closeList();
      return;
    }
    closeList();
    out.push(`<p>${inline(line)}</p>`);
  });
  closeList();
  return out.join("\n");
}
