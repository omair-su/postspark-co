import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Start Free — PostSpark AI Content Repurposing" },
      { name: "description", content: "Create your free PostSpark account and start repurposing content with AI. 3 free repurposes per month, no credit card required." },
      { property: "og:title", content: "Start Free on PostSpark" },
      { property: "og:description", content: "3 free AI repurposes every month. No credit card." },
      { property: "og:url", content: "https://postspark.co/signup" },
      { property: "og:image", content: "https://postspark.co/og-image.png" },
    ],
    links: [{ rel: "canonical", href: "https://postspark.co/signup" }],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [referralCode, setReferralCode] = useState<string>("");
  const [pendingConfirmEmail, setPendingConfirmEmail] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted && data.session) navigate({ to: "/dashboard", replace: true });
    });
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      if (ref) {
        setReferralCode(ref);
        try { localStorage.setItem("postspark_ref", ref); } catch {}
      } else {
        try {
          const stored = localStorage.getItem("postspark_ref");
          if (stored) setReferralCode(stored);
        } catch {}
      }
    }
    return () => { mounted = false; };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, ...(referralCode ? { referral_code: referralCode } : {}) },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    if (data.session) {
      try { localStorage.removeItem("postspark_ref"); } catch {}
      toast.success("Account created!");
      navigate({ to: "/dashboard", replace: true });
    } else {
      setPendingConfirmEmail(email);
      toast.success("Check your email to confirm your account.");
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/auth/callback`,
    });
    if (result.error) {
      toast.error(result.error instanceof Error ? result.error.message : "Google sign-in failed");
      setGoogleLoading(false);
      return;
    }
    if (result.redirected) return;
    toast.success("Account created!");
    navigate({ to: "/dashboard", replace: true });
  };

  if (pendingConfirmEmail) {
    return (
      <AuthShell title="Confirm your email">
        <p className="text-center text-sm text-[#475569]">
          We sent a confirmation link to{" "}
          <span className="font-semibold text-[#0F172A]">{pendingConfirmEmail}</span>.
          Click the link to activate your account, then sign in.
        </p>
        <p className="mt-3 text-center text-xs text-[#94A3B8]">
          Didn't get it? Check spam, or wait a minute and try again.
        </p>
        <Link
          to="/login"
          className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-[#7C3AED] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6D28D9]"
        >
          Go to sign in
        </Link>
        <button
          onClick={() => setPendingConfirmEmail("")}
          className="mt-3 block w-full text-center text-xs font-medium text-[#7C3AED] hover:underline"
        >
          Use a different email
        </button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Already have an account?"
      altPrompt="Already have an account?"
      altLinkText="Sign In"
      altTo="/login"
    >
      {referralCode && (
        <div className="mb-4 rounded-lg border border-[#7C3AED]/25 bg-[#7C3AED]/8 px-3 py-2 text-center text-xs text-[#4C1D95]">
          🎁 You were invited — get <span className="font-semibold">20% off Pro</span> when you upgrade.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <AuthLabel>Full name</AuthLabel>
          <AuthInput
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            placeholder="Jane Doe"
          />
        </div>
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
          <AuthLabel>Password</AuthLabel>
          <AuthInput
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="••••••••"
          />
          {password.length > 0 && password.length < 6 && (
            <p className="mt-1 text-[11px] text-[#EF4444]">
              Password must be at least 6 characters
            </p>
          )}
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
