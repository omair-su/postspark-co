import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, ArrowRight, ChevronDown, Sparkles } from "lucide-react";
import { PostSparkLogo } from "@/components/PostSparkLogo";
import { getCatalogByCategory } from "@/lib/tools-catalog";

const NAV = [
  { label: "Features", href: "/#features" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Pricing", href: "/#pricing" },
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
    const onScroll = () => setScrolled(window.scrollY > 20);
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "py-3" : "py-5"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div 
          className={`flex h-16 items-center justify-between px-6 rounded-2xl transition-all duration-300 ${
            scrolled 
              ? "bg-white/80 backdrop-blur-xl border border-slate-200 shadow-lg shadow-slate-200/50" 
              : "bg-transparent border border-transparent"
          }`}
        >
          <Link to="/" className="flex items-center group">
            <PostSparkLogo variant="wordmark" size={28} className="transition-transform group-hover:scale-105" />
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {NAV.map((n) =>
              n.href.startsWith("/#") ? (
                <a
                  key={n.href}
                  href={n.href}
                  className="text-sm font-bold text-slate-600 transition-colors hover:text-violet-600"
                >
                  {n.label}
                </a>
              ) : (
                <Link
                  key={n.href}
                  to={n.href}
                  className="text-sm font-bold text-slate-600 transition-colors hover:text-violet-600"
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
                className={`inline-flex items-center gap-1 text-sm font-bold transition-colors ${
                  toolsOpen ? "text-violet-600" : "text-slate-600"
                } hover:text-violet-600`}
                onClick={() => setToolsOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={toolsOpen}
              >
                Tools <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${toolsOpen ? "rotate-180" : ""}`} />
              </button>
              
              {/* Dropdown Menu */}
              <div
                className={`absolute left-1/2 top-full z-50 mt-4 w-[640px] -translate-x-1/2 rounded-3xl p-6 transition-all duration-300 origin-top ${
                  toolsOpen 
                    ? "opacity-100 translate-y-0 scale-100 pointer-events-auto" 
                    : "opacity-0 -translate-y-4 scale-95 pointer-events-none"
                }`}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 25px 50px -12px rgba(15,23,42,0.15)",
                }}
              >
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <div className="flex items-center gap-2 px-2 mb-4">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-50 text-violet-600">
                        <Sparkles size={12} />
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">AI Engines</p>
                    </div>
                    <ul className="space-y-1">
                      {toolItems.map((t) => (
                        <li key={t.path}>
                          <Link
                            to={t.path}
                            className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition-all hover:bg-violet-50 group/item"
                          >
                            <span className="text-xl leading-none filter grayscale group-hover/item:grayscale-0 transition-all">{t.emoji}</span>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900 group-hover/item:text-violet-700">{t.name}</p>
                              <p className="truncate text-xs text-slate-500 mt-0.5">{t.short}</p>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 px-2 mb-4">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-50 text-violet-600">
                        <ArrowRight size={12} />
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Comparisons</p>
                    </div>
                    <ul className="space-y-1">
                      {compareItems.map((t) => (
                        <li key={t.path}>
                          <Link
                            to={t.path}
                            className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition-all hover:bg-violet-50 group/item"
                          >
                            <span className="text-xl leading-none filter grayscale group-hover/item:grayscale-0 transition-all">{t.emoji}</span>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900 group-hover/item:text-violet-700">{t.name}</p>
                              <p className="truncate text-xs text-slate-500 mt-0.5">{t.short}</p>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <Link
                      to="/"
                      hash="explore-tools"
                      className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-slate-50 py-3 text-xs font-bold text-violet-600 transition-colors hover:bg-violet-50"
                    >
                      See all 20+ specialized tools <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden items-center gap-6 md:flex">
            <Link to="/login" className="text-sm font-bold text-slate-600 transition-colors hover:text-slate-900">
              Log In
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition-all hover:bg-violet-700 hover:scale-105 active:scale-95"
            >
              Start Free <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <button
            className="md:hidden p-2 rounded-xl bg-slate-50 text-slate-900"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={open}
            aria-controls="primary-mobile-nav"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {open && (
        <div 
          id="primary-mobile-nav" 
          className="md:hidden fixed inset-x-4 top-24 z-50 rounded-[32px] bg-white border border-slate-200 shadow-2xl p-6 overflow-hidden animate-fade-in"
        >
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              {NAV.map((n) =>
                n.href.startsWith("/#") ? (
                  <a key={n.href} href={n.href} onClick={() => setOpen(false)} className="text-lg font-bold text-slate-900">
                    {n.label}
                  </a>
                ) : (
                  <Link key={n.href} to={n.href} onClick={() => setOpen(false)} className="text-lg font-bold text-slate-900">
                    {n.label}
                  </Link>
                ),
              )}
            </div>
            
            <div className="pt-6 border-t border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">
                Popular Tools
              </p>
              <div className="grid grid-cols-2 gap-2">
                {toolItems.slice(0, 6).map((t) => (
                  <Link
                    key={t.path}
                    to={t.path}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-900"
                  >
                    <span>{t.emoji}</span> {t.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-6 border-t border-slate-100">
              <Link
                to="/signup"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 rounded-2xl bg-violet-600 py-4 text-base font-bold text-white shadow-lg shadow-violet-200"
              >
                Start Free <ArrowRight className="h-5 w-5" />
              </Link>
              <Link 
                to="/login" 
                onClick={() => setOpen(false)} 
                className="flex items-center justify-center py-4 text-base font-bold text-slate-600"
              >
                Log In
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
