import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";
import { BrandHeader, BrandFooter } from "./_brand-header";
import { main, container, h1, h2, text, button, card } from "./_drip-styles";

interface Props { firstName?: string; pricingUrl?: string }

const Email = ({ firstName, pricingUrl = "https://postspark.co/pricing" }: Props) => (
  <Html lang="en">
    <Head />
    <Preview>Make AI sound like you, not like AI</Preview>
    <Body style={main}>
      <Container style={container}>
        <BrandHeader />
        <Heading style={h1}>{firstName ? `${firstName}, your AI doesn't sound like you yet` : "Your AI doesn't sound like you yet"}</Heading>
        <Text style={text}>Every Pro user told us the same thing: generic AI output is the #1 reason content doesn't land.</Text>
        <Text style={text}>That's why Pro includes <strong>Brand Voice</strong> — paste 3–5 of your real posts, and PostSpark trains a custom voice profile that's automatically applied to every generation.</Text>

        <Heading as="h2" style={h2}>What changes with Brand Voice:</Heading>
        <Text style={card}>✓ Same vocabulary, rhythm and slang you actually use<br/>✓ Your sentence length, your punctuation quirks<br/>✓ Zero "As an AI…" energy</Text>

        <Section style={{ textAlign: "center", margin: "28px 0" }}>
          <Button href={pricingUrl} style={button}>Unlock Brand Voice — $24/mo</Button>
        </Section>
        <Text style={text}>(Or grab the $97 lifetime deal while founding spots are open — see your dashboard.)</Text>
        <BrandFooter />
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: Email,
  subject: "Make AI sound like you — not like AI",
  displayName: "Drip · Day 5 (Brand Voice)",
  previewData: { firstName: "Alex" },
} satisfies TemplateEntry;
