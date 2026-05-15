import { MessageCircle, Briefcase, Mail, Video } from "lucide-react";

const features = [
  { icon: MessageCircle, title: "10 Tweets", desc: "Short, punchy tweets optimized for engagement and virality." },
  { icon: Briefcase, title: "5 LinkedIn Posts", desc: "Professional, thought-leadership posts that build authority." },
  { icon: Mail, title: "1 Email Newsletter", desc: "Complete newsletter with subject line and engaging body." },
  { icon: Video, title: "1 Video Script", desc: "Hook, main points, and CTA for compelling video content." },
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative isolate overflow-hidden cream-surface-alt py-24">
      <div className="cream-grain" aria-hidden />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(45deg, #1a1a2e 1px, transparent 1px), linear-gradient(-45deg, #1a1a2e 1px, transparent 1px)",
          backgroundSize: "200px 200px",
        }}
      />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center">
          <span className="luxury-chip">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7c3aed]" />
            What you get
          </span>
          <h2
            className="mt-5 luxury-heading"
            style={{ fontSize: "clamp(1.9rem, 4.4vw, 3rem)", lineHeight: 1.05 }}
          >
            Everything You Need, <span className="luxury-gradient-text">Instantly</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[#1a1a2e]/65">
            One input generates all the content formats you need for a full week of posting.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="luxury-card group p-6 animate-[heroRise_0.7s_ease-out_both]"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                style={{
                  background: "linear-gradient(135deg, #1a1a2e 0%, #4c1d95 60%, #7c3aed 100%)",
                  boxShadow: "0 14px 30px -12px rgba(124,58,237,0.55)",
                }}
              >
                <f.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="mt-4 text-lg font-semibold luxury-heading">{f.title}</h3>
              <p className="mt-2 text-sm text-[#1a1a2e]/65">{f.desc}</p>
            </div>
          ))}
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
