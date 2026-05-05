import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from "@react-email/components";

interface SubscriptionCanceledProps {
  planName?: string;
  endsOn?: string; // ISO or formatted date
  resubscribeUrl: string;
}

export const SubscriptionCanceledEmail = ({
  planName = "Premium",
  endsOn,
  resubscribeUrl,
}: SubscriptionCanceledProps) => {
  const formatted = endsOn
    ? new Date(endsOn).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : null;
  return (
    <Html>
      <Head />
      <Preview>Sorry to see you go — your PostSpark subscription is canceled</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Sorry to see you go</Heading>
          <Text style={text}>
            Your PostSpark {planName} subscription has been canceled.
            {formatted ? ` You'll keep full access until ${formatted}, after which your account returns to the Free plan.` : " Your account has returned to the Free plan."}
          </Text>
          <Text style={text}>
            Changed your mind? You can resubscribe any time — your content history stays put.
          </Text>
          <Section style={{ textAlign: "center", margin: "32px 0" }}>
            <Button href={resubscribeUrl} style={button}>Resubscribe</Button>
          </Section>
          <Text style={text}>
            If there's anything we could have done better, just hit reply — we read every message.
          </Text>
          <Text style={footer}>— The PostSpark team</Text>
        </Container>
      </Body>
    </Html>
  );
};

export default SubscriptionCanceledEmail;

const main = { backgroundColor: "#ffffff", fontFamily: "Inter, -apple-system, sans-serif" };
const container = { margin: "0 auto", padding: "40px 24px", maxWidth: "560px" };
const h1 = { color: "#1a1a2e", fontSize: "24px", fontWeight: "700" as const, margin: "0 0 24px" };
const text = { color: "#374151", fontSize: "16px", lineHeight: "24px", margin: "0 0 16px" };
const button = { backgroundColor: "#7c3aed", color: "#ffffff", padding: "12px 24px", borderRadius: "8px", textDecoration: "none", fontWeight: "600" as const, display: "inline-block" };
const footer = { color: "#6b7280", fontSize: "14px", lineHeight: "20px", margin: "24px 0 0" };
