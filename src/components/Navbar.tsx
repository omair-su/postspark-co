import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, ArrowRight, ChevronDown } from "lucide-react";
import { PostSparkLogo } from "@/components/PostSparkLogo";
import { getCatalogByCategory } from "@/lib/tools-catalog";

const NAV = [
  { label: "Features", href: "/#features" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "Blog", href: "/blog" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const toolItems = getCatalogByCategory("Tools").slice(0, 8);
  const compareItems = getCatalogByCategory("Compare").slice(0, 4);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setToolsOpen(false);
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

          {/* Tools dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setToolsOpen(true)}
            onMouseLeave={() => setToolsOpen(false)}
          >
            <button
              className="inline-flex items-center gap-1 text-sm font-semibold transition"
              style={{ color: toolsOpen ? "#0F172A" : "#64748B" }}
              onClick={() => setToolsOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={toolsOpen}
            >
              Tools <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {toolsOpen && (
              <div
                role="menu"
                className="absolute left-1/2 top-full z-50 mt-2 w-[640px] -translate-x-1/2 rounded-2xl p-5"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 20px 50px rgba(15,23,42,0.15)",
                }}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p
                      className="px-2 text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: "#7C3AED", letterSpacing: "0.12em" }}
                    >
                      AI Tools
                    </p>
                    <ul className="mt-2 space-y-0.5">
                      {toolItems.map((t) => (
                        <li key={t.path}>
                          <Link
                            to={t.path}
                            className="flex items-start gap-2 rounded-lg px-2 py-2 transition"
                            style={{ color: "#0F172A" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#F5F3FF")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            <span className="text-base leading-none">{t.emoji}</span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold">{t.name}</p>
                              <p className="truncate text-xs" style={{ color: "#64748B" }}>
                                {t.short}
                              </p>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p
                      className="px-2 text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: "#7C3AED", letterSpacing: "0.12em" }}
                    >
                      Compare
                    </p>
                    <ul className="mt-2 space-y-0.5">
                      {compareItems.map((t) => (
                        <li key={t.path}>
                          <Link
                            to={t.path}
                            className="flex items-start gap-2 rounded-lg px-2 py-2 transition"
                            style={{ color: "#0F172A" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#F5F3FF")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            <span className="text-base leading-none">{t.emoji}</span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold">{t.name}</p>
                              <p className="truncate text-xs" style={{ color: "#64748B" }}>
                                {t.short}
                              </p>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <Link
                      to="/"
                      hash="explore-tools"
                      className="mt-3 inline-flex items-center gap-1 px-2 text-xs font-bold"
                      style={{ color: "#7C3AED" }}
                    >
                      See all 20+ tools <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
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
            <div className="mt-1">
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#7C3AED" }}>
                Tools
              </p>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {toolItems.slice(0, 6).map((t) => (
                  <Link
                    key={t.path}
                    to={t.path}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-2 py-1.5 text-xs font-semibold"
                    style={{ background: "#F5F3FF", color: "#0F172A" }}
                  >
                    {t.emoji} {t.name}
                  </Link>
                ))}
              </div>
              <Link
                to="/"
                hash="explore-tools"
                onClick={() => setOpen(false)}
                className="mt-2 inline-block text-xs font-bold"
                style={{ color: "#7C3AED" }}
              >
                See all tools →
              </Link>
            </div>
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
