import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";
import { BrandHeader, BrandFooter } from "./_brand-header";
import { main, container, h1, h2, text, button, card } from "./_drip-styles";

interface Props { firstName?: string; dashboardUrl?: string }

const Email = ({ firstName, dashboardUrl = "https://postspark.co/dashboard" }: Props) => (
  <Html lang="en">
    <Head />
    <Preview>3 things creators do with PostSpark every week</Preview>
    <Body style={main}>
      <Container style={container}>
        <BrandHeader />
        <Heading style={h1}>{firstName ? `${firstName}, here's what other creators do with PostSpark` : "3 ways creators use PostSpark"}</Heading>
        <Text style={text}>You signed up 2 days ago. Here's how others are saving 6+ hours a week:</Text>

        <Heading as="h2" style={h2}>1. Turn one YouTube video into a week of posts</Heading>
        <Text style={card}>Paste a YouTube URL → get a LinkedIn carousel, a Twitter thread, an Instagram caption, and 3 short-form scripts. One source, seven posts.</Text>

        <Heading as="h2" style={h2}>2. Repurpose a podcast episode into a newsletter</Heading>
        <Text style={card}>Drop the transcript, choose "Newsletter" + "LinkedIn post" + "Tweets" — done in 90 seconds.</Text>

        <Heading as="h2" style={h2}>3. Recycle your best content with a fresh angle</Heading>
        <Text style={card}>Paste an old top post, regenerate with a new hook and tone. Get 5x the reach from content you already wrote.</Text>

        <Section style={{ textAlign: "center", margin: "28px 0" }}>
          <Button href={dashboardUrl} style={button}>Try one of these →</Button>
        </Section>
        <BrandFooter />
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: Email,
  subject: "3 ways creators are using PostSpark this week",
  displayName: "Drip · Day 2 (Examples)",
  previewData: { firstName: "Alex" },
} satisfies TemplateEntry;
