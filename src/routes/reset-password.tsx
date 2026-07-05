import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AuthShell,
  AuthLabel,
  AuthInput,
  AuthPrimaryButton,
} from "@/components/auth/AuthShell";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — PostSpark" },
      { name: "description", content: "Set a new password for your PostSpark account to regain access to your AI content workspace." },
      { property: "og:title", content: "Reset your PostSpark password" },
      { property: "og:description", content: "Choose a new password and get back into your PostSpark workspace." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (hashParams.get("type") === "recovery") setIsRecovery(true);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setIsRecovery(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    if (password !== confirmPassword) return toast.error("Passwords don't match");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated! You can now sign in.");
    navigate({ to: "/login" });
  };

  if (!isRecovery) {
    return (
      <AuthShell title="Invalid or expired link">
        <p className="text-center text-sm text-[#475569]">
          This password reset link is invalid or has expired.
        </p>
        <Link
          to="/login"
          className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-[#7C3AED] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6D28D9]"
        >
          Back to sign in
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Enter your new password below"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <AuthLabel>New password</AuthLabel>
          <AuthInput
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="••••••••"
          />
        </div>
        <div>
          <AuthLabel>Confirm password</AuthLabel>
          <AuthInput
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="••••••••"
          />
        </div>

        <AuthPrimaryButton type="submit" loading={loading}>
          Update password
        </AuthPrimaryButton>
      </form>
    </AuthShell>
  );
}
