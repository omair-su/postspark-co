import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

export function NavV3() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(7,7,12,0.7)" : "transparent",
        backdropFilter: scrolled ? "blur(16px) saturate(140%)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(16px) saturate(140%)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
      }}
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="h-7 w-7 rounded-lg"
            style={{
              background: "linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)",
              boxShadow: "0 6px 20px rgba(124,58,237,0.45)",
            }}
          />
          <span className="font-display-lux text-xl" style={{ color: "#FAFAF9", letterSpacing: "-0.01em" }}>
            PostSpark
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm" style={{ color: "rgba(250,250,249,0.75)" }}>
          <Link to="/pricing" className="hover:text-white transition">Pricing</Link>
          <Link to="/gallery" className="hover:text-white transition">Gallery</Link>
          <Link to="/blog" className="hover:text-white transition">Blog</Link>
          <Link to="/for/creators" className="hover:text-white transition">For creators</Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/login" className="text-sm" style={{ color: "rgba(250,250,249,0.85)" }}>
            Sign in
          </Link>
          <Link to="/signup" className="lv3-cta rounded-full px-5 py-2.5 text-sm font-semibold">
            Start free
          </Link>
        </div>

        <button
          aria-label="Open menu"
          className="md:hidden p-2 rounded-lg"
          style={{ color: "#FAFAF9", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
          onClick={() => setOpen((s) => !s)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t" style={{ background: "rgba(7,7,12,0.95)", backdropFilter: "blur(20px)", borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="px-5 py-6 flex flex-col gap-1">
            {[
              { to: "/pricing", label: "Pricing" },
              { to: "/gallery", label: "Gallery" },
              { to: "/blog", label: "Blog" },
              { to: "/for/creators", label: "For creators" },
            ].map((i) => (
              <Link key={i.to} to={i.to} className="px-3 py-3 rounded-lg text-base" style={{ color: "rgba(250,250,249,0.85)" }} onClick={() => setOpen(false)}>
                {i.label}
              </Link>
            ))}
            <Link to="/signup" className="lv3-cta mt-3 rounded-full px-5 py-3 text-sm font-semibold text-center" onClick={() => setOpen(false)}>
              Start free
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
