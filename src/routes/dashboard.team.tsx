import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  getMyWorkspace,
  createWorkspace,
  inviteMember,
  revokeInvite,
  removeMember,
  updateWorkspace,
} from "@/server/workspace.functions";
import { Loader2, Users, Crown, Mail, Trash2, Copy, Check, Sparkles, Building2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/team")({
  component: TeamPage,
});

function TeamPage() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const headers = session ? { Authorization: `Bearer ${session.access_token}` } : undefined;

  const refresh = async () => {
    if (!headers) return;
    const res = await getMyWorkspace({ headers });
    setData(res);
    setLoading(false);
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [session]);

  const onCreate = async () => {
    if (!name.trim() || !headers) return;
    setBusy(true);
    const res = await createWorkspace({ data: { name: name.trim() }, headers });
    setBusy(false);
    if ((res as any).error) {
      toast.error((res as any).error === "AGENCY_REQUIRED" ? "Agency plan required to create a workspace." : (res as any).error);
      return;
    }
    toast.success("Workspace created!");
    setName("");
    refresh();
  };

  const onInvite = async () => {
    if (!email.trim() || !headers || !data?.workspace) return;
    setBusy(true);
    const res = await inviteMember({
      data: { workspaceId: data.workspace.id, email: email.trim(), role },
      headers,
    });
    setBusy(false);
    if (!(res as any).success) {
      toast.error((res as any).error || "Failed to invite");
      return;
    }
    toast.success("Invite created — copy the link to share!");
    setEmail("");
    refresh();
  };

  const inviteLink = (token: string) =>
    `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${token}`;

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    toast.success("Link copied");
    setTimeout(() => setCopied(null), 1500);
  };

  const toggleWhiteLabel = async () => {
    if (!headers || !data?.workspace) return;
    await updateWorkspace({
      data: { workspaceId: data.workspace.id, whiteLabel: !data.workspace.white_label },
      headers,
    });
    refresh();
  };

  if (loading) {
    return <Loader2 className="mx-auto mt-20 h-6 w-6 animate-spin text-primary" />;
  }

  if (!data?.workspace) {
    return (
      <div className="mx-auto max-w-2xl animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" /> Team
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Agency plan: invite up to 5 teammates to share brand kits, history, and scheduled posts.
        </p>

        <div className="mt-6 rounded-2xl border border-primary/20 bg-card p-6">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-foreground">Create your agency workspace</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Give it a name (e.g. your agency or studio name).</p>
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Studio"
              className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
            />
            <button
              onClick={onCreate}
              disabled={busy || !name.trim()}
              className="rounded-lg gradient-electric px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
            </button>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Requires the Agency plan. Free/Pro: <a href="/dashboard/settings" className="text-primary underline">upgrade here</a>.
          </p>
        </div>
      </div>
    );
  }

  const seatsUsed = (data.members?.length || 0) + (data.invites?.length || 0);
  const isOwnerAdmin = data.role === "owner" || data.role === "admin";

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" /> {data.workspace.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {seatsUsed} / 5 seats used · Your role: <span className="font-semibold capitalize">{data.role}</span>
          </p>
        </div>
        {isOwnerAdmin && (
          <button
            onClick={toggleWhiteLabel}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-accent"
            title="Hide PostSpark branding on shared review pages"
          >
            {data.workspace.white_label ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            White-label: {data.workspace.white_label ? "On" : "Off"}
          </button>
        )}
      </div>

      {/* Members */}
      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Users className="h-4 w-4" /> Members ({data.members.length})
        </h2>
        <div className="space-y-2">
          {data.members.map((m: any) => (
            <div key={m.user_id} className="flex items-center justify-between rounded-lg bg-surface px-3 py-2">
              <div className="flex items-center gap-2">
                {m.role === "owner" && <Crown className="h-4 w-4 text-primary" />}
                <span className="text-sm text-foreground font-mono">{m.user_id.slice(0, 8)}…</span>
                <span className="text-xs text-muted-foreground capitalize">({m.role})</span>
              </div>
              {isOwnerAdmin && m.role !== "owner" && (
                <button
                  onClick={async () => {
                    if (!headers) return;
                    await removeMember({ data: { workspaceId: data.workspace.id, userId: m.user_id }, headers });
                    toast.success("Removed");
                    refresh();
                  }}
                  className="text-xs text-destructive hover:underline"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Invite */}
      {isOwnerAdmin && seatsUsed < 5 && (
        <div className="mt-4 rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Mail className="h-4 w-4" /> Invite a teammate
          </h2>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@example.com"
              className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button
              onClick={onInvite}
              disabled={busy || !email.trim()}
              className="rounded-lg gradient-electric px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              Invite
            </button>
          </div>
        </div>
      )}

      {/* Pending invites */}
      {data.invites.length > 0 && (
        <div className="mt-4 rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">Pending invites</h2>
          <div className="space-y-2">
            {data.invites.map((inv: any) => (
              <div key={inv.id} className="rounded-lg bg-surface p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm text-foreground">{inv.email}</p>
                    <p className="text-[11px] text-muted-foreground capitalize">{inv.role} · expires {new Date(inv.expires_at).toLocaleDateString()}</p>
                  </div>
                  {isOwnerAdmin && (
                    <button
                      onClick={async () => {
                        if (!headers) return;
                        await revokeInvite({ data: { inviteId: inv.id }, headers });
                        toast.success("Revoked");
                        refresh();
                      }}
                      className="text-xs text-destructive hover:underline"
                    >
                      Revoke
                    </button>
                  )}
                </div>
                <button
                  onClick={() => copy(inviteLink(inv.token || ""), inv.id)}
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  {copied === inv.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  Copy invite link
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
