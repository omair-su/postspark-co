import { Star, Quote } from "lucide-react";
import { useEffect, useState } from "react";
import { getPublishedTestimonials } from "@/lib/socialProof.functions";

type Testimonial = {
  id?: string;
  name: string;
  handle?: string | null;
  role?: string | null;
  avatar_initials?: string | null;
  avatar_url?: string | null;
  quote: string;
  rating?: number | null;
};

const fallback: Testimonial[] = [
  { name: "Sarah Chen", handle: "@sarahbuilds", role: "Newsletter creator · 18k subs", avatar_initials: "SC", quote: "I paste my Sunday essay into PostSpark and walk away with a full week of tweets, a LinkedIn post, and a podcast outline. It cut my Monday from 4 hours to 20 minutes." },
  { name: "Marcus Johnson", handle: "@marcusgrowth", role: "Head of Content · B2B SaaS", avatar_initials: "MJ", quote: "Our team's social output tripled in the first month. Brand Voice nails our tone — readers don't realize anything changed except how often we post." },
  { name: "Emily Rodriguez", handle: "@emilysolopreneur", role: "Solo founder · indie SaaS", avatar_initials: "ER", quote: "I'm a one-person team. PostSpark is the closest thing I have to a content department. The Hook Lab alone earned my Pro upgrade." },
];

export function TestimonialsSection() {
  const [items, setItems] = useState<Testimonial[]>(fallback);

  useEffect(() => {
    getPublishedTestimonials()
      .then((r) => {
        if (r.testimonials && r.testimonials.length > 0) setItems(r.testimonials as Testimonial[]);
      })
      .catch(() => {});
  }, []);

  return (
    <section className="relative isolate overflow-hidden cream-surface-alt py-24">
      <div className="cream-grain" aria-hidden />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-1 rounded-full border border-[#1a1a2e]/15 bg-white/50 px-3 py-1 text-xs backdrop-blur-md">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
            ))}
            <span className="ml-1.5 font-semibold luxury-heading">4.9</span>
            <span className="text-[#1a1a2e]/60">· 127 reviews</span>
          </div>
          <h2 className="mt-5 luxury-heading" style={{ fontSize: "clamp(1.9rem, 4.4vw, 3rem)", lineHeight: 1.05 }}>
            Loved by <span className="luxury-gradient-text">Creators</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-[#1a1a2e]/65">
            Real results from people shipping content every week with PostSpark.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {items.slice(0, 6).map((t, i) => (
            <div
              key={t.id ?? t.name}
              className="luxury-card group relative p-6 animate-[heroRise_0.7s_ease-out_both]"
              style={{ animationDelay: `${i * 110}ms` }}
            >
              <Quote className="h-6 w-6 text-[#7c3aed]/50" />
              <p className="mt-3 text-sm leading-relaxed text-[#1a1a2e]/85">"{t.quote}"</p>
              <div className="mt-5 flex items-center gap-3 border-t border-[#1a1a2e]/10 pt-4">
                {t.avatar_url ? (
                  <img src={t.avatar_url} alt={t.name} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #4c1d95 60%, #7c3aed 100%)" }}
                  >
                    {t.avatar_initials || t.name.split(" ").map((s) => s[0]).join("").slice(0, 2)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold luxury-heading">{t.name}</p>
                  <p className="truncate text-xs text-[#1a1a2e]/60">
                    {t.handle && <span className="font-medium text-[#7c3aed]">{t.handle}</span>}
                    {t.handle && t.role && " · "}
                    {t.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes heroRise { from { opacity:0; transform: translate3d(0,16px,0);} to { opacity:1; transform: translate3d(0,0,0);} }`}</style>
    </section>
  );
}
