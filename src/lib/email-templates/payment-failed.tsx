import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from "@react-email/components";

interface PaymentFailedProps {
  planName?: string;
  manageBillingUrl: string;
}

export const PaymentFailedEmail = ({ planName = "Premium", manageBillingUrl }: PaymentFailedProps) => (
  <Html>
    <Head />
    <Preview>Action needed: your PostSpark payment failed</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Your card was declined</Heading>
        <Text style={text}>
          We couldn't charge your card for your PostSpark {planName} subscription.
          Paddle will retry automatically over the next few days, but to avoid losing access
          please update your payment method now.
        </Text>
        <Section style={{ textAlign: "center", margin: "32px 0" }}>
          <Button href={manageBillingUrl} style={button}>Update payment method</Button>
        </Section>
        <Text style={text}>
          If you've already fixed it, you can ignore this message — the next retry will succeed.
        </Text>
        <Text style={footer}>— The PostSpark team</Text>
      </Container>
    </Body>
  </Html>
);

export default PaymentFailedEmail;

const main = { backgroundColor: "#ffffff", fontFamily: "Inter, -apple-system, sans-serif" };
const container = { margin: "0 auto", padding: "40px 24px", maxWidth: "560px" };
const h1 = { color: "#1a1a2e", fontSize: "24px", fontWeight: "700" as const, margin: "0 0 24px" };
const text = { color: "#374151", fontSize: "16px", lineHeight: "24px", margin: "0 0 16px" };
const button = { backgroundColor: "#7c3aed", color: "#ffffff", padding: "12px 24px", borderRadius: "8px", textDecoration: "none", fontWeight: "600" as const, display: "inline-block" };
const footer = { color: "#6b7280", fontSize: "14px", lineHeight: "20px", margin: "24px 0 0" };
