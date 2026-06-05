import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { PostSparkLogo } from "@/components/PostSparkLogo";

const NAV = [
  { label: "Features", href: "/#features" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "Blog", href: "/blog" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition"
      style={{
        background: "#FFFFFF",
        borderBottom: "1px solid #E2E8F0",
        boxShadow: scrolled ? "0 4px 14px rgba(15,23,42,0.06)" : "none",
      }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center">
          <PostSparkLogo variant="wordmark" size={28} />
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {NAV.map((n) =>
            n.href.startsWith("/#") ? (
              <a
                key={n.href}
                href={n.href}
                className="text-sm font-semibold transition"
                style={{ color: "#64748B" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#0F172A")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#64748B")}
              >
                {n.label}
              </a>
            ) : (
              <Link
                key={n.href}
                to={n.href}
                className="text-sm font-semibold transition"
                style={{ color: "#64748B" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#0F172A")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#64748B")}
              >
                {n.label}
              </Link>
            ),
          )}
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <Link to="/login" className="text-sm font-semibold" style={{ color: "#64748B" }}>
            Log In
          </Link>
          <Link
            to="/signup"
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold text-white transition"
            style={{ background: "#7C3AED", boxShadow: "0 4px 14px rgba(124,58,237,0.3)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#6D28D9")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#7C3AED")}
          >
            Start Free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <button
          className="md:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}
          aria-controls="primary-mobile-nav"
          style={{ color: "#0F172A" }}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div id="primary-mobile-nav" className="md:hidden" style={{ background: "#FFFFFF", borderTop: "1px solid #E2E8F0" }}>
          <div className="flex flex-col gap-3 px-4 py-4">
            {NAV.map((n) =>
              n.href.startsWith("/#") ? (
                <a key={n.href} href={n.href} onClick={() => setOpen(false)} className="text-sm font-semibold" style={{ color: "#0F172A" }}>
                  {n.label}
                </a>
              ) : (
                <Link key={n.href} to={n.href} onClick={() => setOpen(false)} className="text-sm font-semibold" style={{ color: "#0F172A" }}>
                  {n.label}
                </Link>
              ),
            )}
            <hr style={{ borderColor: "#E2E8F0" }} />
            <Link to="/login" onClick={() => setOpen(false)} className="text-sm font-semibold" style={{ color: "#64748B" }}>
              Log In
            </Link>
            <Link
              to="/signup"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-bold text-white"
              style={{ background: "#7C3AED" }}
            >
              Start Free <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
