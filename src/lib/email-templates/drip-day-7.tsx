import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";
import { BrandHeader, BrandFooter } from "./_brand-header";
import { main, container, h1, text, button, card } from "./_drip-styles";

interface Props { firstName?: string; spotsLeft?: number; pricingUrl?: string }

const Email = ({ firstName, spotsLeft = 50, pricingUrl = "https://postspark.co/pricing" }: Props) => (
  <Html lang="en">
    <Head />
    <Preview>Lifetime access to PostSpark Pro — $97 one-time (limited)</Preview>
    <Body style={main}>
      <Container style={container}>
        <BrandHeader />
        <Heading style={h1}>{firstName ? `${firstName}, want lifetime Pro for $97?` : "Lifetime PostSpark Pro for $97"}</Heading>
        <Text style={text}>We're capping our Founding Member deal at 50 lifetime seats. <strong>{spotsLeft} spots left.</strong></Text>
        <Text style={card}><strong>What you get (forever):</strong><br/>✓ Unlimited repurposes — no monthly cap<br/>✓ Brand Voice, all image models, no watermark<br/>✓ Every Pro feature we ship, free for life<br/>✓ Direct line to the founder</Text>
        <Text style={text}>One payment. No renewals. You'd recover the $97 by month 5 of Pro.</Text>
        <Section style={{ textAlign: "center", margin: "28px 0" }}>
          <Button href={pricingUrl} style={button}>Claim my lifetime spot →</Button>
        </Section>
        <Text style={text}>Once the 50 seats are gone, the offer is gone for good.</Text>
        <BrandFooter />
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: Email,
  subject: "Lifetime PostSpark Pro — $97 (limited to 50)",
  displayName: "Drip · Day 7 (Founding offer)",
  previewData: { firstName: "Alex", spotsLeft: 38 },
} satisfies TemplateEntry;
