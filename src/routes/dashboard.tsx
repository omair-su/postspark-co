import { createFileRoute, Outlet, redirect, useNavigate, useLocation, useRouter, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getOnboardingStatus } from "@/server/onboarding.functions";
import { AlertTriangle, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/login" });
    }
  },
  component: DashboardLayoutRoute,
  errorComponent: DashboardErrorBoundary,
});

function DashboardErrorBoundary({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  const message = error?.message || "Something went wrong loading this page.";
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-xl py-12 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-foreground">Something broke</h1>
        <p className="mb-6 text-sm text-muted-foreground">{message}</p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
          <Link to="/dashboard" className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
            Go to dashboard
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}

function DashboardLayoutRoute() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!session) return;
    if (location.pathname.startsWith("/onboarding")) return;
    getOnboardingStatus({ headers: { Authorization: `Bearer ${session.access_token}` } })
      .then((s) => {
        if (!s.completed) navigate({ to: "/onboarding", replace: true });
      })
      .catch(() => {});
  }, [session, navigate, location.pathname]);

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
