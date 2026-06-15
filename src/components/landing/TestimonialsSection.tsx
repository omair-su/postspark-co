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

// No fallback testimonials — we render nothing rather than show fake names.
// Real testimonials come from the testimonials admin page (DB-backed).
const fallback: Testimonial[] = [];

export function TestimonialsSection() {
  const [items, setItems] = useState<Testimonial[]>(fallback);

  useEffect(() => {
    getPublishedTestimonials()
      .then((r) => {
        if (r.testimonials && r.testimonials.length > 0) setItems(r.testimonials as Testimonial[]);
      })
      .catch(() => {});
  }, []);

  // Hide the whole section if we have no real testimonials yet — better than fake proof.
  if (items.length === 0) return null;

  return (
    <section className="relative isolate overflow-hidden cream-surface-alt py-24">
      <div className="cream-grain" aria-hidden />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-1 rounded-full border border-[#1a1a2e]/15 bg-white/50 px-3 py-1 text-xs backdrop-blur-md">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
            ))}
            <span className="ml-1.5 font-semibold luxury-heading">Loved</span>
            <span className="text-[#1a1a2e]/60">· {items.length} review{items.length === 1 ? "" : "s"}</span>
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
