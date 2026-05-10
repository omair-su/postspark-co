import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, Repeat, History, Settings, LogOut, Menu, X, User, BarChart3, Bookmark, Mic, Flame, Image as ImageIcon, Calendar, FileText, Gift, Globe, Sparkles, Users, Building2, ChevronDown, Shield } from "lucide-react";
import { isCurrentUserAdmin } from "@/lib/blogAdmin.functions";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { PostSparkLogo } from "@/components/PostSparkLogo";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { AIProgressBar } from "@/components/AIProgressBar";
import { SubscriptionBanner } from "@/components/SubscriptionBanner";
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
      { to: "/dashboard/import", icon: FileText, label: "Import Studio" },
      { to: "/dashboard/seo-blog", icon: FileText, label: "SEO Blog" },
      { to: "/dashboard/hook-lab", icon: Flame, label: "Hook Lab" },
      { to: "/dashboard/image-studio", icon: ImageIcon, label: "Image Studio" },
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
      { to: "/dashboard/settings", icon: Settings, label: "Settings" },
    ],
  },
] as const;

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { signOut, user, session } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ws, setWs] = useState<{
    workspace: { id: string; name: string } | null;
    brandKits: Array<{ id: string; brand_name: string | null }>;
    activeBrandKitId: string | null;
  }>({ workspace: null, brandKits: [], activeBrandKitId: null });
  const [isAdmin, setIsAdmin] = useState(false);

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

  const sidebar = (
    <div className="flex h-full min-h-0 flex-col bg-navy text-sidebar-foreground">
      <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b border-sidebar-border bg-gradient-to-r from-navy via-navy-light to-navy">
        <div className="ps-sidebar-logo">
          <PostSparkLogo variant="wordmark" size={32} tone="light" />
        </div>
        <button
          className="md:hidden text-sidebar-foreground/70 hover:text-sidebar-foreground"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile-only brand switcher */}
      {ws.workspace && (
        <div className="md:hidden shrink-0 border-b border-sidebar-border px-3 py-2">
          <div className="flex items-center gap-2 rounded-lg bg-sidebar-accent/30 px-2.5 py-1.5 text-xs">
            <Building2 className="h-3.5 w-3.5 text-primary" />
            <span className="truncate font-medium text-sidebar-foreground">{ws.workspace.name}</span>
            {ws.brandKits.length > 0 && (
              <select
                value={ws.activeBrandKitId || ""}
                onChange={(e) => handleSwitchKit(e.target.value || null)}
                className="ml-auto bg-transparent text-sidebar-foreground focus:outline-none"
                title="Active brand"
              >
                <option value="" className="text-foreground">All brands</option>
                {ws.brandKits.map((k) => (
                  <option key={k.id} value={k.id} className="text-foreground">{k.brand_name || "Unnamed"}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}

      <nav className="sidebar-scroll flex-1 min-h-0 overflow-y-auto px-3 py-4">
        {[
          ...navGroups,
          ...(isAdmin
            ? [{
                label: "Admin",
                items: [{ to: "/dashboard/blog-admin", icon: Shield, label: "Blog Admin" }],
              } as const]
            : []),
        ].map((group, gi) => (
          <div key={group.label} className={gi === 0 ? "" : "mt-4"}>
            {gi !== 0 && (
              <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                {group.label}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-sidebar-border p-3">
        {/* User info */}
        <div className="mb-3 flex items-center gap-3 px-3">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent">
              <User className="h-3.5 w-3.5 text-sidebar-accent-foreground" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-sidebar-foreground">{displayName}</p>
            <p className="truncate text-[10px] text-sidebar-foreground/50">{displayEmail}</p>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-surface">
      {/* Desktop sidebar */}
      <aside className="hidden w-56 flex-shrink-0 md:block">{sidebar}</aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-foreground/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-56 h-full">{sidebar}</div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4">
          <button className="md:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5 text-foreground" />
          </button>
          <div className="ml-auto flex items-center gap-3">
            {ws.workspace && (
              <div className="hidden items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1 text-xs sm:flex">
                <Building2 className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium text-foreground">{ws.workspace.name}</span>
                {ws.brandKits.length > 0 && (
                  <>
                    <span className="text-muted-foreground">·</span>
                    <select
                      value={ws.activeBrandKitId || ""}
                      onChange={(e) => handleSwitchKit(e.target.value || null)}
                      className="bg-transparent text-foreground focus:outline-none"
                      title="Active brand"
                    >
                      <option value="">All brands</option>
                      {ws.brandKits.map((k) => (
                        <option key={k.id} value={k.id}>{k.brand_name || "Unnamed"}</option>
                      ))}
                    </select>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </>
                )}
              </div>
            )}
            <ThemeToggle />
          </div>
        </header>
        <SubscriptionBanner />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
      <PWAInstallPrompt />
      <AIProgressBar />
    </div>
  );
}
