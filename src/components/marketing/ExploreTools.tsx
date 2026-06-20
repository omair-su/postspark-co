import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Zap, ShieldCheck } from "lucide-react";
import { getCatalogByCategory } from "@/lib/tools-catalog";

export function ExploreTools() {
  const tools = getCatalogByCategory("Tools");
  const features = getCatalogByCategory("Features");
  const compare = getCatalogByCategory("Compare");

  return (
    <section
      id="explore-tools"
      className="scroll-mt-24 py-24 sm:py-32 relative overflow-hidden"
      style={{ background: "#F8FAFC" }}
    >
      {/* Decorative gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center text-center mb-20">
          <span
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em]"
            style={{
              background: "#FFFFFF",
              color: "#7C3AED",
              border: "1px solid rgba(124, 58, 237, 0.1)",
              boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
            }}
          >
            <Sparkles size={12} /> The Ecosystem
          </span>
          <h2
            className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl"
            style={{ fontFamily: "Inter, system-ui, sans-serif", lineHeight: 1.1 }}
          >
            Every tool you need to <br className="hidden sm:block" />
            <span className="text-violet-600">repurpose, schedule and grow.</span>
          </h2>
          <p className="mt-6 max-w-2xl text-lg text-slate-600">
            Replace Buffer, Jasper, Midjourney and ChatGPT with a single AI workspace built for
            creators and agencies.
          </p>
        </div>

        <div className="space-y-24">
          <Group 
            title="AI Content Engines" 
            subtitle="Specialized tools for every platform"
            icon={<Zap size={18} className="text-violet-600" />}
            items={tools} 
          />
          <Group 
            title="Flagship Capabilities" 
            subtitle="The core of your content strategy"
            icon={<Sparkles size={18} className="text-violet-600" />}
            items={features} 
          />
          <Group 
            title="Market Comparisons" 
            subtitle="See why leaders choose PostSpark"
            icon={<ShieldCheck size={18} className="text-violet-600" />}
            items={compare} 
          />
        </div>
      </div>
    </section>
  );
}

function Group({
  title,
  subtitle,
  icon,
  items,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  items: ReturnType<typeof getCatalogByCategory>;
}) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm border border-slate-100">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 leading-none">{title}</h3>
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        </div>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((t) => (
          <Link
            key={t.path}
            to={t.path}
            className="group relative flex flex-col justify-between rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
            style={{ 
              background: "#FFFFFF", 
              border: "1px solid #E2E8F0",
              boxShadow: "0 4px 15px -5px rgba(0,0,0,0.05)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#C4B5FD";
              e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(124, 58, 237, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#E2E8F0";
              e.currentTarget.style.boxShadow = "0 4px 15px -5px rgba(0,0,0,0.05)";
            }}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl filter grayscale group-hover:grayscale-0 transition-all duration-300">{t.emoji}</span>
                <ArrowRight
                  className="h-4 w-4 -translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                  style={{ color: "#7C3AED" }}
                />
              </div>
              <p
                className="text-base font-bold text-slate-900"
                style={{ fontFamily: "Inter, system-ui, sans-serif" }}
              >
                {t.name}
              </p>
              <p
                className="mt-2 line-clamp-2 text-sm text-slate-500"
                style={{ lineHeight: 1.5 }}
              >
                {t.short}
              </p>
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs font-bold text-violet-600 uppercase tracking-wider">Explore Tool →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
