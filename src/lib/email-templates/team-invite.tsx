import * as React from 'react'
import {
  Body, Button, Container, Head, Heading, Html, Link, Preview, Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

const SITE_NAME = 'PostSpark'
const SITE_URL = 'https://postspark.co'

interface TeamInviteProps {
  workspaceName?: string
  inviterName?: string
  inviteUrl?: string
  role?: string
}

const TeamInviteEmail = ({
  workspaceName = 'a workspace',
  inviterName,
  inviteUrl = SITE_URL,
  role = 'member',
}: TeamInviteProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been invited to join {workspaceName} on {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>You've been invited to {workspaceName}</Heading>
        <Text style={text}>
          {inviterName ? <><strong>{inviterName}</strong> has invited you</> : 'You have been invited'} to join{' '}
          <strong>{workspaceName}</strong> on{' '}
          <Link href={SITE_URL} style={link}>{SITE_NAME}</Link> as a <strong>{role}</strong>.
        </Text>
        <Text style={text}>
          Click the button below to accept the invitation and start collaborating.
        </Text>
        <Button style={button} href={inviteUrl}>
          Accept invitation
        </Button>
        <Text style={footer}>
          If you weren't expecting this invitation, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: TeamInviteEmail,
  subject: (data: Record<string, any>) =>
    `You've been invited to ${data.workspaceName || 'a workspace'} on ${SITE_NAME}`,
  displayName: 'Team invite',
  previewData: {
    workspaceName: 'Acme Agency',
    inviterName: 'Jane Doe',
    inviteUrl: 'https://postspark.co/invite/sample-token',
    role: 'member',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '20px 25px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a1a2e', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 16px' }
const link = { color: '#7c3aed', textDecoration: 'underline' }
const button = {
  backgroundColor: '#7c3aed', color: '#ffffff', fontSize: '14px',
  borderRadius: '8px', padding: '12px 20px', textDecoration: 'none',
  display: 'inline-block', margin: '12px 0 24px',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
