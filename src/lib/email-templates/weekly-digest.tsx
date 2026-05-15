import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface WeeklyDigestProps {
  firstName?: string;
  scheduledCount?: number;
  topPosts?: Array<{ title: string; platform?: string }>;
  drafts?: Array<{ title: string; platform: string; scheduledFor: string }>;
  dashboardUrl?: string;
  calendarUrl?: string;
  streak?: number;
}

const SITE_NAME = "PostSpark";

const WeeklyDigestEmail = ({
  firstName,
  scheduledCount = 0,
  topPosts = [],
  drafts = [],
  dashboardUrl = "https://postspark.co/dashboard",
  calendarUrl = "https://postspark.co/dashboard/calendar",
  streak = 0,
}: WeeklyDigestProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your weekly content digest from {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>
          {firstName ? `Hey ${firstName}, here's your week in content` : "Your week in content"}
        </Heading>
        <Text style={text}>
          {streak > 0
            ? `🔥 You're on a ${streak}-day streak. Keep the momentum going!`
            : `Here's a quick snapshot of what's queued up and what's worth reviewing.`}
        </Text>

        <Section style={statsBox}>
          <Text style={statBig}>{scheduledCount}</Text>
          <Text style={statSmall}>posts scheduled this week</Text>
        </Section>

        {drafts.length > 0 && (
          <>
            <Heading as="h2" style={h2}>📅 Drafts ready to review</Heading>
            {drafts.slice(0, 5).map((d, i) => (
              <Text key={i} style={item}>
                <strong style={{ color: "#1a1a2e" }}>{d.platform}</strong> · {d.title}
                <span style={meta}> — {new Date(d.scheduledFor).toLocaleDateString()}</span>
              </Text>
            ))}
            <Section style={{ textAlign: "center", margin: "24px 0" }}>
              <Button href={calendarUrl} style={button}>Open Calendar</Button>
            </Section>
          </>
        )}

        {topPosts.length > 0 && (
          <>
            <Heading as="h2" style={h2}>✨ Recent generations</Heading>
            {topPosts.slice(0, 5).map((p, i) => (
              <Text key={i} style={item}>
                {p.platform ? <strong style={{ color: "#1a1a2e" }}>{p.platform} · </strong> : null}
                {p.title}
              </Text>
            ))}
          </>
        )}

        <Section style={{ textAlign: "center", margin: "32px 0 16px" }}>
          <Button href={dashboardUrl} style={buttonOutline}>Open Dashboard</Button>
        </Section>

        <Text style={footer}>
          You're receiving this because you opted in to weekly digests. You can turn them off any time in Settings.
        </Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: WeeklyDigestEmail,
  subject: "Your weekly PostSpark digest",
  displayName: "Weekly digest",
  previewData: {
    firstName: "Alex",
    scheduledCount: 5,
    streak: 7,
    drafts: [
      { title: "5 lessons from launching v2", platform: "linkedin", scheduledFor: new Date().toISOString() },
      { title: "How we got our first 100 users", platform: "twitter", scheduledFor: new Date(Date.now() + 86400000).toISOString() },
    ],
    topPosts: [
      { title: "The hook formula that always works", platform: "twitter" },
      { title: "Why micro-content beats macro", platform: "linkedin" },
    ],
    dashboardUrl: "https://postspark.co/dashboard",
    calendarUrl: "https://postspark.co/dashboard/calendar",
  },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "Inter, -apple-system, sans-serif" };
const container = { margin: "0 auto", padding: "40px 24px", maxWidth: "560px" };
const h1 = { color: "#1a1a2e", fontSize: "24px", fontWeight: "700" as const, margin: "0 0 16px" };
const h2 = { color: "#1a1a2e", fontSize: "16px", fontWeight: "700" as const, margin: "28px 0 8px" };
const text = { color: "#374151", fontSize: "15px", lineHeight: "22px", margin: "0 0 16px" };
const item = { color: "#374151", fontSize: "14px", lineHeight: "20px", margin: "0 0 8px", padding: "10px 12px", background: "#faf8ff", borderLeft: "3px solid #7c3aed", borderRadius: "4px" };
const meta = { color: "#9ca3af", fontSize: "12px" };
const statsBox = { background: "#f5f3ff", borderRadius: "10px", padding: "20px", textAlign: "center" as const, margin: "16px 0 24px" };
const statBig = { color: "#7c3aed", fontSize: "32px", fontWeight: "800" as const, margin: 0 };
const statSmall = { color: "#6b7280", fontSize: "13px", margin: "4px 0 0" };
const button = { backgroundColor: "#7c3aed", color: "#ffffff", padding: "12px 24px", borderRadius: "8px", textDecoration: "none", fontWeight: "600" as const, display: "inline-block" };
const buttonOutline = { backgroundColor: "transparent", color: "#7c3aed", padding: "10px 20px", borderRadius: "8px", textDecoration: "none", fontWeight: "600" as const, display: "inline-block", border: "1.5px solid #7c3aed" };
const footer = { color: "#9ca3af", fontSize: "12px", lineHeight: "18px", margin: "24px 0 0", textAlign: "center" as const };
