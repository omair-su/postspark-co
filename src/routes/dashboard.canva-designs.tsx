import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Download,
  ExternalLink,
  History,
  Loader2,
  RefreshCw,
  RotateCcw,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CanvaBadge,
  CanvaConnectButton,
  useCanvaStatus,
} from "@/components/canva/CanvaConnect";
import { CanvaTemplateCategories } from "@/components/canva/CanvaTemplateCategories";
import {
  deleteCanvaDesign,
  exportCanvaDesign,
  importCanvaDesigns,
  listCanvaDesignVersions,
  listCanvaDesigns,
  publishCanvaDesign,
  restoreCanvaDesignVersion,
  syncCanvaDesign,
} from "@/lib/canva.functions";

export const Route = createFileRoute("/dashboard/canva-designs")({
  head: () => ({
    meta: [
      { title: "Canva designs — PostSpark" },
      {
        name: "description",
        content: "Every design you created in Canva from PostSpark, ready to edit or export.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CanvaDesignsPage,
});

function CanvaDesignsPage() {
  const { status, loading, authHeaders } = useCanvaStatus();
  const [designs, setDesigns] = useState<any[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<{ design: any; urls: string[] } | null>(null);
  const [history, setHistory] = useState<{ design: any; versions: any[] } | null>(null);

  const load = async () => {
    if (!status?.connected) return;
    setFetching(true);
    try {
      const r: any = await listCanvaDesigns({ data: {}, ...authHeaders });
      setDesigns(r?.designs ?? []);
    } catch {
      /* non-fatal */
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    load();
    const params = new URLSearchParams(window.location.search);
    if (params.get("canva") === "connected") toast.success("Canva connected");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status?.connected]);

  /** Pull new/updated designs from Canva into the gallery. */
  const importBack = async () => {
    setImporting(true);
    try {
      const r: any = await importCanvaDesigns({ ...authHeaders });
      if (r?.error) throw new Error(r.error);
      const { imported = 0, updated = 0 } = r ?? {};
      toast.success(
        imported || updated
          ? `Imported ${imported} new · refreshed ${updated} design${updated === 1 ? "" : "s"}`
          : "Everything is already up to date",
      );
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Could not import from Canva");
    } finally {
      setImporting(false);
    }
  };

  const syncOne = async (d: any) => {
    setBusy(`${d.id}:sync`);
    try {
      const r: any = await syncCanvaDesign({ data: { id: d.id }, ...authHeaders });
      if (r?.error) throw new Error(r.error);
      toast.success("Pulled your latest Canva edits");
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Could not sync that design");
    } finally {
      setBusy(null);
    }
  };

  /** Export and show a preview grid (one image per Canva page) before downloading. */
  const exportPreview = async (d: any, format: "png" | "pdf") => {
    setBusy(`${d.id}:${format}`);
    try {
      const r: any = await exportCanvaDesign({
        data: { designId: d.canva_design_id, format },
        ...authHeaders,
      });
      if (r?.error) throw new Error(r.error);
      const urls: string[] = r?.urls ?? [];
      if (format === "pdf") {
        urls.forEach((u) => window.open(u, "_blank", "noopener,noreferrer"));
        toast.success("PDF exported from Canva");
      } else {
        setPreview({ design: d, urls });
      }
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Canva export failed");
    } finally {
      setBusy(null);
    }
  };

  const publish = async (d: any) => {
    setBusy(`${d.id}:publish`);
    try {
      const r: any = await publishCanvaDesign({ data: { id: d.id, format: "png" }, ...authHeaders });
      if (r?.error) throw new Error(r.error);
      toast.success("Published — final version saved to your account");
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Could not publish that design");
    } finally {
      setBusy(null);
    }
  };

  const openHistory = async (d: any) => {
    setBusy(`${d.id}:history`);
    try {
      const r: any = await listCanvaDesignVersions({ data: { id: d.id }, ...authHeaders });
      if (r?.error) throw new Error(r.error);
      setHistory({ design: d, versions: r?.versions ?? [] });
    } catch (e: any) {
      toast.error(e?.message || "Could not load version history");
    } finally {
      setBusy(null);
    }
  };

  const restore = async (versionId: string) => {
    setBusy(`restore:${versionId}`);
    try {
      const r: any = await restoreCanvaDesignVersion({ data: { versionId }, ...authHeaders });
      if (r?.error) throw new Error(r.error);
      toast.success("Version restored");
      setHistory(null);
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Could not restore that version");
    } finally {
      setBusy(null);
    }
  };

  const remove = async (id: string) => {
    setBusy(id);
    try {
      await deleteCanvaDesign({ data: { id }, ...authHeaders });
      setDesigns((d) => d.filter((x) => x.id !== id));
      toast.success("Removed from PostSpark");
    } catch (e: any) {
      toast.error(e?.message || "Could not remove that design");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="ps-tool-hero ps-elev-2 ds-fade-up relative overflow-hidden">
        <span className="ps-ambient" aria-hidden />
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Canva designs</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Everything you created in Canva from PostSpark — reopen to edit, pull your latest
              changes back, export slides, or publish a final version.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {status?.connected ? (
              <Button size="sm" variant="outline" onClick={importBack} disabled={importing}>
                {importing ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                )}
                Import from Canva
              </Button>
            ) : null}
            <CanvaBadge />
          </div>
        </div>
      </section>

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : !status?.connected ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <h2 className="text-lg font-bold text-foreground">Connect Canva to get started</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Design thumbnails, covers and carousels with your own templates and brand assets.
          </p>
          <div className="mt-4 flex justify-center">
            <CanvaConnectButton label="Connect Canva →" />
          </div>
        </div>
      ) : (
        <>
          <CanvaTemplateCategories />

          {designs.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              {fetching
                ? "Loading your designs…"
                : "No Canva designs yet — create one from Thumbnail / Cover or Carousel Generator, or use “Import from Canva”."}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {designs.map((d) => {
                const published = d.status === "published";
                return (
                  <div
                    key={d.id}
                    className="overflow-hidden rounded-2xl border border-border bg-card"
                  >
                    <div className="relative aspect-video w-full bg-muted">
                      {d.thumbnail_url ? (
                        <img
                          src={d.thumbnail_url}
                          alt={d.design_title || "Canva design thumbnail"}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                      {published ? (
                        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[11px] font-semibold text-white shadow">
                          <CheckCircle2 className="h-3 w-3" /> Published
                        </span>
                      ) : null}
                    </div>
                    <div className="space-y-3 p-4">
                      <div>
                        <div className="truncate text-sm font-semibold text-foreground">
                          {d.design_title || "Untitled design"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {d.design_type}
                          {d.format_width ? ` · ${d.format_width}×${d.format_height}` : ""}
                          {d.slide_count > 1 ? ` · ${d.slide_count} slides` : ""}
                        </div>
                        {published && d.published_at ? (
                          <div className="mt-0.5 text-[11px] text-emerald-600 dark:text-emerald-400">
                            Published {new Date(d.published_at).toLocaleDateString()}
                          </div>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <a href={d.canva_edit_url} target="_blank" rel="noreferrer">
                            <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Edit
                          </a>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => syncOne(d)}
                          disabled={busy === `${d.id}:sync`}
                          title="Pull the latest edits from Canva"
                        >
                          {busy === `${d.id}:sync` ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => exportPreview(d, "png")}
                          disabled={busy === `${d.id}:png`}
                        >
                          {busy === `${d.id}:png` ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Download className="h-3.5 w-3.5" />
                          )}
                          <span className="ml-1.5">
                            {d.slide_count > 1 ? "Slides" : "PNG"}
                          </span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => exportPreview(d, "pdf")}
                          disabled={busy === `${d.id}:pdf`}
                        >
                          PDF
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openHistory(d)}
                          disabled={busy === `${d.id}:history`}
                          title="Version history"
                        >
                          <History className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => publish(d)}
                          disabled={busy === `${d.id}:publish`}
                        >
                          {busy === `${d.id}:publish` ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          {published ? "Re-publish" : "Publish"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => remove(d.id)}
                          disabled={busy === d.id}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Slide preview grid before download */}
      <Dialog open={Boolean(preview)} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {preview?.design?.design_title || "Exported design"}
            </DialogTitle>
            <DialogDescription>
              {preview?.urls?.length === 1
                ? "Preview your export, then download it."
                : `${preview?.urls?.length ?? 0} slides exported — preview them, then download individually or all at once.`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            {(preview?.urls ?? []).map((u, i) => (
              <div key={u} className="overflow-hidden rounded-xl border border-border bg-muted">
                <img
                  src={u}
                  alt={`Slide ${i + 1}`}
                  loading="lazy"
                  className="w-full object-contain"
                />
                <div className="flex items-center justify-between gap-2 p-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Slide {i + 1}
                  </span>
                  <Button size="sm" variant="outline" asChild>
                    <a href={u} target="_blank" rel="noreferrer" download>
                      <Download className="mr-1.5 h-3.5 w-3.5" /> Download
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {(preview?.urls?.length ?? 0) > 1 ? (
            <Button
              onClick={() =>
                preview?.urls.forEach((u) => window.open(u, "_blank", "noopener,noreferrer"))
              }
            >
              <Download className="mr-1.5 h-4 w-4" /> Download all slides
            </Button>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Version history */}
      <Dialog open={Boolean(history)} onOpenChange={(o) => !o && setHistory(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Version history</DialogTitle>
            <DialogDescription>
              {history?.design?.design_title || "This design"} — every import, export and publish
              is snapshotted so you can restore an earlier version.
            </DialogDescription>
          </DialogHeader>
          {(history?.versions?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">
              No versions yet. Export, import or publish this design to create the first snapshot.
            </p>
          ) : (
            <ul className="space-y-2">
              {history?.versions.map((v) => (
                <li
                  key={v.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                >
                  <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                    {v.thumbnail_url ? (
                      <img
                        src={v.thumbnail_url}
                        alt={`Version ${v.version_number} thumbnail`}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-foreground">
                      v{v.version_number} · {v.label || v.source}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(v.created_at).toLocaleString()}
                      {v.slide_count > 1 ? ` · ${v.slide_count} slides` : ""}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => restore(v.id)}
                    disabled={busy === `restore:${v.id}`}
                  >
                    {busy === `restore:${v.id}` ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Restore
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
