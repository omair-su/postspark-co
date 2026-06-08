import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Copy, Check, Save, Download, RefreshCw, Wand2, FileDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { saveToSwipeFn, editStudioOutputFn } from "@/lib/guidedStudios.functions";

interface OutputSection { header: string; body: string }

function parseSections(markdown: string): OutputSection[] {
  const lines = markdown.split("\n");
  const sections: OutputSection[] = [];
  let current: OutputSection | null = null;
  for (const line of lines) {
    const h = line.match(/^##\s+(.+)$/);
    if (h) {
      if (current) sections.push(current);
      current = { header: h[1].trim(), body: "" };
    } else if (current) {
      current.body += (current.body ? "\n" : "") + line;
    }
  }
  if (current) sections.push(current);
  if (sections.length === 0) sections.push({ header: "Output", body: markdown });
  return sections.map(s => ({ ...s, body: s.body.trim() }));
}

function downloadTxt(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${filename}.txt`; a.click();
  URL.revokeObjectURL(url);
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-all ${
        copied ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-border bg-background text-foreground hover:border-primary hover:text-primary"
      }`}
    >
      {copied ? <><Check className="h-3.5 w-3.5" /> Copied!</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
    </button>
  );
}

export function OutputPanel({
  output, type, title, onRegenerate, regenerating,
}: {
  output: string; type: string; title: string;
  onRegenerate?: (variant: string) => void; regenerating?: boolean;
}) {
  const { session } = useAuth();
  const sections = useMemo(() => parseSections(output), [output]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [editedBodies, setEditedBodies] = useState<Record<number, string>>({});
  const [editing, setEditing] = useState(false);
  const [editInstruction, setEditInstruction] = useState("");

  const active = sections[activeIdx];
  const activeBody = editedBodies[activeIdx] ?? active.body;

  const handleSave = async () => {
    if (!session) return toast.error("Sign in required");
    const r = await saveToSwipeFn({
      data: { type, title: `${title} — ${active.header}`, platform: active.header, content: activeBody },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (r.success) toast.success("Saved to Swipe File ✓");
    else toast.error(r.error || "Save failed");
  };

  const handleEditAI = async () => {
    if (!session || !editInstruction.trim()) return;
    setEditing(true);
    const r = await editStudioOutputFn({
      data: { content: activeBody, instruction: editInstruction.trim() },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    setEditing(false);
    if (r.error) return toast.error(r.error);
    setEditedBodies(p => ({ ...p, [activeIdx]: r.output }));
    setEditInstruction("");
    toast.success("Updated ✓");
  };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm">
      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-border">
        {sections.map((s, i) => (
          <button key={i} onClick={() => setActiveIdx(i)}
            className={`shrink-0 whitespace-nowrap px-4 py-3 text-[12px] font-medium transition-colors ${
              i === activeIdx ? "border-b-2 border-primary text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}>
            {s.header}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[15px] font-semibold text-foreground">{active.header}</h3>
          <div className="flex flex-wrap gap-1.5">
            <CopyBtn text={activeBody} />
            <button onClick={handleSave} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-[12px] font-medium hover:border-primary hover:text-primary">
              <Save className="h-3.5 w-3.5" /> Save
            </button>
            <button onClick={() => downloadTxt(activeBody, active.header.toLowerCase().replace(/\s+/g, "-"))} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-[12px] font-medium hover:border-primary hover:text-primary">
              <Download className="h-3.5 w-3.5" /> .txt
            </button>
            <button onClick={() => downloadTxt(output, type)} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-[12px] font-medium hover:border-primary hover:text-primary">
              <FileDown className="h-3.5 w-3.5" /> All
            </button>
          </div>
        </div>

        <pre className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap break-words rounded-xl bg-muted/30 p-4 font-sans text-[13.5px] leading-relaxed text-foreground">
          {activeBody}
        </pre>
        <p className="mt-2 text-right text-[11px] text-muted-foreground">{activeBody.length} chars · {activeBody.split(/\s+/).filter(Boolean).length} words</p>

        {/* AI Edit */}
        <div className="mt-4 rounded-xl border border-border bg-muted/20 p-3">
          <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-foreground">
            <Wand2 className="h-3.5 w-3.5 text-primary" /> Edit with AI
          </p>
          <div className="flex flex-wrap gap-1.5">
            {["Make it shorter", "More casual", "More bold", "Less AI-sounding", "Add emojis", "Add a stronger hook"].map(p => (
              <button key={p} onClick={() => setEditInstruction(p)}
                className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground hover:border-primary hover:text-primary">
                {p}
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input value={editInstruction} onChange={e => setEditInstruction(e.target.value)} placeholder="Or type your own instruction…"
              className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-[12px] focus:border-primary focus:outline-none" />
            <button onClick={handleEditAI} disabled={editing || !editInstruction.trim()}
              className="rounded-lg bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground disabled:opacity-50">
              {editing ? "…" : "Apply"}
            </button>
          </div>
        </div>

        {/* Regenerate variations */}
        {onRegenerate && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            <span className="text-[12px] text-muted-foreground">Regenerate:</span>
            {[
              { v: "angle", l: "Different angle" }, { v: "tone", l: "Different tone" },
              { v: "shorter", l: "Shorter" }, { v: "data", l: "More data" },
            ].map(b => (
              <button key={b.v} onClick={() => onRegenerate(b.v)} disabled={regenerating}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-50">
                <RefreshCw className={`h-3 w-3 ${regenerating ? "animate-spin" : ""}`} /> {b.l}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
