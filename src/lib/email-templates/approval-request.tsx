import * as React from 'react'
import {
  Body, Button, Container, Head, Heading, Html, Link, Preview, Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

const SITE_NAME = 'PostSpark'
const SITE_URL = 'https://postspark.co'

interface ApprovalRequestProps {
  jobTitle?: string
  senderName?: string
  reviewUrl?: string
}

const ApprovalRequestEmail = ({
  jobTitle = 'a piece of content',
  senderName,
  reviewUrl = SITE_URL,
}: ApprovalRequestProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Review request: {jobTitle}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Your review is requested</Heading>
        <Text style={text}>
          {senderName ? <><strong>{senderName}</strong> has shared</> : 'Someone has shared'}{' '}
          content with you for review: <strong>{jobTitle}</strong>.
        </Text>
        <Text style={text}>
          Click the button below to view the content and approve it or request changes.
          No account required.
        </Text>
        <Button style={button} href={reviewUrl}>
          Review content
        </Button>
        <Text style={smallText}>
          Or paste this link into your browser:<br />
          <Link href={reviewUrl} style={link}>{reviewUrl}</Link>
        </Text>
        <Text style={footer}>
          Sent via {SITE_NAME}. If you weren't expecting this, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ApprovalRequestEmail,
  subject: (data: Record<string, any>) =>
    `Review request: ${data.jobTitle || 'New content for your review'}`,
  displayName: 'Approval request',
  previewData: {
    jobTitle: 'Q4 Launch Announcement',
    senderName: 'Jane Doe',
    reviewUrl: 'https://postspark.co/review/sample-token',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '20px 25px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a1a2e', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 16px' }
const smallText = { fontSize: '12px', color: '#999999', lineHeight: '1.5', margin: '12px 0 0', wordBreak: 'break-all' as const }
const link = { color: '#7c3aed', textDecoration: 'underline' }
const button = {
  backgroundColor: '#7c3aed', color: '#ffffff', fontSize: '14px',
  borderRadius: '8px', padding: '12px 20px', textDecoration: 'none',
  display: 'inline-block', margin: '12px 0 24px',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
