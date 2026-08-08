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
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);
  const [resending, setResending] = useState(false);

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
    if (!data.session) {
      // Email confirmation is required for this account — show a real next step
      // instead of a dead-end error.
      setAwaitingConfirm(true);
      return;
    }
    try { localStorage.removeItem("postspark_ref"); } catch {}
    toast.success("Account created!");
    navigate({ to: "/dashboard", replace: true });
  };

  const handleResend = async () => {
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    setResending(false);
    if (error) toast.error(error.message);
    else toast.success("Confirmation email sent again.");
  };

  if (awaitingConfirm) {
    return (
      <AuthShell
        title="Confirm your email"
        subtitle="One quick step to finish"
        altPrompt="Already confirmed?"
        altLinkText="Sign In"
        altTo="/login"
      >
        <div className="space-y-4 text-sm text-[#475569]">
          <p>
            We sent a confirmation link to <span className="font-semibold text-[#1F1F1F]">{email}</span>.
            Open it to activate your account.
          </p>
          <ul className="list-disc space-y-1 pl-5 text-[13px]">
            <li>Delivery usually takes under a minute.</li>
            <li>Check spam / promotions if it isn't there.</li>
            <li>Wrong address? Change it and sign up again.</li>
          </ul>
          <AuthPrimaryButton type="button" loading={resending} onClick={handleResend}>
            Resend confirmation email
          </AuthPrimaryButton>
          <button
            type="button"
            onClick={() => setAwaitingConfirm(false)}
            className="w-full text-[12px] font-medium text-[#7C3AED] hover:underline"
          >
            Use a different email
          </button>
          <p className="text-center text-[12px] text-[#94A3B8]">
            Still stuck? Email support@postspark.co and we'll activate it manually.
          </p>
        </div>
      </AuthShell>
    );
  }


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
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      toast.error("Google sign-in did not complete. Please try again.");
      setGoogleLoading(false);
      return;
    }
    navigate({ to: "/dashboard", replace: true });
  };

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
