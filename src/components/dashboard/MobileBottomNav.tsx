import { Link, useLocation } from "@tanstack/react-router";
import { Home, Repeat, Calendar, Sparkles } from "lucide-react";

const TABS = [
  { to: "/dashboard", icon: Home, label: "Home", match: (p: string) => p === "/dashboard" },
  { to: "/dashboard/repurpose", icon: Repeat, label: "Create", match: (p: string) => p.startsWith("/dashboard/repurpose") },
  { to: "/dashboard/calendar", icon: Calendar, label: "Calendar", match: (p: string) => p.startsWith("/dashboard/calendar") },
] as const;

export function MobileBottomNav() {
  const { pathname } = useLocation();
  const openSpark = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("postspark:open-copilot"));
    }
  };
  return (
    <nav className="ds-mobile-bottom-nav md:hidden" aria-label="Primary mobile navigation">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const active = tab.match(pathname);
        return (
          <Link
            key={tab.to}
            to={tab.to}
            data-active={active ? "true" : "false"}
            className="ds-mobile-nav-item"
            aria-current={active ? "page" : undefined}
          >
            <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
      <button
        type="button"
        onClick={openSpark}
        className="ds-mobile-nav-item"
        aria-label="Open Spark Copilot"
      >
        <Sparkles className="h-5 w-5" strokeWidth={2} />
        <span>Spark</span>
      </button>
    </nav>
  );
}
