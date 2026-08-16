import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Download, Repeat, Calendar as CalendarIcon } from "lucide-react";
import { getPublicTemplateBySlug, cloneTemplate } from "@/lib/marketplace.functions";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/templates/$slug")({
  component: TemplateDetailPage,
  head: ({ params }) => ({
    meta: [
      { title: "Content template — PostSpark" },
      { name: "description", content: "Clone this ready-to-use content repurposing template in PostSpark and start publishing in seconds." },
      { property: "og:title", content: "Content template — PostSpark" },
      { property: "og:description", content: "Clone this ready-to-use content repurposing template in PostSpark." },
      { property: "og:url", content: `https://postspark.co/templates/${params.slug}` },
      { property: "og:image", content: "https://postspark.co/og-image.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:image", content: "https://postspark.co/og-image.png" },
      { property: "og:type", content: "article" },
    ],
    links: [{ rel: "canonical", href: `https://postspark.co/templates/${params.slug}` }],
  }),
});

function TemplateDetailPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [tpl, setTpl] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    getPublicTemplateBySlug({ data: { slug } } as any)
      .then((r: any) => setTpl(r.template))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleImport = async () => {
    if (!session) {
      navigate({ to: "/signup", search: { redirect: `/templates/${slug}` } as any });
      return;
    }
    if (!tpl) return;
    setImporting(true);
    const r: any = await cloneTemplate({
      data: { sourceId: tpl.id },
      headers: { Authorization: `Bearer ${session.access_token}` },
    } as any);
    setImporting(false);
    if (r.success) {
      toast.success("Template imported into your workspace");
      navigate({ to: "/dashboard/templates" });
    } else {
      toast.error(r.error || "Failed to import");
    }
  };

  const handleUseInRepurpose = () => {
    if (!session) {
      navigate({ to: "/signup", search: { redirect: `/templates/${slug}` } as any });
      return;
    }
    if (!tpl) return;
    const params = new URLSearchParams({
      tone: tpl.tone,
      types: (tpl.selected_types || []).join(","),
    });
    if (tpl.custom_instructions) params.set("instructions", tpl.custom_instructions);
    navigate({ to: "/dashboard/repurpose", search: { tpl: params.toString() } as any });
  };

  const handleUseInCalendar = () => {
    if (!session) {
      navigate({ to: "/signup", search: { redirect: `/templates/${slug}` } as any });
      return;
    }
    navigate({ to: "/dashboard/calendar" });
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!tpl) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-muted-foreground">Template not found.</p>
        <Link to="/templates/gallery" className="mt-4 inline-block text-primary underline">
          Back to gallery
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Link to="/templates/gallery" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to gallery
        </Link>

        <div className="mt-6 rounded-2xl border border-border bg-card p-8">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
              {tpl.category || "general"}
            </span>
            <span className="text-xs text-muted-foreground">{tpl.use_count} imports</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold text-foreground">{tpl.name}</h1>
          {tpl.description && <p className="mt-2 text-sm text-muted-foreground">{tpl.description}</p>}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tone</p>
              <p className="mt-1 text-sm font-medium capitalize text-foreground">{tpl.tone}</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Formats</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {(tpl.selected_types || []).map((s: string) => (
                  <span key={s} className="rounded-full bg-accent px-2 py-0.5 text-[10px] capitalize text-foreground">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {tpl.custom_instructions && (
            <div className="mt-4 rounded-lg border border-border bg-muted/40 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Instructions</p>
              <p className="mt-1 text-sm italic text-foreground">"{tpl.custom_instructions}"</p>
            </div>
          )}

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <button
              onClick={handleImport}
              disabled={importing}
              className="flex items-center justify-center gap-2 rounded-xl gradient-electric px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
            >
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Import to my workspace
            </button>
            <button
              onClick={handleUseInRepurpose}
              className="flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-foreground hover:bg-accent"
            >
              <Repeat className="h-4 w-4" /> Use in Repurpose
            </button>
            <button
              onClick={handleUseInCalendar}
              className="flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-foreground hover:bg-accent"
            >
              <CalendarIcon className="h-4 w-4" /> Plan in Calendar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
