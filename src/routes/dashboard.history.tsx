import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Clock, FileText, Download, Star, Search, CheckSquare, Square, Globe, Copy, UserCheck, Trash2, RefreshCw } from "lucide-react";
import { exportToPdf } from "@/lib/exportPdf";
import { useSubscription } from "@/hooks/useSubscription";
import { toggleFavorite, bulkDeleteJobs } from "@/lib/repurpose.functions";
import { togglePublic } from "@/lib/gallery.functions";
import { createApprovalRequest } from "@/lib/approvals.functions";
import { toast } from "sonner";

interface Job {
  id: string;
  created_at: string;
  input_text: string;
  outputs: Record<string, any>;
  is_favorite: boolean;
  is_public?: boolean;
  public_slug?: string | null;
  title?: string | null;
  tool?: string | null;
}

const TOOL_LABEL: Record<string, string> = {
  repurpose: "Repurpose",
  humanizer: "Humanizer",
  reply_generator: "Reply Gen",
  copilot: "Copilot",
  carousel: "Carousel",
  thumbnail: "Thumbnail",
  image: "Image",
  "image-edit": "Image Edit",
  podcast: "Podcast",
  linkedin_downloader: "LinkedIn DL",
};

export const Route = createFileRoute("/dashboard/history")({
  component: HistoryPage,
});

function HistoryPage() {
  const { user, session } = useAuth();
  const { tier } = useSubscription();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selected, setSelected] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterFav, setFilterFav] = useState(false);
  const [filterTool, setFilterTool] = useState<string>("all");
  const [filterModel, setFilterModel] = useState<string>("all");
  const [filterRange, setFilterRange] = useState<"all" | "7" | "30" | "90">("all");
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);

  useEffect(() => {
    if (!user) return;
    (supabase as any)
      .from("repurpose_jobs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }: { data: any }) => {
        setJobs((data as Job[]) || []);
        setLoading(false);
      });
  }, [user]);

  const handleToggleFavorite = async (job: Job, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session) return;
    const newVal = !job.is_favorite;
    setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, is_favorite: newVal } : j)));
    await toggleFavorite({
      data: { jobId: job.id, isFavorite: newVal },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
  };

  const toggleBulk = (id: string) => {
    const next = new Set(bulkSelected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setBulkSelected(next);
  };

  const filteredJobs = jobs.filter((j) => {
    if (filterFav && !j.is_favorite) return false;
    if (filterTool !== "all" && (j.tool || "repurpose") !== filterTool) return false;
    if (filterModel !== "all") {
      const m = (j.outputs as any)?.model || "";
      if (m !== filterModel) return false;
    }
    if (filterRange !== "all") {
      const days = Number(filterRange);
      const cutoff = Date.now() - days * 86_400_000;
      if (new Date(j.created_at).getTime() < cutoff) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const promptText = (j.outputs as any)?.prompt || (j.outputs as any)?.original_prompt || "";
      const hay = `${j.title || ""} ${j.input_text} ${promptText}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const availableModels = Array.from(
    new Set(jobs.map((j) => (j.outputs as any)?.model).filter(Boolean) as string[]),
  );
  const availableTools = Array.from(new Set(jobs.map((j) => j.tool || "repurpose")));

  const handleBulkDelete = async () => {
    if (!session) return;
    const ids = Array.from(bulkSelected);
    if (ids.length === 0) { toast.error("Select at least one item"); return; }
    if (!confirm(`Delete ${ids.length} item${ids.length === 1 ? "" : "s"}? This cannot be undone.`)) return;
    const res: any = await bulkDeleteJobs({
      data: { ids },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (res.success) {
      setJobs((prev) => prev.filter((j) => !bulkSelected.has(j.id)));
      setBulkSelected(new Set());
      toast.success(`Deleted ${res.deleted}`);
    } else {
      toast.error("Delete failed");
    }
  };

  const handleBulkExportPdf = () => {
    const toExport = filteredJobs.filter((j) => bulkSelected.has(j.id));
    if (toExport.length === 0) {
      toast.error("Select at least one item");
      return;
    }
    const sections = toExport.flatMap((j) => [
      { title: `Input (${new Date(j.created_at).toLocaleDateString()})`, content: j.input_text },
      ...Object.entries(j.outputs || {}).map(([k, v]) => ({
        title: k.charAt(0).toUpperCase() + k.slice(1),
        content: typeof v === "string" ? v : JSON.stringify(v, null, 2),
      })),
    ]);
    exportToPdf(sections, `repurpose-bulk-${toExport.length}`, { watermark: tier === "free" });
    toast.success(`Exported ${toExport.length} items as PDF!`);
  };

  const handleBulkExportCsv = () => {
    const toExport = filteredJobs.filter((j) => bulkSelected.has(j.id));
    if (toExport.length === 0) {
      toast.error("Select at least one item");
      return;
    }
    const header = "Date,Input,Outputs\n";
    const rows = toExport.map((j) => {
      const outputs = Object.entries(j.outputs || {})
        .map(([k, v]) => {
          const s = typeof v === "string" ? v : JSON.stringify(v);
          return `${k}: ${s.replace(/"/g, '""').substring(0, 500)}`;
        })
        .join(" | ");
      return `"${new Date(j.created_at).toLocaleDateString()}","${j.input_text.replace(/"/g, '""').substring(0, 200)}","${outputs.replace(/"/g, '""')}"`;
    });
    const csv = header + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `repurpose-export-${toExport.length}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${toExport.length} items as CSV!`);
  };

  const selectAll = () => {
    if (bulkSelected.size === filteredJobs.length) {
      setBulkSelected(new Set());
    } else {
      setBulkSelected(new Set(filteredJobs.map((j) => j.id)));
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl animate-fade-in">
        <div className="h-7 w-40 rounded bg-accent animate-pulse" />
        <div className="mt-2 h-4 w-64 rounded bg-accent animate-pulse" />
        <div className="mt-6 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card px-4 py-4">
              <div className="h-4 w-3/4 animate-pulse rounded bg-accent" />
              <div className="mt-2 flex gap-4">
                <div className="h-3 w-16 animate-pulse rounded bg-accent" />
                <div className="h-3 w-20 animate-pulse rounded bg-accent" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (selected) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setSelected(null)}
            className="text-sm font-medium text-primary hover:underline"
          >
            ← Back to History
          </button>
          <div className="flex gap-2">
            <button
              onClick={(e) => handleToggleFavorite(selected, e)}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Star className={`h-3.5 w-3.5 ${selected.is_favorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
              {selected.is_favorite ? "Unfavorite" : "Favorite"}
            </button>
            <button
              onClick={() => {
                const sections = [
                  { title: "Original Input", content: selected.input_text },
                  ...Object.entries(selected.outputs || {}).map(([key, val]) => ({
                    title: key.charAt(0).toUpperCase() + key.slice(1),
                    content: typeof val === "string" ? val : JSON.stringify(val, null, 2),
                  })),
                ];
                exportToPdf(sections, `repurpose-${selected.id.slice(0, 8)}`, { watermark: tier === "free" });
                toast.success("PDF downloaded!");
              }}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Download className="h-3.5 w-3.5" /> Export PDF
            </button>
            <button
              onClick={async () => {
                if (!session) return;
                const newVal = !selected.is_public;
                try {
                  const res = await togglePublic({
                    data: { jobId: selected.id, isPublic: newVal, title: selected.title || selected.input_text.slice(0, 80) },
                    headers: { Authorization: `Bearer ${session.access_token}` },
                  });
                  setSelected({ ...selected, is_public: newVal, public_slug: res.slug });
                  setJobs((prev) => prev.map((j) => (j.id === selected.id ? { ...j, is_public: newVal, public_slug: res.slug } : j)));
                  toast.success(newVal ? "Now public in the Gallery!" : "Made private");
                } catch (err) {
                  toast.error("Could not update sharing");
                }
              }}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${selected.is_public ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}
            >
              <Globe className="h-3.5 w-3.5" /> {selected.is_public ? "Public" : "Make public"}
            </button>
            {selected.is_public && selected.public_slug && (
              <button
                onClick={() => {
                  const url = `${window.location.origin}/gallery/${selected.public_slug}`;
                  navigator.clipboard.writeText(url);
                  toast.success("Public link copied!");
                }}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <Copy className="h-3.5 w-3.5" /> Copy link
              </button>
            )}
            <button
              onClick={async () => {
                if (!session) return;
                const clientEmail = window.prompt(
                  "Email this approval link to your client (optional — leave blank to just copy the link):",
                  ""
                );
                if (clientEmail === null) return; // cancel
                const trimmed = clientEmail.trim();
                const res = await createApprovalRequest({
                  data: { jobId: selected.id, clientEmail: trimmed || null },
                  headers: { Authorization: `Bearer ${session.access_token}` },
                });
                if (!(res as any).success) {
                  if ((res as any).error?.includes("AGENCY")) toast.error("Client approvals are an Agency-plan feature.");
                  else toast.error((res as any).error || "Could not create approval link");
                  return;
                }
                const token = (res as any).token;
                const url = `${window.location.origin}/review/${token}`;
                await navigator.clipboard.writeText(url);

                if (trimmed && /\S+@\S+\.\S+/.test(trimmed)) {
                  try {
                    const { sendTransactionalEmail } = await import("@/lib/email/send");
                    await sendTransactionalEmail({
                      templateName: "approval-request",
                      recipientEmail: trimmed,
                      idempotencyKey: `approval-${token}`,
                      templateData: {
                        jobTitle: selected.title || selected.input_text?.slice(0, 60) || "Content for review",
                        senderName: (user as any)?.user_metadata?.full_name || (user as any)?.email,
                        reviewUrl: url,
                      },
                    });
                    toast.success(`Approval link sent to ${trimmed} (link also copied)`);
                  } catch (e: any) {
                    console.warn("Approval email failed", e);
                    toast.success("Approval link copied — email failed, share manually");
                  }
                } else {
                  toast.success("Approval link copied — share with your client");
                }
              }}
              className="flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
            >
              <UserCheck className="h-3.5 w-3.5" /> Send for approval
            </button>
          </div>
        </div>
        <h1 className="text-xl font-bold text-foreground">Repurpose Details</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Created {new Date(selected.created_at).toLocaleString()}
        </p>

        <div className="mt-4 rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground">Input</h2>
          <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{selected.input_text}</p>
        </div>

        {selected.outputs &&
          Object.entries(selected.outputs).map(([key, val]) => {
            const isImageUrl = typeof val === "string" && key === "image_url" && /^https?:\/\//.test(val);
            const isCarouselObj = key === "carousel" && val && typeof val === "object";
            return (
              <div key={key} className="mt-4 rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground capitalize">{key.replace(/_/g, " ")}</h2>
                  {typeof val === "string" && !isImageUrl && (
                    <span className="text-[10px] text-muted-foreground">{val.split(/\s+/).filter(Boolean).length} words</span>
                  )}
                </div>
                {isImageUrl ? (
                  <div className="mt-2 space-y-2">
                    <img src={val as string} alt={key} className="max-h-96 w-auto rounded-lg border border-border" />
                    <div className="flex gap-2">
                      <a
                        href={val as string}
                        download
                        className="inline-flex items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent"
                      >
                        <Download className="h-3.5 w-3.5" /> Download
                      </a>
                      <button
                        onClick={() => { navigator.clipboard.writeText(val as string); toast.success("URL copied"); }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent"
                      >
                        <Copy className="h-3.5 w-3.5" /> Copy URL
                      </button>
                    </div>
                  </div>
                ) : isCarouselObj ? (
                  <div className="mt-2 space-y-2">
                    {(val as any).caption && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground">Caption</p>
                        <p className="whitespace-pre-wrap text-sm text-foreground">{(val as any).caption}</p>
                      </div>
                    )}
                    {Array.isArray((val as any).slides) && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground">Slides ({(val as any).slides.length})</p>
                        <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-foreground">
                          {(val as any).slides.map((s: any, i: number) => (
                            <li key={i}><strong>{s.title}</strong> — {s.body}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                    {Array.isArray((val as any).hashtags) && (val as any).hashtags.length > 0 && (
                      <p className="text-xs text-muted-foreground">{(val as any).hashtags.join(" ")}</p>
                    )}
                  </div>
                ) : typeof val === "string" ? (
                  <pre className="mt-2 whitespace-pre-wrap text-sm text-foreground leading-relaxed">{val}</pre>
                ) : (
                  <pre className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">{JSON.stringify(val, null, 2)}</pre>
                )}
              </div>
            );
          })}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My History</h1>
          <p className="mt-1 text-sm text-muted-foreground">View all your past repurposes.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setBulkMode(!bulkMode)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${bulkMode ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}
          >
            {bulkMode ? "Cancel" : "Select"}
          </button>
          <button
            onClick={() => setFilterFav(!filterFav)}
            className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${filterFav ? "border-yellow-400 bg-yellow-400/10 text-yellow-600" : "border-border text-muted-foreground hover:text-foreground"}`}
          >
            <Star className={`h-3 w-3 ${filterFav ? "fill-yellow-400 text-yellow-400" : ""}`} /> Favorites
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mt-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your history..."
          className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Bulk actions */}
      {bulkMode && (
        <div className="mt-3 flex items-center gap-3 flex-wrap">
          <button onClick={selectAll} className="text-xs font-medium text-primary hover:underline">
            {bulkSelected.size === filteredJobs.length ? "Deselect All" : "Select All"}
          </button>
          <span className="text-xs text-muted-foreground">{bulkSelected.size} selected</span>
          <button onClick={handleBulkExportPdf} className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground">
            <Download className="h-3 w-3" /> Export PDF
          </button>
          <button onClick={handleBulkExportCsv} className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground">
            <Download className="h-3 w-3" /> Export CSV
          </button>
          <button onClick={handleBulkDelete} className="flex items-center gap-1 rounded-lg border border-destructive/30 px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/10">
            <Trash2 className="h-3 w-3" /> Delete
          </button>
        </div>
      )}

      {filteredJobs.length === 0 ? (
        <div className="ds-card mt-8 p-10 text-center">
          <Clock className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">
            {search || filterFav ? "No matching results found." : "No repurposes yet. Create your first one!"}
          </p>
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          {filteredJobs.map((job) => {
            const formats = job.outputs ? Object.keys(job.outputs) : [];
            const firstTextOutput = Object.entries(job.outputs || {}).find(
              ([, v]) => typeof v === "string"
            )?.[1] as string | undefined;
            return (
              <div
                key={job.id}
                className="ds-card ds-card-hover group relative overflow-hidden p-4"
              >
                <div className="flex items-start gap-3">
                  {bulkMode && (
                    <button onClick={() => toggleBulk(job.id)} className="mt-1 shrink-0">
                      {bulkSelected.has(job.id) ? (
                        <CheckSquare className="h-4 w-4 text-[#a78bfa]" />
                      ) : (
                        <Square className="h-4 w-4 text-white/40" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => setSelected(job)}
                    className="flex flex-1 flex-col text-left min-w-0"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 shrink-0 text-[#a78bfa]" />
                      <span className="truncate text-sm font-semibold text-white">
                        {(job.title || job.input_text).slice(0, 70)}
                      </span>
                      {job.tool && job.tool !== "repurpose" && (
                        <span className="shrink-0 rounded-full bg-[#7c3aed]/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#c4b5fd]">
                          {TOOL_LABEL[job.tool] || job.tool}
                        </span>
                      )}
                    </div>
                    {formats.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {formats.slice(0, 6).map((f) => (
                          <span key={f} className="rounded-md bg-white/[0.04] border border-white/10 px-2 py-0.5 text-[10px] font-medium text-white/70">
                            {f.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-3 text-[11px] text-white/45">
                      <span>{formats.length} format{formats.length !== 1 ? "s" : ""}</span>
                      <span>·</span>
                      <span>{new Date(job.created_at).toLocaleDateString()}</span>
                    </div>
                  </button>

                  <div className="flex shrink-0 items-center gap-1">
                    {job.tool === "linkedin_downloader" && (
                      <a
                        href={`/tools/linkedin-video-downloader?url=${encodeURIComponent(job.input_text)}`}
                        onClick={(e) => e.stopPropagation()}
                        title="Retry download"
                        className="rounded-md p-1.5 text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {firstTextOutput && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(firstTextOutput);
                          toast.success("Copied to clipboard");
                        }}
                        title="Copy first output"
                        className="rounded-md p-1.5 text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const sections = [
                          { title: "Original Input", content: job.input_text },
                          ...Object.entries(job.outputs || {}).map(([k, v]) => ({
                            title: k.charAt(0).toUpperCase() + k.slice(1),
                            content: typeof v === "string" ? v : JSON.stringify(v, null, 2),
                          })),
                        ];
                        exportToPdf(sections, `repurpose-${job.id.slice(0, 8)}`, { watermark: tier === "free" });
                        toast.success("PDF downloaded");
                      }}
                      title="Export PDF"
                      className="rounded-md p-1.5 text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleToggleFavorite(job, e)}
                      title={job.is_favorite ? "Unfavorite" : "Favorite"}
                      className="rounded-md p-1.5 text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white"
                    >
                      <Star className={`h-3.5 w-3.5 ${job.is_favorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
