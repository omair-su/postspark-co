import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Clock, FileText, Download, Star, Search, CheckSquare, Square, Globe, Copy, UserCheck, Trash2 } from "lucide-react";
import { exportToPdf } from "@/lib/exportPdf";
import { toggleFavorite, bulkDeleteJobs } from "@/server/repurpose.functions";
import { togglePublic } from "@/server/gallery.functions";
import { createApprovalRequest } from "@/server/approvals.functions";
import { toast } from "sonner";

interface Job {
  id: string;
  created_at: string;
  input_text: string;
  outputs: Record<string, string>;
  is_favorite: boolean;
  is_public?: boolean;
  public_slug?: string | null;
  title?: string | null;
}

export const Route = createFileRoute("/dashboard/history")({
  component: HistoryPage,
});

function HistoryPage() {
  const { user, session } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selected, setSelected] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterFav, setFilterFav] = useState(false);
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
    if (search && !j.input_text.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

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
        content: v,
      })),
    ]);
    exportToPdf(sections, `repurpose-bulk-${toExport.length}`);
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
        .map(([k, v]) => `${k}: ${v.replace(/"/g, '""').substring(0, 500)}`)
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
                    content: val,
                  })),
                ];
                exportToPdf(sections, `repurpose-${selected.id.slice(0, 8)}`);
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
                const res = await createApprovalRequest({
                  data: { jobId: selected.id },
                  headers: { Authorization: `Bearer ${session.access_token}` },
                });
                if (!(res as any).success) {
                  if ((res as any).error?.includes("AGENCY")) toast.error("Client approvals are an Agency-plan feature.");
                  else toast.error((res as any).error || "Could not create approval link");
                  return;
                }
                const url = `${window.location.origin}/review/${(res as any).token}`;
                await navigator.clipboard.writeText(url);
                toast.success("Approval link copied — share with your client");
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
          Object.entries(selected.outputs).map(([key, val]) => (
            <div key={key} className="mt-4 rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground capitalize">{key}</h2>
                <span className="text-[10px] text-muted-foreground">{val.split(/\s+/).filter(Boolean).length} words</span>
              </div>
              <pre className="mt-2 whitespace-pre-wrap text-sm text-foreground leading-relaxed">{val}</pre>
            </div>
          ))}
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
        </div>
      )}

      {filteredJobs.length === 0 ? (
        <div className="mt-8 rounded-xl border border-border bg-card p-10 text-center">
          <Clock className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">
            {search || filterFav ? "No matching results found." : "No repurposes yet. Create your first one!"}
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {filteredJobs.map((job) => {
            const formats = job.outputs ? Object.keys(job.outputs) : [];
            return (
              <div
                key={job.id}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-accent"
              >
                {bulkMode && (
                  <button onClick={() => toggleBulk(job.id)} className="shrink-0">
                    {bulkSelected.has(job.id) ? (
                      <CheckSquare className="h-4 w-4 text-primary" />
                    ) : (
                      <Square className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                )}
                <button
                  onClick={() => setSelected(job)}
                  className="flex flex-1 items-center justify-between text-left min-w-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <span className="truncate text-sm text-foreground">
                      {job.input_text.slice(0, 50)}...
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <span className="text-xs text-muted-foreground">
                      {formats.length} format{formats.length !== 1 ? "s" : ""}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(job.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </button>
                <button onClick={(e) => handleToggleFavorite(job, e)} className="shrink-0 ml-2">
                  <Star className={`h-4 w-4 transition-colors ${job.is_favorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground hover:text-yellow-400"}`} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
