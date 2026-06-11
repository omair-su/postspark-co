import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { getRelatedTools } from "@/lib/tools-catalog";

export function RelatedTools({
  currentPath,
  heading = "Explore more PostSpark tools",
  count = 4,
}: {
  currentPath: string;
  heading?: string;
  count?: number;
}) {
  const items = getRelatedTools(currentPath, count);
  if (items.length === 0) return null;

  return (
    <section style={{ background: "#FFFFFF", borderTop: "1px solid #E2E8F0" }} className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "#7C3AED", letterSpacing: "0.1em" }}
            >
              Related
            </p>
            <h2
              className="mt-2 text-2xl sm:text-3xl"
              style={{
                color: "#0F172A",
                fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                fontWeight: 700,
                lineHeight: 1.15,
              }}
            >
              {heading}
            </h2>
          </div>
          <Link
            to="/"
            hash="explore-tools"
            className="hidden text-sm font-semibold sm:inline-flex sm:items-center sm:gap-1"
            style={{ color: "#7C3AED" }}
          >
            See all tools <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((t) => (
            <Link
              key={t.path}
              to={t.path}
              className="group block rounded-2xl p-5 transition"
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#C4B5FD";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(124,58,237,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#E2E8F0";
                e.currentTarget.style.boxShadow = "0 1px 2px rgba(15,23,42,0.04)";
              }}
            >
              <div className="text-2xl">{t.emoji}</div>
              <h3
                className="mt-3 text-base font-bold"
                style={{ color: "#0F172A", fontFamily: "Inter, system-ui, sans-serif" }}
              >
                {t.name}
              </h3>
              <p className="mt-1.5 text-sm" style={{ color: "#64748B", lineHeight: 1.55 }}>
                {t.short}
              </p>
              <span
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold"
                style={{ color: "#7C3AED" }}
              >
                Try it free <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
