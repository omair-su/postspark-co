import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import {
  AuthShell,
  AuthLabel,
  AuthInput,
  AuthPrimaryButton,
  AuthDivider,
  GoogleButton,
} from "@/components/auth/AuthShell";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): { next?: string } =>
    typeof s.next === "string" ? { next: s.next } : {},

  head: () => ({
    meta: [
      { title: "Sign in — PostSpark" },
      { name: "description", content: "Sign in to your PostSpark account to repurpose blogs, podcasts, and videos into 30+ platform-ready posts." },
      { property: "og:title", content: "Sign in to PostSpark" },
      { property: "og:description", content: "Sign in to your AI content repurposing workspace." },
      { property: "og:url", content: "https://postspark.co/login" },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: "https://postspark.co/login" }],
  }),
  component: LoginPage,
});

function safeNext(next?: string): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

function LoginPage() {
  const _navigate = useNavigate();
  const { next } = Route.useSearch();
  const dest = safeNext(next);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted && data.session) window.location.assign(dest);
    });
    return () => { mounted = false; };
  }, [dest]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    window.location.assign(dest);
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const callback = new URL(`${window.location.origin}/auth/callback`);
    if (dest !== "/dashboard") callback.searchParams.set("next", dest);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: callback.toString(),
    });
    if (result.error) {
      toast.error(result.error instanceof Error ? result.error.message : "Google sign-in failed");
      setGoogleLoading(false);
      return;
    }
    if (result.redirected) return;
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      toast.error("Google sign-in did not complete. Please try again.");
      setGoogleLoading(false);
      return;
    }
    window.location.assign(dest);
  };

  const handleForgotPassword = async () => {
    if (!email) return toast.error("Enter your email first");
    setForgotLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setForgotLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Password reset link sent — check your email.");
  };

  return (
    <AuthShell
      title="Sign in to your account"
      subtitle="Don't have an account?"
      altPrompt="Don't have an account?"
      altLinkText="Sign Up"
      altTo="/signup"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <AuthLabel>Email</AuthLabel>
          <AuthInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <AuthLabel>Password</AuthLabel>
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={forgotLoading}
              className="mb-1.5 text-[12px] font-medium text-[#7C3AED] hover:underline disabled:opacity-50"
            >
              {forgotLoading ? "Sending..." : "Forgot?"}
            </button>
          </div>
          <AuthInput
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </div>

        <AuthPrimaryButton type="submit" loading={loading}>
          Continue
        </AuthPrimaryButton>
      </form>

      <AuthDivider />

      <GoogleButton onClick={handleGoogle} loading={googleLoading} />

      <p className="mt-5 text-center text-[12px] text-[#94A3B8]">
        By continuing you agree to our Terms & Privacy Policy.
      </p>
    </AuthShell>
  );
}
