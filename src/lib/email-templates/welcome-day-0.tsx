import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";
import { BrandHeader, BrandFooter } from "./_brand-header";
import { main, container, h1, h2, text, button, buttonOutline, card } from "./_drip-styles";

interface Props { firstName?: string; dashboardUrl?: string }

const Email = ({ firstName, dashboardUrl = "https://postspark.co/dashboard/repurpose" }: Props) => (
  <Html lang="en">
    <Head />
    <Preview>Welcome to PostSpark — your first repurpose in 60 seconds</Preview>
    <Body style={main}>
      <Container style={container}>
        <BrandHeader />
        <Heading style={h1}>{firstName ? `Welcome, ${firstName}!` : "Welcome to PostSpark!"}</Heading>
        <Text style={text}>You're in. PostSpark turns one piece of content into 30+ posts across every platform — in under 60 seconds.</Text>
        <Heading as="h2" style={h2}>Try it right now (60 sec):</Heading>
        <Text style={card}>1. Paste a blog post, video URL, or any idea<br/>2. Pick the platforms you publish on<br/>3. Hit Generate. Done.</Text>
        <Section style={{ textAlign: "center", margin: "24px 0" }}>
          <Button href={dashboardUrl} style={button}>Create my first repurpose →</Button>
        </Section>
        <Text style={text}>Reply to this email if you get stuck — I read every message.</Text>
        <Text style={text}>— Founder, PostSpark</Text>
        <BrandFooter />
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: Email,
  subject: "Your first repurpose in 60 seconds ⚡",
  displayName: "Drip · Day 0 (Welcome)",
  previewData: { firstName: "Alex" },
} satisfies TemplateEntry;
