import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, Sparkles } from "lucide-react";

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="glass fixed top-0 left-0 right-0 z-50 border-b border-border">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-electric">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">RepurposeAI</span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
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

        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
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
