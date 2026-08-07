import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, ExternalLink, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CanvaBadge,
  CanvaConnectButton,
  useCanvaStatus,
} from "@/components/canva/CanvaConnect";
import { deleteCanvaDesign, exportCanvaDesign, listCanvaDesigns } from "@/lib/canva.functions";

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

  const doExport = async (designId: string, format: "png" | "pdf") => {
    setBusy(`${designId}:${format}`);
    try {
      const r: any = await exportCanvaDesign({ data: { designId, format }, ...authHeaders });
      if (r?.error) throw new Error(r.error);
      (r.urls as string[]).forEach((u) => window.open(u, "_blank", "noopener,noreferrer"));
      toast.success("Exported from Canva");
    } catch (e: any) {
      toast.error(e?.message || "Canva export failed");
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
              Everything you created in Canva from PostSpark — reopen to edit, or export as PNG / PDF.
            </p>
          </div>
          <CanvaBadge />
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
      ) : designs.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          {fetching ? "Loading your designs…" : "No Canva designs yet — create one from Thumbnail / Cover or Carousel Generator."}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {designs.map((d) => (
            <div key={d.id} className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="aspect-video w-full bg-muted">
                {d.thumbnail_url ? (
                  <img
                    src={d.thumbnail_url}
                    alt={d.design_title || "Canva design thumbnail"}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className="space-y-3 p-4">
                <div>
                  <div className="truncate text-sm font-semibold text-foreground">
                    {d.design_title || "Untitled design"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {d.design_type} · {d.format_width}×{d.format_height}
                  </div>
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
                    onClick={() => doExport(d.canva_design_id, "png")}
                    disabled={busy === `${d.canva_design_id}:png`}
                  >
                    {busy === `${d.canva_design_id}:png` ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    <span className="ml-1.5">PNG</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => doExport(d.canva_design_id, "pdf")}
                    disabled={busy === `${d.canva_design_id}:pdf`}
                  >
                    PDF
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
          ))}
        </div>
      )}
    </div>
  );
}
