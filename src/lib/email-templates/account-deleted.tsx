import {
  Body, Container, Head, Heading, Html, Preview, Text,
} from "@react-email/components";

export const AccountDeletedEmail = () => (
  <Html>
    <Head />
    <Preview>Your PostSpark account has been deleted</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Your account has been deleted</Heading>
        <Text style={text}>
          As requested, your PostSpark account has been deleted and any active subscription has been canceled.
          You will not be charged again.
        </Text>
        <Text style={text}>
          Your generated content and personal information have been removed from our systems.
          If you change your mind, you're welcome to start a new account any time.
        </Text>
        <Text style={text}>
          Thanks for trying PostSpark.
        </Text>
        <Text style={footer}>— The PostSpark team</Text>
      </Container>
    </Body>
  </Html>
);

export default AccountDeletedEmail;

const main = { backgroundColor: "#ffffff", fontFamily: "Inter, -apple-system, sans-serif" };
const container = { margin: "0 auto", padding: "40px 24px", maxWidth: "560px" };
const h1 = { color: "#1a1a2e", fontSize: "24px", fontWeight: "700" as const, margin: "0 0 24px" };
const text = { color: "#374151", fontSize: "16px", lineHeight: "24px", margin: "0 0 16px" };
const footer = { color: "#6b7280", fontSize: "14px", lineHeight: "20px", margin: "24px 0 0" };
