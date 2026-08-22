import { useEffect } from "react";

/**
 * Reveals every `.fade-in-up` inside the page as it scrolls into view.
 * Pass a `dep` that changes when new content mounts (async lists) so the
 * freshly rendered elements get observed too.
 */
export function useFadeIn(dep?: unknown) {
  useEffect(() => {
    const els = Array.from(
      document.querySelectorAll<HTMLElement>(".lp4 .fade-in-up:not(.visible)"),
    );

    if (!els.length) return;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            observer.unobserve(e.target);
          }
        }),
      { threshold: 0.12 },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [dep]);
}

export function delay(ms: number) {
  return { transitionDelay: `${ms}ms` } as const;
}

export function BoltMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <defs>
        <linearGradient id="lp4bolt" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1400E6" />
          <stop offset="50%" stopColor="#7A0BC0" />
          <stop offset="100%" stopColor="#E60012" />
        </linearGradient>
      </defs>
      <path
        d="M10.5 2 20 14h-6l1.5 8L4 9.5h6.8L10.5 2z"
        fill="url(#lp4bolt)"
        stroke="url(#lp4bolt)"
        strokeWidth={1.4}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Wordmark({ dark = false, size = 20 }: { dark?: boolean; size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <BoltMark size={size + 8} />
      <span style={{ fontSize: size, fontWeight: 700, letterSpacing: "-0.02em" }}>
        <span style={{ color: dark ? "#FFFFFF" : "#0F0F1A" }}>Post</span>
        <span
          style={{
            background: "linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Spark
        </span>
      </span>
    </span>
  );
}

export type Social = { name: string; bg: string; path: string };

export const SOCIALS: Social[] = [
  {
    name: "LinkedIn",
    bg: "#0A66C2",
    path: "M6.94 5.5a1.94 1.94 0 1 1-3.88 0 1.94 1.94 0 0 1 3.88 0ZM3.3 8.1h3.4V20H3.3V8.1Zm5.6 0h3.26v1.63h.05c.45-.86 1.56-1.77 3.21-1.77 3.43 0 4.06 2.26 4.06 5.2V20h-3.4v-5.5c0-1.31-.02-3-1.82-3-1.83 0-2.11 1.43-2.11 2.9V20H8.9V8.1Z",
  },
  { name: "X", bg: "#000000", path: "M17.3 3h3.2l-7 8 7.2 10h-5.2l-4.1-5.8L6.4 21H3.2l7.4-8.4L3.7 3H9l3.8 5.4L17.3 3Z" },
  {
    name: "Instagram",
    bg: "linear-gradient(135deg, #E1306C, #F77737)",
    path: "M12 7.4A4.6 4.6 0 1 0 16.6 12A4.6 4.6 0 0 0 12 7.4Zm0 7.6A3 3 0 1 1 15 12a3 3 0 0 1-3 3Zm7-9.9a1.1 1.1 0 1 1-1.1-1.1A1.1 1.1 0 0 1 19 5.1ZM12 4.4c2.2 0 2.5 0 3.4.05 1 .05 1.6.2 2 .4.5.2.8.4 1.2.8s.6.7.8 1.2c.15.4.3 1 .35 2 .05.9.05 1.2.05 3.4s0 2.5-.05 3.4c-.05 1-.2 1.6-.35 2a3.4 3.4 0 0 1-.8 1.2 3.4 3.4 0 0 1-1.2.8c-.4.15-1 .3-2 .35-.9.05-1.2.05-3.4.05s-2.5 0-3.4-.05c-1-.05-1.6-.2-2-.35a3.4 3.4 0 0 1-1.2-.8 3.4 3.4 0 0 1-.8-1.2c-.15-.4-.3-1-.35-2C4.4 14.5 4.4 14.2 4.4 12s0-2.5.05-3.4c.05-1 .2-1.6.35-2 .2-.5.4-.8.8-1.2s.7-.6 1.2-.8c.4-.2 1-.35 2-.4.9-.05 1.2-.05 3.4-.05Z",
  },
  {
    name: "TikTok",
    bg: "#010101",
    path: "M16.6 3h-2.7v11.3a2.4 2.4 0 1 1-2.4-2.4c.2 0 .4 0 .6.07V9.2a5.2 5.2 0 1 0 4.5 5.1V8.1a5 5 0 0 0 3.1 1V6.4a3.4 3.4 0 0 1-3.1-3.4Z",
  },
  {
    name: "YouTube",
    bg: "#FF0000",
    path: "M21.2 8.1a2.6 2.6 0 0 0-1.8-1.8C17.8 5.9 12 5.9 12 5.9s-5.8 0-7.4.4A2.6 2.6 0 0 0 2.8 8.1 27 27 0 0 0 2.4 12a27 27 0 0 0 .4 3.9 2.6 2.6 0 0 0 1.8 1.8c1.6.4 7.4.4 7.4.4s5.8 0 7.4-.4a2.6 2.6 0 0 0 1.8-1.8 27 27 0 0 0 .4-3.9 27 27 0 0 0-.4-3.9ZM10.2 14.7V9.3l4.7 2.7-4.7 2.7Z",
  },
  {
    name: "Facebook",
    bg: "#1877F2",
    path: "M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.25-1.5 1.5-1.5h1.6V4.4c-.3 0-1.3-.1-2.4-.1-2.4 0-4.1 1.5-4.1 4.2v2h-2.6v3h2.6V21h3.4Z",
  },
  {
    name: "Threads",
    bg: "#000000",
    path: "M12.2 21c-2.8 0-5-.9-6.5-2.7C4.4 16.7 3.7 14.6 3.7 12s.7-4.7 2-6.3C7.2 3.9 9.4 3 12.2 3c2 0 3.7.5 5 1.4a6.6 6.6 0 0 1 2.4 3.2l-2 .7a4.6 4.6 0 0 0-1.7-2.2c-.9-.6-2.1-1-3.7-1-2.2 0-3.8.7-4.9 2C6.3 8.4 5.8 10 5.8 12s.5 3.6 1.5 4.9c1.1 1.3 2.7 2 4.9 2 2 0 3.4-.5 4.3-1.4.8-.8 1.2-1.7 1.2-2.5 0-1-.4-1.8-1.2-2.4-.3-.2-.6-.4-1-.6-.2 1.5-.7 2.6-1.5 3.3-.8.8-1.9 1.1-3.1 1.1-1.1 0-2-.3-2.7-.9a3 3 0 0 1-1-2.4c0-1 .4-1.9 1.3-2.5.8-.6 2-.9 3.4-.9.8 0 1.5 0 2.2.2 0-.7-.3-1.3-.7-1.7-.4-.4-1-.6-1.8-.6-1.1 0-1.9.4-2.4 1.3l-1.7-1c.9-1.5 2.3-2.2 4.1-2.2 1.4 0 2.5.4 3.3 1.3.7.8 1.1 1.9 1.2 3.2 2.1.9 3.2 2.5 3.2 4.6 0 1.5-.6 2.9-1.8 4C16.6 20.4 14.7 21 12.2 21Zm-.4-8.4c-.9 0-1.6.2-2 .5-.4.3-.6.7-.6 1.1 0 .4.2.8.5 1 .3.3.8.4 1.3.4.8 0 1.4-.2 1.8-.7.4-.5.7-1.3.8-2.2-.6-.1-1.2-.2-1.8-.1Z",
  },
];

export function SocialCircle({ s, size = 36 }: { s: Social; size?: number }) {
  return (
    <span
      title={s.name}
      className="inline-flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, background: s.bg }}
    >
      <svg width={size / 2} height={size / 2} viewBox="0 0 24 24" fill="#fff" aria-hidden>
        <path d={s.path} />
      </svg>
    </span>
  );
}

export const AI_BADGES = [
  { name: "Claude", color: "#D97757" },
  { name: "GPT-4o", color: "#10A37F" },
  { name: "Gemini", color: "#4285F4" },
  { name: "ElevenLabs", color: "#111111" },
  { name: "Flux Pro", color: "#FF6B35" },
];

export function AiBadge({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border bg-white px-3 py-1"
      style={{ borderColor: "#E5E7EB", fontSize: 12, fontWeight: 600, color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {name}
    </span>
  );
}
