import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from "@react-email/components";

interface WelcomePaidEmailProps {
  planName: string;
  dashboardUrl: string;
  manageBillingUrl?: string;
}

export const WelcomePaidEmail = ({
  planName,
  dashboardUrl,
  manageBillingUrl,
}: WelcomePaidEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to PostSpark {planName} 🎉</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Welcome to PostSpark {planName} 🎉</Heading>
        <Text style={text}>
          Thanks for upgrading! Your account is unlocked and ready to go.
          You now have unlimited content repurposing and access to all premium features.
        </Text>
        <Section style={{ textAlign: "center", margin: "32px 0" }}>
          <Button href={dashboardUrl} style={button}>Open Dashboard</Button>
        </Section>
        <Text style={text}>
          Need anything? Just reply to this email — we read every message.
        </Text>
        {manageBillingUrl ? (
          <Text style={footer}>
            Manage billing anytime from your{" "}
            <a href={manageBillingUrl} style={link}>account settings</a>.
          </Text>
        ) : null}
        <Text style={footer}>— The PostSpark team</Text>
      </Container>
    </Body>
  </Html>
);

export default WelcomePaidEmail;

const main = { backgroundColor: "#f6f6f8", fontFamily: "Inter, -apple-system, sans-serif" };
const container = { margin: "0 auto", padding: "40px 24px", maxWidth: "560px", backgroundColor: "#ffffff", borderRadius: "12px" };
const h1 = { color: "#1a1a2e", fontSize: "24px", fontWeight: "700" as const, margin: "0 0 24px" };
const text = { color: "#374151", fontSize: "16px", lineHeight: "24px", margin: "0 0 16px" };
const button = { backgroundColor: "#7c3aed", color: "#ffffff", padding: "12px 24px", borderRadius: "8px", textDecoration: "none", fontWeight: "600" as const, display: "inline-block" };
const footer = { color: "#6b7280", fontSize: "14px", lineHeight: "20px", margin: "16px 0 0" };
const link = { color: "#7c3aed", textDecoration: "underline" };
