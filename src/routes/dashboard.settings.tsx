import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.user_metadata?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: name },
    });
    setSavingProfile(false);
    if (error) toast.error(error.message);
    else toast.success("Profile updated!");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSavingPassword(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Password updated!");
      setPassword("");
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">Manage your account.</p>

      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">Profile</h2>
        <form onSubmit={handleUpdateProfile} className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-foreground">Full Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground">Email</label>
            <input
              value={email}
              disabled
              className="mt-1 w-full rounded-lg border border-input bg-muted px-3 py-2 text-sm text-muted-foreground"
            />
          </div>
          <button
            type="submit"
            disabled={savingProfile}
            className="flex items-center gap-2 rounded-lg gradient-electric px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {savingProfile && <Loader2 className="h-3 w-3 animate-spin" />}
            Save Changes
          </button>
        </form>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">Change Password</h2>
        <form onSubmit={handleChangePassword} className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-foreground">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            type="submit"
            disabled={savingPassword}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent disabled:opacity-50"
          >
            {savingPassword && <Loader2 className="h-3 w-3 animate-spin" />}
            Update Password
          </button>
        </form>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">Subscription</h2>
        <p className="mt-2 text-sm text-muted-foreground">You are on the <strong className="text-foreground">Free</strong> plan.</p>
        <p className="mt-1 text-xs text-muted-foreground">3 repurposes/month included.</p>
        <button className="mt-3 rounded-lg gradient-electric px-4 py-2 text-sm font-semibold text-primary-foreground">
          Upgrade to Pro — $19/mo
        </button>
      </div>
    </div>
  );
}
