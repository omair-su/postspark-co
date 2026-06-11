import { Link } from "@tanstack/react-router";
import { ChevronRight, Home } from "lucide-react";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ label: "Home", href: "/" }, ...items];
  return (
    <nav
      aria-label="Breadcrumb"
      className="mx-auto max-w-7xl px-4 pt-24 sm:px-6"
      style={{ fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}
    >
      <ol className="flex flex-wrap items-center gap-1.5 text-xs" style={{ color: "#64748B" }}>
        {all.map((c, i) => {
          const last = i === all.length - 1;
          return (
            <li key={i} className="inline-flex items-center gap-1.5">
              {i === 0 && <Home className="h-3 w-3" />}
              {c.href && !last ? (
                <Link to={c.href} className="hover:underline" style={{ color: "#64748B" }}>
                  {c.label}
                </Link>
              ) : (
                <span style={{ color: last ? "#0F172A" : "#64748B", fontWeight: last ? 600 : 400 }}>
                  {c.label}
                </span>
              )}
              {!last && <ChevronRight className="h-3 w-3" style={{ color: "#CBD5E1" }} />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function breadcrumbJsonLd(items: Crumb[], origin = "https://postspark.co") {
  const list = [{ label: "Home", href: "/" }, ...items];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: list.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      item: c.href ? `${origin}${c.href}` : undefined,
    })),
  };
}
