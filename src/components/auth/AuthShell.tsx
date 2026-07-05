import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { PostSparkLogo } from "@/components/PostSparkLogo";

/**
 * Premium centered-card auth layout (Ayrshare-inspired).
 * Brand purple gradient backdrop, white card, Geist heading, Inter body.
 * Shared by /login, /signup and /reset-password.
 */
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      {/* Background — brand gradient with soft radial glows */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(1000px 600px at 20% 10%, #A855F7 0%, transparent 55%)," +
            "radial-gradient(900px 700px at 85% 90%, #6D28D9 0%, transparent 55%)," +
            "linear-gradient(135deg, #4C1D95 0%, #6D28D9 55%, #9333EA 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.18]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.7) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          maskImage:
            "radial-gradient(ellipse at 50% 40%, black 20%, transparent 75%)",
        }}
      />

      <div className="relative w-full max-w-md">
        <Link
          to="/"
          className="mb-6 flex items-center justify-center"
          aria-label="PostSpark home"
        >
          <PostSparkLogo variant="wordmark" size={44} tone="light" />
        </Link>

        <div className="rounded-2xl border border-white/60 bg-white p-8 shadow-[0_30px_80px_-20px_rgba(76,29,149,0.55)]">
          <div className="text-center">
            <h1
              className="font-display text-[22px] font-semibold text-[#0F172A]"
              style={{ letterSpacing: "-0.02em" }}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1.5 text-sm text-[#64748B]">
                {altPrompt ? (
                  <>
                    {altPrompt}{" "}
                    {altTo && altLinkText && (
                      <Link
                        to={altTo}
                        className="font-medium text-[#7C3AED] underline-offset-2 hover:underline"
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
          </div>

          <div className="mt-6">{children}</div>
        </div>

        <p className="mt-6 text-center text-xs text-white/70">
          <Link to="/terms" className="hover:text-white hover:underline">
            Terms
          </Link>
          <span className="mx-2 opacity-50">·</span>
          <Link to="/privacy" className="hover:text-white hover:underline">
            Privacy
          </Link>
          <span className="mx-2 opacity-50">·</span>
          <Link to="/" className="hover:text-white hover:underline">
            Home
          </Link>
        </p>
      </div>
    </div>
  );
}

/* ---------- Field primitives ---------- */

export function AuthLabel({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1.5 block text-[13px] font-medium text-[#334155]">
      {children}
    </label>
  );
}

export function AuthInput(
  props: React.InputHTMLAttributes<HTMLInputElement>,
) {
  return (
    <input
      {...props}
      className={
        "block w-full rounded-lg border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] shadow-sm transition-colors focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 " +
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
      className={
        "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#7C3AED] px-4 py-2.5 text-[14px] font-semibold text-white shadow-[0_10px_24px_-10px_rgba(124,58,237,0.65)] transition-all hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-60 " +
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
    <div className="my-5 flex items-center gap-3">
      <div className="h-px flex-1 bg-[#E2E8F0]" />
      <span className="text-[11px] font-medium tracking-wider text-[#94A3B8]">
        {label}
      </span>
      <div className="h-px flex-1 bg-[#E2E8F0]" />
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
      className="flex w-full items-center justify-center gap-3 rounded-lg border border-[#E2E8F0] bg-white px-4 py-2.5 text-[14px] font-medium text-[#0F172A] shadow-sm transition-colors hover:bg-[#F8FAFC] disabled:opacity-60"
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
