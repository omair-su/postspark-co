import { ExternalLink } from "lucide-react";
import { CANVA_TEMPLATE_CATEGORIES, canvaTemplateSearchUrl } from "@/lib/canvaUrls";

/**
 * Curated Canva template searches. Each card opens Canva's template gallery
 * in a new tab, pre-filtered for that content category.
 */
export function CanvaTemplateCategories({
  heading = "Start from a template",
  description = "Jump into Canva's template gallery, pre-filtered for the format you need.",
}: {
  heading?: string;
  description?: string;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-foreground">{heading}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CANVA_TEMPLATE_CATEGORIES.map((c) => (
          <a
            key={c.key}
            href={canvaTemplateSearchUrl(c.query)}
            target="_blank"
            rel="noreferrer"
            className="group relative overflow-hidden rounded-xl border border-border bg-background p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
          >
            <span
              className="absolute inset-x-0 top-0 h-1"
              style={{ background: c.accent }}
              aria-hidden
            />
            <div className="flex items-start justify-between gap-2">
              <div className="text-sm font-semibold text-foreground">{c.label}</div>
              <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{c.description}</p>
          </a>
        ))}
      </div>
    </section>
  );
}
