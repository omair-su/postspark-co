import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { getCatalogByCategory } from "@/lib/tools-catalog";

// Homepage "Explore tools" grid — surfaces every public tool/feature for
// internal link equity and AI-search discoverability.
export function ExploreTools() {
  const tools = getCatalogByCategory("Tools");
  const features = getCatalogByCategory("Features");
  const compare = getCatalogByCategory("Compare");

  return (
    <section
      id="explore-tools"
      style={{ background: "#FFFFFF", borderTop: "1px solid #E2E8F0" }}
      className="scroll-mt-24 py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <p
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "#7C3AED", letterSpacing: "0.1em" }}
        >
          Free tools · Built into PostSpark
        </p>
        <h2
          className="mt-3 max-w-3xl text-3xl sm:text-4xl"
          style={{
            color: "#0F172A",
            fontFamily: "Inter, system-ui, -apple-system, sans-serif",
            fontWeight: 700,
            lineHeight: 1.1,
          }}
        >
          Every tool you need to repurpose, schedule and grow — in one app.
        </h2>
        <p className="mt-3 max-w-2xl text-base" style={{ color: "#64748B", lineHeight: 1.7 }}>
          Replace Buffer, Jasper, Midjourney and ChatGPT with a single AI workspace built for
          creators and agencies.
        </p>

        <Group title="AI Tools" items={tools} />
        <Group title="Flagship features" items={features} />
        <Group title="PostSpark vs alternatives" items={compare} />
      </div>
    </section>
  );
}

function Group({
  title,
  items,
}: {
  title: string;
  items: ReturnType<typeof getCatalogByCategory>;
}) {
  return (
    <div className="mt-12">
      <h3
        className="text-sm font-bold uppercase tracking-widest"
        style={{ color: "#475569", letterSpacing: "0.1em" }}
      >
        {title}
      </h3>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((t) => (
          <Link
            key={t.path}
            to={t.path}
            className="group flex items-start gap-3 rounded-xl p-4 transition"
            style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#C4B5FD";
              e.currentTarget.style.background = "#FAFAFF";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#E2E8F0";
              e.currentTarget.style.background = "#FFFFFF";
            }}
          >
            <span className="text-xl leading-none">{t.emoji}</span>
            <div className="min-w-0 flex-1">
              <p
                className="text-sm font-bold"
                style={{ color: "#0F172A", fontFamily: "Inter, system-ui, sans-serif" }}
              >
                {t.name}
              </p>
              <p
                className="mt-0.5 line-clamp-1 text-xs"
                style={{ color: "#64748B", lineHeight: 1.5 }}
              >
                {t.short}
              </p>
            </div>
            <ArrowRight
              className="mt-1 h-4 w-4 shrink-0 opacity-0 transition group-hover:opacity-100"
              style={{ color: "#7C3AED" }}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
