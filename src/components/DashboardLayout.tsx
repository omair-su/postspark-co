import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { LayoutDashboard, Repeat, History, Settings, LogOut, Menu, X, User, BarChart3, Bookmark, Mic, Flame, Image as ImageIcon, Calendar, FileText, Gift, Globe, Sparkles, Users, Building2, ChevronDown, Shield, Wand2, MessageSquare, Layers, PanelLeftClose, PanelLeftOpen, Check, CreditCard } from "lucide-react";
import { SparkCopilot } from "@/components/SparkCopilot";
import { isCurrentUserAdmin } from "@/lib/blogAdmin.functions";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { PostSparkLogo } from "@/components/PostSparkLogo";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { AIProgressBar } from "@/components/AIProgressBar";
import { SubscriptionBanner } from "@/components/SubscriptionBanner";
import { CommandPaletteRoot } from "@/components/CommandPalette";
import { UpgradeNudgeModal } from "@/components/UpgradeNudgeModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getMyWorkspace, setActiveBrandKit } from "@/lib/workspace.functions";

const navGroups = [
  {
    label: "Home",
    items: [
      { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    ],
  },
  {
    label: "Create",
    items: [
      { to: "/dashboard/repurpose", icon: Repeat, label: "Repurpose" },
      { to: "/dashboard/repurpose", icon: FileText, label: "Import Studio", search: { tab: "import" } as any },
      { to: "/dashboard/seo-blog", icon: FileText, label: "SEO Blog" },
      { to: "/dashboard/hook-lab", icon: Flame, label: "Hook Lab" },
      { to: "/dashboard/image-studio", icon: ImageIcon, label: "Image Studio" },
      { to: "/dashboard/thumbnail", icon: ImageIcon, label: "Thumbnail / Cover" },
      { to: "/dashboard/carousel", icon: Layers, label: "Carousel Generator" },
      { to: "/dashboard/podcast", icon: Mic, label: "Podcast → Content" },
      { to: "/dashboard/humanizer", icon: Wand2, label: "AI Humanizer" },
      { to: "/dashboard/reply-generator", icon: MessageSquare, label: "Reply Generator" },
      { to: "/dashboard/templates", icon: Bookmark, label: "Templates" },
    ],
  },
  {
    label: "Plan & Publish",
    items: [
      { to: "/dashboard/calendar", icon: Calendar, label: "Calendar" },
      { to: "/dashboard/history", icon: History, label: "History" },
    ],
  },
  {
    label: "Brand",
    items: [
      { to: "/dashboard/brand-kit", icon: Sparkles, label: "Brand Kit" },
      { to: "/dashboard/brand-voice", icon: Mic, label: "Brand Voice" },
    ],
  },
  {
    label: "Insights & Team",
    items: [
      { to: "/dashboard/analytics", icon: BarChart3, label: "Analytics" },
      { to: "/dashboard/agency-analytics", icon: Building2, label: "Agency Analytics" },
      { to: "/dashboard/team", icon: Users, label: "Team" },
    ],
  },
  {
    label: "More",
    items: [
      { to: "/gallery", icon: Globe, label: "Gallery" },
      { to: "/dashboard/referrals", icon: Gift, label: "Refer & Earn" },
      { to: "/dashboard/billing", icon: CreditCard, label: "Billing" },
      { to: "/dashboard/settings", icon: Settings, label: "Settings" },
    ],
  },
] as const;

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { signOut, user, session } = useAuth();
  const { tier } = useSubscription();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("ps_sidebar_collapsed") === "1";
  });
  const [wsOpen, setWsOpen] = useState(false);
  const [ws, setWs] = useState<{
    workspace: { id: string; name: string } | null;
    brandKits: Array<{ id: string; brand_name: string | null }>;
    activeBrandKitId: string | null;
  }>({ workspace: null, brandKits: [], activeBrandKitId: null });
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("ps_sidebar_collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  // Close mobile drawer on route change
  useEffect(() => {
    setSidebarOpen(false);
    setWsOpen(false);
  }, [location.pathname]);

  // Keyboard shortcut ⌘\ to toggle collapse
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "\\") {
        e.preventDefault();
        setCollapsed((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!session) return;
    isCurrentUserAdmin({ headers: { Authorization: `Bearer ${session.access_token}` } })
      .then((r: any) => setIsAdmin(!!r?.isAdmin))
      .catch(() => setIsAdmin(false));
  }, [session]);

  useEffect(() => {
    if (!session) return;
    getMyWorkspace({ headers: { Authorization: `Bearer ${session.access_token}` } })
      .then((r: any) => setWs({
        workspace: r.workspace || null,
        brandKits: r.brandKits || [],
        activeBrandKitId: r.activeBrandKitId || null,
      }))
      .catch(() => {});
  }, [session]);

  const handleSwitchKit = async (id: string | null) => {
    if (!session || !ws.workspace) return;
    await setActiveBrandKit({
      data: { workspaceId: ws.workspace.id, brandKitId: id },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    setWs((prev) => ({ ...prev, activeBrandKitId: id }));
    setWsOpen(false);
    toast.success("Brand switched");
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  };

  const avatarUrl = user?.user_metadata?.avatar_url;
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || "User";
  const displayEmail = user?.email || "";
  const planLabel = tier === "free" ? "Free" : tier === "pro" ? "Pro" : "Agency";
  const wsInitial = (ws.workspace?.name || "W").trim().charAt(0).toUpperCase();
  const activeKit = ws.brandKits.find((k) => k.id === ws.activeBrandKitId);

  const renderSidebar = (forceExpanded: boolean = false) => {
    const isCollapsed = collapsed && !forceExpanded;
    return (
    <div
      className="lux-sidebar relative flex h-full min-h-0 flex-col text-sidebar-foreground"
      data-collapsed={isCollapsed ? "true" : "false"}
    >
      <div className="relative flex h-16 shrink-0 items-center justify-between gap-1 px-2 border-b border-white/5">
        <Link
          to="/dashboard"
          onClick={() => setSidebarOpen(false)}
          aria-label="PostSpark — Dashboard home"
          className={`ps-sidebar-logo group flex h-12 items-center rounded-xl px-2 transition hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a78bfa]/60 ${
            isCollapsed ? "mx-auto justify-center w-12" : "flex-1"
          }`}
        >
          <PostSparkLogo variant={isCollapsed ? "icon" : "wordmark"} size={isCollapsed ? 30 : 34} tone="light" />
        </Link>
        <button
          type="button"
          className="lux-collapse-btn hidden md:inline-flex shrink-0"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isCollapsed ? "Expand sidebar (⌘\\)" : "Collapse sidebar (⌘\\)"}
        >
          {isCollapsed ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
        </button>
        <button
          className="md:hidden text-sidebar-foreground/70 hover:text-sidebar-foreground shrink-0 p-1"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>


      {/* Workspace pill */}
      {ws.workspace && (
        <div className="relative shrink-0 px-3 pt-3">
          {isCollapsed ? (
            <button
              type="button"
              className="lux-workspace-disc mx-auto"
              title={ws.workspace.name}
              onClick={() => setCollapsed(false)}
              aria-label={`Workspace: ${ws.workspace.name}`}
            >
              {wsInitial}
            </button>
          ) : (
            <Popover open={wsOpen} onOpenChange={setWsOpen}>
              <PopoverTrigger asChild>
                <button type="button" className="lux-workspace-pill" aria-label="Switch brand">
                  <span className="lux-workspace-disc">{wsInitial}</span>
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-[11px] uppercase tracking-[0.14em] text-white/55">Workspace</span>
                    <span className="block truncate text-[13px] font-semibold text-white">
                      {activeKit?.brand_name || ws.workspace.name}
                    </span>
                  </span>
                  <ChevronDown className="h-4 w-4 text-white/60" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="lux-popover w-64 p-2" align="start" sideOffset={8}>
                <p className="px-2 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">
                  {ws.workspace.name} · Brands
                </p>
                <button
                  type="button"
                  className="lux-popover-item w-full"
                  data-active={!ws.activeBrandKitId}
                  onClick={() => handleSwitchKit(null)}
                >
                  <Building2 className="h-3.5 w-3.5 text-[#c4b5fd]" />
                  <span className="flex-1 text-left">All brands</span>
                  {!ws.activeBrandKitId && <Check className="h-3.5 w-3.5 text-[#c4b5fd]" />}
                </button>
                {ws.brandKits.map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    className="lux-popover-item w-full"
                    data-active={ws.activeBrandKitId === k.id}
                    onClick={() => handleSwitchKit(k.id)}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[#fbcfe8]" />
                    <span className="flex-1 text-left truncate">{k.brand_name || "Unnamed"}</span>
                    {ws.activeBrandKitId === k.id && <Check className="h-3.5 w-3.5 text-[#c4b5fd]" />}
                  </button>
                ))}
                <div className="mt-1 border-t border-white/5 pt-1">
                  <Link
                    to="/dashboard/brand-kit"
                    onClick={() => setWsOpen(false)}
                    className="lux-popover-item"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[#fbcfe8]" />
                    <span>Manage brand kits</span>
                  </Link>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      )}

      <nav className="sidebar-scroll relative flex-1 min-h-0 overflow-y-auto px-3 py-4">
        {[
          ...navGroups,
          ...(isAdmin
            ? [{
                label: "Admin",
                items: [{ to: "/dashboard/blog-admin", icon: Shield, label: "Blog Admin" }],
              } as const]
            : []),
        ].map((group, gi) => (
          <div key={group.label} className={gi === 0 ? "" : isCollapsed ? "lux-group-spacer mt-3" : "mt-5"}>
            {gi !== 0 && (
              <p className="lux-group-label px-3 pb-2 text-[10px] uppercase tracking-[0.2em]">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item: any) => {
                const active = location.pathname === item.to && !item.search;
                return (
                  <Link
                    key={item.to + (item.label || "")}
                    to={item.to}
                    search={item.search}
                    onClick={() => setSidebarOpen(false)}
                    title={isCollapsed ? item.label : undefined}
                    className={`lux-nav-item flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                      active ? "lux-nav-active" : "text-sidebar-foreground/65"
                    }`}
                  >
                    <item.icon className="lux-nav-icon h-4 w-4 shrink-0" />
                    <span className="lux-collapse-hide truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="relative shrink-0 border-t border-white/5 p-3">
        <div className="ds-user-card mb-3 flex items-center gap-3 px-3 py-2.5">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-[#a78bfa]/60 shadow-[0_0_14px_-4px_rgba(167,139,250,0.7)]" />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#ec4899] via-[#a855f7] to-[#7c3aed] ring-2 ring-[#a78bfa]/60 shadow-[0_0_14px_-4px_rgba(167,139,250,0.7)]">
              <User className="h-4 w-4 text-white" />
            </div>
          )}
          <div className="lux-collapse-hide min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-xs font-semibold text-sidebar-foreground">{displayName}</p>
              <span className="ds-plan-chip">{planLabel}</span>
            </div>
            <p className="truncate text-[10px] text-sidebar-foreground/55 mt-0.5">{displayEmail}</p>
          </div>
          <Link
            to="/dashboard/settings"
            onClick={() => setSidebarOpen(false)}
            className="lux-collapse-hide ml-auto rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-medium text-white/75 hover:text-white hover:bg-white/10 transition"
            title="Manage account"
          >
            Manage
          </Link>
        </div>

        <button
          onClick={handleSignOut}
          title={isCollapsed ? "Sign out" : undefined}
          className="lux-nav-item flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/65"
        >
          <LogOut className="lux-nav-icon h-4 w-4 shrink-0" />
          <span className="lux-collapse-hide">Sign Out</span>
        </button>
      </div>
    </div>
    );
  };

  const desktopWidthClass = collapsed ? "w-16" : "w-56";

  return (
    <div className="dashboard-shell flex h-screen" style={{ background: "var(--ds-bg)" }}>
      <aside className={`hidden flex-shrink-0 md:block transition-[width] duration-300 ease-out ${desktopWidthClass}`}>{renderSidebar(false)}</aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 h-full">{renderSidebar(true)}</div>
        </div>
      )}


      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="ds-header relative z-20 flex h-14 items-center justify-between gap-3 px-4">
          <button
            className="md:hidden text-slate-700 hover:text-slate-900"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
            className="ds-search-pill hidden md:inline-flex min-w-[260px] justify-between"
            aria-label="Open command palette"
          >
            <span className="flex items-center gap-2">
              <span className="ds-status-dot" aria-hidden />
              <span>Search workflows, posts, tools…</span>
            </span>
            <span className="ds-kbd">⌘K</span>
          </button>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <span className="ds-chip hidden sm:inline-flex">
              <span className="ds-status-dot" aria-hidden /> AI online
            </span>
            <span className="ds-chip ds-chip-accent hidden sm:inline-flex capitalize">{planLabel}</span>
            <Link to="/dashboard/repurpose" className="ds-cta-pill !py-1.5 !px-3 !text-[12px] hidden sm:inline-flex">
              <Sparkles className="h-3.5 w-3.5" /> New
            </Link>
            <ThemeToggle />
          </div>
        </header>
        <SubscriptionBanner />
        <main className="ds-canvas flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="ds-orb ds-orb-violet" aria-hidden />
          <div className="ds-orb ds-orb-pink" aria-hidden />
          <div className="ds-orb ds-orb-indigo" aria-hidden />
          <div className="relative z-10">{children}</div>
        </main>
      </div>
      <PWAInstallPrompt />
      <AIProgressBar />
      <CommandPaletteRoot />
      <SparkCopilot />
      <UpgradeNudgeModal />
    </div>
  );
}
