import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [
      { title: "Signing in… — PostSpark" },
      { name: "description", content: "Completing your PostSpark sign-in. You'll be redirected to your dashboard in a moment." },
      { property: "og:title", content: "Signing in to PostSpark" },
      { property: "og:description", content: "Finishing authentication and redirecting to your workspace." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");

    if (!accessToken || !refreshToken) {
      setReady(true);
      return;
    }

    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .finally(() => setReady(true));
  }, []);

  if (ready) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg gradient-electric">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <Loader2 className="mx-auto mt-6 h-6 w-6 animate-spin text-primary" />
        <p className="mt-3 text-sm font-medium text-muted-foreground">Opening your dashboard...</p>
      </div>
    </div>
  );
}