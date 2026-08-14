import { Link } from "@tanstack/react-router";
import { Check, Loader2, Sparkles, Star } from "lucide-react";
import type { ReactNode } from "react";
import { PostSparkLogo } from "@/components/PostSparkLogo";

/**
 * Premium light split-screen auth layout, matched to the PostSpark landing page:
 * soft #F7F6FF canvas, mesh gradient glows, glass card, and a brand proof panel.
 * Shared by /login, /signup and /reset-password.
 */

const PROOF = [
  "One idea → 30 platform-ready posts",
  "Publish to 9 networks in one click",
  "Brand Voice + Brand Kit applied automatically",
  "Powered by Claude, GPT Image 2 & Flux Pro",
];

function BrandPanel() {
  return (
    <div
      className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between"
      style={{
        padding: "48px 44px",
        background:
          "radial-gradient(700px 420px at 12% 8%, rgba(168,139,250,0.55) 0%, transparent 60%)," +
          "radial-gradient(600px 500px at 92% 96%, rgba(236,72,153,0.35) 0%, transparent 62%)," +
          "linear-gradient(150deg, #2B1160 0%, #4C1D95 48%, #6D28D9 100%)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.75) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage: "radial-gradient(ellipse at 40% 30%, black 15%, transparent 72%)",
        }}
      />

      <div className="relative">
        <Link to="/" aria-label="PostSpark home" className="inline-flex">
          <PostSparkLogo variant="wordmark" size={40} tone="light" />
        </Link>
      </div>

      <div className="relative">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1"
          style={{
            background: "rgba(255,255,255,0.14)",
            border: "1px solid rgba(255,255,255,0.22)",
            color: "#EDE9FE",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <Sparkles className="h-3.5 w-3.5" />
          AI Content OS
        </span>
        <h2
          className="font-display mt-5 text-white"
          style={{ fontSize: 38, lineHeight: 1.08, fontWeight: 700, letterSpacing: "-0.03em" }}
        >
          Turn one idea into
          <br />
          a month of content.
        </h2>
        <ul className="mt-7 space-y-3.5">
          {PROOF.map((p) => (
            <li key={p} className="flex items-start gap-3" style={{ color: "rgba(255,255,255,0.88)", fontSize: 14.5 }}>
              <span
                className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full"
                style={{ background: "rgba(255,255,255,0.18)" }}
              >
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
              {p}
            </li>
          ))}
        </ul>
      </div>

      <div
        className="relative rounded-2xl p-5"
        style={{
          background: "rgba(255,255,255,0.10)",
          border: "1px solid rgba(255,255,255,0.18)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} className="h-3.5 w-3.5" style={{ color: "#FCD34D", fill: "#FCD34D" }} />
          ))}
        </div>
        <p className="mt-3 text-white" style={{ fontSize: 14, lineHeight: 1.6 }}>
          “PostSpark replaced three tools and a freelancer. I publish everywhere from one screen now.”
        </p>
        <p className="mt-2.5" style={{ color: "rgba(255,255,255,0.65)", fontSize: 12.5 }}>
          Marcus L. — Creator, 120k followers
        </p>
      </div>
    </div>
  );
}

export function AuthShell({
  title,
  subtitle,
  altPrompt,
  altLinkText,
  altTo,
  children,
}: {
  title: string;
  subtitle?: string;
  altPrompt?: string;
  altLinkText?: string;
  altTo?: "/login" | "/signup";
  children: ReactNode;
}) {
  return (
    <div
      className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-10 lg:py-10"
      style={{ background: "#F7F6FF" }}
    >
      {/* Soft landing-page mesh glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(760px 420px at 8% -6%, rgba(167,139,250,0.30) 0%, transparent 62%)," +
            "radial-gradient(700px 460px at 98% 8%, rgba(96,165,250,0.22) 0%, transparent 60%)," +
            "radial-gradient(700px 500px at 60% 112%, rgba(236,72,153,0.14) 0%, transparent 62%)",
        }}
      />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[1120px] items-center">
        <div
          className="grid w-full overflow-hidden rounded-[28px] lg:grid-cols-[1.02fr_1fr]"
          style={{
            background: "rgba(255,255,255,0.86)",
            border: "1px solid rgba(124,58,237,0.10)",
            boxShadow: "0 40px 100px -40px rgba(76,29,149,0.35), 0 2px 8px rgba(15,23,42,0.04)",
            backdropFilter: "blur(14px)",
          }}
        >
          <BrandPanel />

          <div className="flex flex-col justify-center px-6 py-10 sm:px-12 sm:py-14">
            <Link to="/" className="mb-8 inline-flex lg:hidden" aria-label="PostSpark home">
              <PostSparkLogo variant="wordmark" size={38} />
            </Link>

            <h1
              className="font-display text-[#0F172A]"
              style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.15 }}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-[14.5px] text-[#64748B]">
                {altPrompt ? (
                  <>
                    {altPrompt}{" "}
                    {altTo && altLinkText && (
                      <Link
                        to={altTo}
                        className="font-semibold text-[#7C3AED] underline-offset-2 hover:underline"
                      >
                        {altLinkText}
                      </Link>
                    )}
                  </>
                ) : (
                  subtitle
                )}
              </p>
            )}

            <div className="mt-7">{children}</div>

            <p className="mt-8 text-[12px] text-[#94A3B8]">
              <Link to="/terms" className="hover:text-[#7C3AED] hover:underline">
                Terms
              </Link>
              <span className="mx-2 opacity-50">·</span>
              <Link to="/privacy" className="hover:text-[#7C3AED] hover:underline">
                Privacy
              </Link>
              <span className="mx-2 opacity-50">·</span>
              <Link to="/" className="hover:text-[#7C3AED] hover:underline">
                Home
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Field primitives ---------- */

export function AuthLabel({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1.5 block text-[12.5px] font-semibold tracking-[0.01em] text-[#334155]">
      {children}
    </label>
  );
}

export function AuthInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={
        "block w-full rounded-xl border border-[#E4E4F5] bg-white/90 px-4 py-3 text-[14.5px] text-[#0F172A] placeholder:text-[#A5AEC0] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all focus:border-[#7C3AED] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/12 " +
        (props.className ?? "")
      }
    />
  );
}

export function AuthPrimaryButton({
  loading,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      style={{ background: "linear-gradient(135deg, #7C3AED 0%, #4F46E5 55%, #3B82F6 100%)", ...(props.style ?? {}) }}
      className={
        "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-[14.5px] font-semibold text-white shadow-[0_16px_34px_-14px_rgba(79,70,229,0.65)] transition-all hover:-translate-y-[1px] hover:shadow-[0_20px_40px_-14px_rgba(79,70,229,0.7)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 " +
        (props.className ?? "")
      }
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

export function AuthDivider({ label = "OR" }: { label?: string }) {
  return (
    <div className="my-6 flex items-center gap-3">
      <div className="h-px flex-1" style={{ background: "linear-gradient(90deg,transparent,#E4E4F5)" }} />
      <span className="text-[11px] font-semibold tracking-[0.14em] text-[#A5AEC0]">{label}</span>
      <div className="h-px flex-1" style={{ background: "linear-gradient(90deg,#E4E4F5,transparent)" }} />
    </div>
  );
}

export function GoogleButton({
  loading,
  onClick,
  label = "Continue with Google",
}: {
  loading?: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#E4E4F5] bg-white px-4 py-3 text-[14.5px] font-semibold text-[#0F172A] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-[1px] hover:border-[#CFC7F7] hover:shadow-[0_10px_24px_-14px_rgba(76,29,149,0.35)] disabled:translate-y-0 disabled:opacity-60"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" aria-hidden>
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
      )}
      {label}
    </button>
  );
}
