import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { acceptInvite } from "@/server/workspace.functions";
import { Loader2, Users } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/invite/$token")({
  head: () => ({ meta: [{ title: "Team invite — PostSpark" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: InvitePage,
});

function InvitePage() {
  const { token } = Route.useParams();
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("pendingInviteToken", token);
    }
  }, [token]);

  const onAccept = async () => {
    if (!session) {
      navigate({ to: "/signup" });
      return;
    }
    setBusy(true);
    const res = await acceptInvite({
      data: { token },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    setBusy(false);
    if (!(res as any).success) {
      toast.error((res as any).error || "Could not accept invite");
      return;
    }
    toast.success("You're in!");
    if (typeof window !== "undefined") window.localStorage.removeItem("pendingInviteToken");
    setDone((res as any).workspaceId);
    setTimeout(() => navigate({ to: "/dashboard/team" }), 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-surface">
      <div className="max-w-md w-full rounded-2xl border border-border bg-card p-8 text-center">
        <div className="mx-auto h-12 w-12 rounded-full gradient-electric flex items-center justify-center mb-4">
          <Users className="h-6 w-6 text-primary-foreground" />
        </div>
        <h1 className="text-xl font-bold text-foreground">You've been invited to a workspace</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Join the team to share brand kits, scheduled posts, and more.
        </p>

        {done ? (
          <p className="mt-6 text-sm text-primary">Joined! Redirecting…</p>
        ) : loading ? (
          <Loader2 className="mx-auto mt-6 h-5 w-5 animate-spin text-primary" />
        ) : !session ? (
          <div className="mt-6 space-y-2">
            <Link to="/signup" className="block w-full rounded-lg gradient-electric px-4 py-2.5 text-sm font-semibold text-primary-foreground">
              Create an account to accept
            </Link>
            <Link to="/login" className="block w-full rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-accent">
              Sign in
            </Link>
          </div>
        ) : (
          <button
            onClick={onAccept}
            disabled={busy}
            className="mt-6 w-full rounded-lg gradient-electric px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Accept invite"}
          </button>
        )}
      </div>
    </div>
  );
}
