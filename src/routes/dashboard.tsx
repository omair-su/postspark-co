import { createFileRoute, Outlet, redirect, useNavigate, useLocation } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getOnboardingStatus } from "@/server/onboarding.functions";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/login" });
    }
  },
  component: DashboardLayoutRoute,
});

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
