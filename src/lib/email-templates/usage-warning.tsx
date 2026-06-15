import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";
import { BrandHeader, BrandFooter } from "./_brand-header";
import { main, container, h1, text, button, card } from "./_drip-styles";

interface Props { firstName?: string; used?: number; limit?: number; pricingUrl?: string }

const Email = ({ firstName, used = 2, limit = 3, pricingUrl = "https://postspark.co/pricing" }: Props) => (
  <Html lang="en">
    <Head />
    <Preview>{`You've used ${used} of ${limit} free repurposes this month`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <BrandHeader />
        <Heading style={h1}>{firstName ? `${firstName}, you're almost out` : "You're almost out of free credits"}</Heading>
        <Text style={text}>You've used <strong>{used} of {limit}</strong> free repurposes this month. One more, then you'll need to wait until next month — or upgrade.</Text>
        <Text style={card}><strong>Pro unlocks:</strong><br/>✓ Unlimited repurposes<br/>✓ Brand Voice (sound like you)<br/>✓ All image models, no watermark<br/>✓ Scheduled publishing</Text>
        <Section style={{ textAlign: "center", margin: "28px 0" }}>
          <Button href={pricingUrl} style={button}>Upgrade — $24/mo</Button>
        </Section>
        <Text style={text}>Or grab the $97 lifetime deal while founding spots last.</Text>
        <BrandFooter />
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: Email,
  subject: (d: any) => `You've used ${d?.used ?? 2} of ${d?.limit ?? 3} free repurposes`,
  displayName: "Usage warning (2/3 used)",
  previewData: { firstName: "Alex", used: 2, limit: 3 },
} satisfies TemplateEntry;
