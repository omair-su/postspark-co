import { FileText, ArrowRight, MessageCircle, Briefcase, Mail, Video } from "lucide-react";

const outputs = [
  { icon: MessageCircle, label: "10 Tweets", tint: "#7c3aed" },
  { icon: Briefcase, label: "5 LinkedIn Posts", tint: "#4c1d95" },
  { icon: Mail, label: "1 Email Newsletter", tint: "#e85d3a" },
  { icon: Video, label: "1 Video Script", tint: "#1a1a2e" },
];

export function BeforeAfterSection() {
  return (
    <section className="relative isolate overflow-hidden cream-surface py-24">
      <div className="cream-grain" aria-hidden />
      {/* Floating ambient orbs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full opacity-40 blur-3xl lux-float"
        style={{ background: "radial-gradient(closest-side, rgba(124,58,237,0.35), transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 right-0 h-80 w-80 rounded-full opacity-40 blur-3xl lux-float"
        style={{
          animationDelay: "1.2s",
          background: "radial-gradient(closest-side, rgba(232,93,58,0.30), transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center">
          <span className="luxury-chip">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7c3aed]" />
            How it transforms
          </span>
          <h2
            className="mt-5 luxury-heading"
            style={{ fontSize: "clamp(1.9rem, 4.4vw, 3rem)", lineHeight: 1.05 }}
          >
            One Input. <span className="luxury-gradient-text">Infinite Content.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[#1a1a2e]/65">
            See how one blog post transforms into a full content library.
          </p>
        </div>

        <div className="mt-14 flex flex-col items-center gap-6 md:flex-row md:justify-center">
          <div className="luxury-card w-full max-w-[240px] p-6 text-center lux-float">
            <FileText className="mx-auto h-10 w-10 text-[#4c1d95]" />
            <p className="mt-3 text-sm font-semibold luxury-heading">Your Blog Post</p>
            <p className="mt-1 text-xs text-[#1a1a2e]/60">1 piece of content</p>
          </div>

          <ArrowRight className="hidden h-6 w-6 text-[#1a1a2e]/40 md:block" />
          <div className="block text-[#1a1a2e]/40 md:hidden">↓</div>

          <div className="grid w-full max-w-md grid-cols-2 gap-3">
            {outputs.map((item, i) => (
              <div
                key={item.label}
                className="luxury-card p-4 text-center animate-[heroRise_0.7s_ease-out_both]"
                style={{ animationDelay: `${i * 110}ms` }}
              >
                <item.icon className="mx-auto h-6 w-6" style={{ color: item.tint }} />
                <p className="mt-2 text-xs font-semibold luxury-heading">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes heroRise {
          from { opacity: 0; transform: translate3d(0, 16px, 0); }
          to   { opacity: 1; transform: translate3d(0, 0, 0); }
        }
      `}</style>
    </section>
  );
}
