import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, ExternalLink, FileText, Loader2, Pencil, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CanvaBadge,
  CanvaConnectButton,
  useCanvaStatus,
} from "@/components/canva/CanvaConnect";
import {
  createCanvaDesign,
  exportCanvaDesign,
  listCanvaDesigns,
} from "@/lib/canva.functions";
import type { CanvaFormat } from "@/lib/canvaUrls";

interface Props {
  designType: "thumbnail" | "carousel" | "cover" | "social_post";
  formats: CanvaFormat[];
  defaultTitle?: string;
  slideCount?: number;
  heading?: string;
  description?: string;
}

export function CanvaDesignLauncher({
  designType,
  formats,
  defaultTitle = "",
  slideCount,
  heading = "Design in Canva",
  description = "Pick a size, name your design, and PostSpark creates it in your Canva account — then export straight back here.",
}: Props) {
  const { status, loading, authHeaders } = useCanvaStatus();
  const [formatKey, setFormatKey] = useState(formats[0]?.key ?? "");
  const [title, setTitle] = useState(defaultTitle);
  const [creating, setCreating] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [designs, setDesigns] = useState<any[]>([]);
  const [active, setActive] = useState<{ id: string; editUrl: string } | null>(null);

  const format = formats.find((f) => f.key === formatKey) ?? formats[0];

  const loadDesigns = async () => {
    if (!status?.connected) return;
    try {
      const r: any = await listCanvaDesigns({ data: { designType }, ...authHeaders });
      setDesigns(r?.designs ?? []);
    } catch {
      /* non-fatal */
    }
  };

  useEffect(() => {
    loadDesigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status?.connected]);

  const create = async () => {
    if (!title.trim()) {
      toast.error("Add a title for your design first");
      return;
    }
    setCreating(true);
    try {
      const r: any = await createCanvaDesign({
        data: {
          title: title.trim(),
          presetKey: format?.key,
          width: format?.width,
          height: format?.height,
          designType,
          slideCount: slideCount ?? 1,
        },
        ...authHeaders,
      });
      if (r?.error) throw new Error(r.error);
      const editUrl = r?.design?.editUrl as string;
      setActive({ id: r.design.id, editUrl });
      window.open(editUrl, "_blank", "noopener,noreferrer");
      toast.success("Design created in Canva — finish it in the new tab, then export here.");
      loadDesigns();
    } catch (e: any) {
      toast.error(e?.message || "Could not create the Canva design");
    } finally {
      setCreating(false);
    }
  };

  const doExport = async (designId: string, fmt: "png" | "pdf") => {
    setExporting(`${designId}:${fmt}`);
    toast.info("Exporting from Canva… this takes a few seconds");
    try {
      const r: any = await exportCanvaDesign({ data: { designId, format: fmt }, ...authHeaders });
      if (r?.error) throw new Error(r.error);
      const urls: string[] = r?.urls ?? [];
      if (!urls.length) throw new Error("Canva did not return any files");
      urls.forEach((u) => window.open(u, "_blank", "noopener,noreferrer"));
      toast.success(`Exported ${urls.length} file${urls.length > 1 ? "s" : ""} from Canva`);
      loadDesigns();
    } catch (e: any) {
      toast.error(e?.message || "Canva export failed");
    } finally {
      setExporting(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Checking your Canva connection…
      </div>
    );
  }

  if (!status?.connected) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-3">
          <CanvaBadge />
        </div>
        <h3 className="mt-3 text-lg font-bold text-foreground">Unlock full design power</h3>
        <p className="mt-1 max-w-lg text-sm text-muted-foreground">
          Connect Canva to design {designType === "carousel" ? "carousels" : "thumbnails and covers"} with your own
          templates, fonts and brand assets — right from PostSpark.
        </p>
        <div className="mt-4">
          <CanvaConnectButton label="Connect Canva →" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-foreground">{heading}</h3>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">{description}</p>
          </div>
          <CanvaBadge />
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Format</Label>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {formats.map((f) => {
                const selected = f.key === formatKey;
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFormatKey(f.key)}
                    className={`rounded-xl border p-3 text-left transition ${
                      selected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background hover:border-primary/40"
                    }`}
                  >
                    <div className="text-sm font-semibold text-foreground">{f.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {f.width}×{f.height}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label htmlFor="canva-title" className="text-sm font-semibold text-foreground">
              Design name
            </Label>
            <Input
              id="canva-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 10 AI Tools That Save 10 Hours a Week"
              className="mt-1.5"
              maxLength={200}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={create}
              disabled={creating}
              style={{ background: "linear-gradient(135deg,#00C4CC,#7D2AE8)", color: "#fff" }}
            >
              {creating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Create &amp; open in Canva
            </Button>
            {active ? (
              <>
                <Button variant="outline" asChild>
                  <a href={active.editUrl} target="_blank" rel="noreferrer">
                    <Pencil className="mr-2 h-4 w-4" /> Continue editing
                  </a>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => doExport(active.id, "png")}
                  disabled={exporting === `${active.id}:png`}
                >
                  {exporting === `${active.id}:png` ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Export PNG
                </Button>
                <Button
                  variant="outline"
                  onClick={() => doExport(active.id, "pdf")}
                  disabled={exporting === `${active.id}:pdf`}
                >
                  <FileText className="mr-2 h-4 w-4" /> Export PDF
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {designs.length > 0 ? (
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">Recent Canva designs</h4>
            <span className="text-xs text-muted-foreground">{designs.length} saved</span>
          </div>
          <div className="mt-3 space-y-2">
            {designs.slice(0, 6).map((d) => (
              <div
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-background px-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-foreground">
                    {d.design_title || "Untitled design"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {d.format_width}×{d.format_height} · {d.status}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <a href={d.canva_edit_url} target="_blank" rel="noreferrer">
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Edit
                    </a>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => doExport(d.canva_design_id, "png")}
                    disabled={exporting === `${d.canva_design_id}:png`}
                  >
                    {exporting === `${d.canva_design_id}:png` ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
