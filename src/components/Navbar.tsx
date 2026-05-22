import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PostSparkLogo } from "@/components/PostSparkLogo";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // When landing on / with a hash, smooth-scroll to that section once mounted.
  useEffect(() => {
    if (location.pathname !== "/") return;
    const hash = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
    if (!hash) return;
    // wait for lazy sections to mount
    const t = setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 250);
    return () => clearTimeout(t);
  }, [location.pathname]);

  const goToSection = (id: string) => {
    setOpen(false);
    if (location.pathname === "/") {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      // update hash without jump
      try { window.history.replaceState(null, "", `/#${id}`); } catch {}
    } else {
      navigate({ to: "/", hash: id });
    }
  };

  return (
    <nav className="glass fixed top-0 left-0 right-0 z-50 border-b border-border">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center group">
          <PostSparkLogo variant="wordmark" size={32} />
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <button onClick={() => goToSection("features")} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Features
          </button>
          <button onClick={() => goToSection("how-it-works")} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            How It Works
          </button>
          <Link to="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </Link>
          <Link to="/demo" className="text-sm font-medium text-primary hover:opacity-80 transition-opacity">
            Try Demo
          </Link>
          <Link to="/gallery" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Gallery
          </Link>
          <Link to="/blog" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Blog
          </Link>
          <ThemeToggle />
          <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Login
          </Link>
          <Link
            to="/signup"
            className="inline-flex items-center justify-center rounded-lg gradient-electric px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 glow-electric"
          >
            Get Started
          </Link>
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <button onClick={() => goToSection("features")} className="text-left text-sm font-medium text-muted-foreground">
              Features
            </button>
            <button onClick={() => goToSection("how-it-works")} className="text-left text-sm font-medium text-muted-foreground">
              How It Works
            </button>
            <Link to="/pricing" className="text-sm font-medium text-muted-foreground" onClick={() => setOpen(false)}>
              Pricing
            </Link>
            <Link to="/demo" className="text-sm font-medium text-primary" onClick={() => setOpen(false)}>
              Try Demo
            </Link>
            <Link to="/gallery" className="text-sm font-medium text-muted-foreground" onClick={() => setOpen(false)}>
              Gallery
            </Link>
            <Link to="/blog" className="text-sm font-medium text-muted-foreground" onClick={() => setOpen(false)}>
              Blog
            </Link>
            <Link to="/login" className="text-sm font-medium text-muted-foreground" onClick={() => setOpen(false)}>
              Login
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center rounded-lg gradient-electric px-4 py-2 text-sm font-semibold text-primary-foreground"
              onClick={() => setOpen(false)}
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
