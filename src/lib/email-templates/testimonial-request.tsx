import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";
import { BrandHeader, BrandFooter } from "./_brand-header";
import { main, container, h1, text, button, card } from "./_drip-styles";

interface Props { firstName?: string; replyEmail?: string }

const Email = ({ firstName, replyEmail = "hello@postspark.co" }: Props) => (
  <Html lang="en">
    <Head />
    <Preview>Get 2 months of PostSpark Pro free — here's how</Preview>
    <Body style={main}>
      <Container style={container}>
        <BrandHeader />
        <Heading style={h1}>{firstName ? `${firstName}, want 2 months of Pro on us?` : "Want 2 months of Pro on us?"}</Heading>
        <Text style={text}>I'm the founder of PostSpark. We're growing the way we want to grow — by hearing from real users.</Text>
        <Text style={text}>If you've used PostSpark even a few times, I'd love to trade you <strong>2 months of Pro (free)</strong> for a 60-second video or written testimonial about your experience.</Text>

        <Text style={card}><strong>What I need:</strong><br/>• Your name + handle (Twitter/LinkedIn)<br/>• 1–3 sentences (or 30–60 sec video) about how PostSpark helps you<br/>• Permission to feature it on the site</Text>

        <Text style={text}><strong>What you get:</strong> 2 months of Pro unlocked immediately, your name & link on the homepage, and a tiny piece of the PostSpark story.</Text>

        <Section style={{ textAlign: "center", margin: "28px 0" }}>
          <Button href={`mailto:${replyEmail}?subject=PostSpark testimonial`} style={button}>Reply: "I'm in"</Button>
        </Section>
        <Text style={text}>Just hit reply with your testimonial — I'll flip your account to Pro the same day.</Text>
        <Text style={text}>— Founder, PostSpark</Text>
        <BrandFooter />
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: Email,
  subject: "Want 2 months of PostSpark Pro free? (60-sec ask)",
  displayName: "Campaign · Testimonial request",
  previewData: { firstName: "Alex" },
} satisfies TemplateEntry;
