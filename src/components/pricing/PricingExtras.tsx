import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Minus, Crown, Clock, Wallet, Rocket } from "lucide-react";
import { delay } from "@/components/landing/v4/parts";
import { getFoundingSpots } from "@/lib/founding.functions";
import {
  PRICE_LIFETIME,
  PRICE_PRO_MONTHLY,
  PRICE_AGENCY_MONTHLY,
} from "@/lib/pricing";

/* ---------------------------------- Lifetime --------------------------------- */

export function Lp4Lifetime() {
  const [spots, setSpots] = useState<{ total: number; claimed: number; remaining: number } | null>(null);

  useEffect(() => {
    getFoundingSpots()
      .then((s: any) => setSpots(s))
      .catch(() => setSpots(null));
  }, []);

  const total = spots?.total ?? 50;
  const claimed = spots?.claimed ?? 0;
  const remaining = spots?.remaining ?? total;
  const pct = Math.min(100, Math.round((claimed / total) * 100));

  return (
    <section className="px-6 py-14 sm:py-20" style={{ background: "#FFFFFF" }}>
      <div className="mx-auto max-w-[1000px]">
        <div
          className="fade-in-up relative overflow-hidden rounded-[24px] px-7 py-9 sm:px-12 sm:py-12"
          style={{
            background: "linear-gradient(135deg,#150A33 0%,#2A1259 55%,#3B1D74 100%)",
            border: "1px solid rgba(167,139,250,0.35)",
            boxShadow: "0 30px 80px rgba(124,58,237,0.28)",
          }}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute rounded-full"
            style={{ width: 340, height: 340, top: -120, right: -80, background: "#7C3AED", opacity: 0.45, filter: "blur(90px)" }}
          />
          <div className="relative grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <span
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
                style={{ background: "rgba(201,168,124,0.16)", border: "1px solid rgba(201,168,124,0.4)", color: "#E7C893", fontSize: 11, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase" }}
              >
                <Crown className="h-3.5 w-3.5" /> Founding lifetime
              </span>
              <h2
                className="mt-4"
                style={{ fontSize: "clamp(26px,3.4vw,40px)", fontWeight: 800, letterSpacing: "-0.02em", color: "#FFFFFF", lineHeight: 1.12 }}
              >
                Pay once. Keep Pro forever.
              </h2>
              <p className="mt-3 max-w-[46ch]" style={{ fontSize: 15, lineHeight: 1.7, color: "rgba(255,255,255,0.72)" }}>
                A one-time ${PRICE_LIFETIME} unlocks every Pro feature for life — unlimited generations, all 9 Studios,
                Brand Kit + Brand Voice and direct publishing to 9 platforms. Capped at {total} founders, then it's gone.
              </p>
              <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                {[
                  "Unlimited generations, forever",
                  "All future Pro features included",
                  "Founder badge + private roadmap",
                  "No renewals, no price increases",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2" style={{ fontSize: 14, color: "rgba(255,255,255,0.86)" }}>
                    <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#A78BFA" }} /> {f}
                  </li>
                ))}
              </ul>
            </div>

            <div
              className="rounded-[20px] p-6"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)", backdropFilter: "blur(14px)" }}
            >
              <div className="flex items-end gap-2">
                <span style={{ fontSize: 46, fontWeight: 800, letterSpacing: "-0.03em", color: "#FFFFFF", lineHeight: 1 }}>
                  ${PRICE_LIFETIME}
                </span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", paddingBottom: 6 }}>one-time</span>
              </div>
              <p className="mt-1" style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
                vs ${PRICE_PRO_MONTHLY}/mo — pays for itself in 5 months
              </p>

              <div className="mt-5">
                <div className="flex items-center justify-between" style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", color: "rgba(255,255,255,0.65)", textTransform: "uppercase" }}>
                  <span>{claimed} claimed</span>
                  <span>{remaining} left</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.14)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.max(4, pct)}%`, background: "linear-gradient(90deg,#C9A87C,#A78BFA)" }}
                  />
                </div>
              </div>

              <Link
                to="/signup"
                className="mt-6 inline-flex w-full items-center justify-center rounded-[10px] px-5 py-3"
                style={{ background: "linear-gradient(135deg,#C9A87C 0%,#A78BFA 100%)", color: "#180C33", fontSize: 15, fontWeight: 800, boxShadow: "0 10px 30px rgba(201,168,124,0.35)" }}
              >
                Claim a founding seat
              </Link>
              <p className="mt-3 text-center" style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                14-day refund · Secure payments by Paddle
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------ ROI ----------------------------------- */

const ROI = [
  { icon: Clock, stat: "11 hrs", label: "Saved every week", note: "One idea becomes 30+ posts in minutes instead of days." },
  { icon: Wallet, stat: "$2,400", label: "Cheaper than a freelancer", note: `A content freelancer runs $2,000+/mo. Pro is $${PRICE_PRO_MONTHLY}.` },
  { icon: Rocket, stat: "9x", label: "More output per idea", note: "Every source becomes posts, carousels, scripts and blogs." },
];

export function Lp4Roi() {
  return (
    <section className="px-6 py-14 sm:py-20" style={{ background: "#FAFAFA" }}>
      <div className="mx-auto max-w-[1100px]">
        <div className="text-center">
          <p className="lp4-label fade-in-up">The math</p>
          <h2
            className="fade-in-up mt-3"
            style={{ fontSize: "clamp(28px,4.4vw,44px)", fontWeight: 800, letterSpacing: "-0.02em", color: "#0F0F1A", ...delay(80) }}
          >
            Cheaper than one freelance post.
          </h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {ROI.map((r, i) => (
            <div key={r.label} className="lp4-card fade-in-up p-7" style={delay(120 + i * 90)}>
              <span
                className="inline-grid h-11 w-11 place-items-center rounded-[14px]"
                style={{ background: "#F5F3FF", color: "#7C3AED" }}
              >
                <r.icon className="h-5 w-5" />
              </span>
              <p className="mt-4" style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.03em", color: "#0F0F1A" }}>
                {r.stat}
              </p>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#7C3AED" }}>{r.label}</p>
              <p className="mt-2" style={{ fontSize: 14, lineHeight: 1.6, color: "#6B7280" }}>
                {r.note}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- Compare matrix ---------------------------- */

type Cell = string | boolean;
const GROUPS: { group: string; rows: { label: string; free: Cell; pro: Cell; agency: Cell }[] }[] = [
  {
    group: "Create",
    rows: [
      { label: "Content generations / month", free: "3", pro: "Unlimited", agency: "Unlimited" },
      { label: "Studios included", free: "3", pro: "All 9", agency: "All 9" },
      { label: "AI image models", free: false, pro: "3 models", agency: "3 models" },
      { label: "Shorts Studio + voiceover", free: false, pro: true, agency: true },
      { label: "SEO Blog + Hook Lab", free: "Limited", pro: true, agency: true },
    ],
  },
  {
    group: "Publish",
    rows: [
      { label: "Publishing platforms", free: "3", pro: "9", agency: "9" },
      { label: "Direct publishing & scheduling", free: false, pro: true, agency: true },
      { label: "Content calendar", free: false, pro: true, agency: true },
      { label: "Analytics dashboard", free: false, pro: true, agency: "Agency analytics" },
    ],
  },
  {
    group: "Brand",
    rows: [
      { label: "Brand profiles", free: "1", pro: "3", agency: "Unlimited" },
      { label: "Brand Kit + Brand Voice", free: false, pro: true, agency: "Multi-brand" },
      { label: "Watermark & logo vault", free: false, pro: true, agency: true },
      { label: "White-label output", free: false, pro: false, agency: true },
    ],
  },
  {
    group: "Team & support",
    rows: [
      { label: "Team seats", free: "1", pro: "1", agency: "5" },
      { label: "Client workspaces & approvals", free: false, pro: false, agency: true },
      { label: "Support", free: "Community", pro: "Priority", agency: "Priority + onboarding" },
    ],
  },
];

function CellView({ v, accent }: { v: Cell; accent?: boolean }) {
  if (v === true)
    return <Check className="h-[18px] w-[18px]" style={{ color: accent ? "#7C3AED" : "#10B981" }} />;
  if (v === false) return <Minus className="h-4 w-4" style={{ color: "#D1D5DB" }} />;
  return (
    <span style={{ fontSize: 14, fontWeight: accent ? 700 : 500, color: accent ? "#7C3AED" : "#4B5563" }}>{v}</span>
  );
}

export function Lp4CompareMatrix() {
  return (
    <section className="px-6 py-14 sm:py-20" style={{ background: "#FFFFFF" }}>
      <div className="mx-auto max-w-[1000px]">
        <div className="text-center">
          <p className="lp4-label fade-in-up">Compare</p>
          <h2
            className="fade-in-up mt-3"
            style={{ fontSize: "clamp(28px,4.4vw,44px)", fontWeight: 800, letterSpacing: "-0.02em", color: "#0F0F1A", ...delay(80) }}
          >
            Everything, side by side.
          </h2>
        </div>

        {/* desktop table */}
        <div className="fade-in-up mt-10 hidden overflow-hidden rounded-[20px] sm:block" style={{ border: "1px solid var(--lp-border)", boxShadow: "var(--lp-card-shadow)", ...delay(140) }}>
          <table className="w-full border-collapse text-left">
            <thead>
              <tr style={{ background: "#F9FAFB", position: "sticky", top: 64, zIndex: 2 }}>
                {["Feature", "Free", `Pro · $${PRICE_PRO_MONTHLY}/mo`, `Agency · $${PRICE_AGENCY_MONTHLY}/mo`].map((h, i) => (
                  <th
                    key={h}
                    className="px-5 py-4"
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      letterSpacing: ".06em",
                      textTransform: "uppercase",
                      color: i === 2 ? "#7C3AED" : "#6B7280",
                      borderBottom: "1px solid var(--lp-border)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GROUPS.map((g) => (
                <>
                  <tr key={g.group} style={{ background: "#FCFBFF" }}>
                    <td
                      colSpan={4}
                      className="px-5 py-2.5"
                      style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", color: "#7C3AED", borderBottom: "1px solid var(--lp-border)" }}
                    >
                      {g.group}
                    </td>
                  </tr>
                  {g.rows.map((r) => (
                    <tr key={r.label}>
                      <td className="px-5 py-3.5" style={{ fontSize: 14, fontWeight: 600, color: "#1F2937", borderBottom: "1px solid #F3F4F6" }}>
                        {r.label}
                      </td>
                      <td className="px-5 py-3.5" style={{ borderBottom: "1px solid #F3F4F6" }}>
                        <CellView v={r.free} />
                      </td>
                      <td className="px-5 py-3.5" style={{ borderBottom: "1px solid #F3F4F6", background: "rgba(124,58,237,0.03)" }}>
                        <CellView v={r.pro} accent />
                      </td>
                      <td className="px-5 py-3.5" style={{ borderBottom: "1px solid #F3F4F6" }}>
                        <CellView v={r.agency} />
                      </td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* mobile: stacked per-plan cards */}
        <div className="mt-8 grid gap-4 sm:hidden">
          {(["free", "pro", "agency"] as const).map((planKey) => (
            <div key={planKey} className="lp4-card fade-in-up p-5">
              <p style={{ fontSize: 13, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: planKey === "pro" ? "#7C3AED" : "#6B7280" }}>
                {planKey === "free" ? "Free" : planKey === "pro" ? `Pro · $${PRICE_PRO_MONTHLY}/mo` : `Agency · $${PRICE_AGENCY_MONTHLY}/mo`}
              </p>
              <div className="mt-3 grid gap-2.5">
                {GROUPS.flatMap((g) => g.rows).map((r) => (
                  <div key={r.label} className="flex items-center justify-between gap-3">
                    <span style={{ fontSize: 13, color: "#4B5563" }}>{r.label}</span>
                    <CellView v={r[planKey]} accent={planKey === "pro"} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- Billing FAQ -------------------------------- */

export const BILLING_FAQ = [
  {
    q: "Is there a free trial on paid plans?",
    a: "Yes — Pro and Agency both start with a 7-day free trial. You get full access immediately and can cancel inside the trial without being charged.",
  },
  {
    q: "What happens if I cancel?",
    a: "You keep full access until the end of your current billing period, then the account drops back to the Free plan. Nothing you created is deleted.",
  },
  {
    q: "Can I switch between monthly and annual?",
    a: "Any time from Billing in your dashboard. Annual saves roughly 20% and the change is prorated automatically.",
  },
  {
    q: "How do Agency seats work?",
    a: "Agency includes 5 team seats plus multi-brand workspaces, client approvals and Agency Analytics. Invite teammates from Settings — each seat gets its own login.",
  },
  {
    q: "Do you offer refunds?",
    a: "Yes. If PostSpark isn't a fit, email us within 14 days of a charge and we'll refund it — including the Founding Lifetime deal.",
  },
];
