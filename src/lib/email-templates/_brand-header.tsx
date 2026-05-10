import * as React from 'react'
import { Section, Row, Column, Text, Link, Hr } from '@react-email/components'

export const BrandHeader = ({ siteUrl = 'https://postspark.co' }: { siteUrl?: string }) => (
  <Section style={{ padding: '24px 0 16px', borderBottom: '1px solid #eeeef2', marginBottom: '24px' }}>
    <Row>
      <Column>
        <Link href={siteUrl} style={{ textDecoration: 'none' }}>
          <Row>
            <Column style={{ width: '36px', verticalAlign: 'middle' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                  display: 'inline-block',
                  textAlign: 'center',
                  lineHeight: '32px',
                  color: '#ffffff',
                  fontSize: '18px',
                  fontWeight: 700,
                }}
              >
                ⚡
              </div>
            </Column>
            <Column style={{ verticalAlign: 'middle', paddingLeft: '8px' }}>
              <Text
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#1a1a2e',
                  margin: 0,
                  letterSpacing: '-0.01em',
                }}
              >
                PostSpark
              </Text>
            </Column>
          </Row>
        </Link>
      </Column>
    </Row>
  </Section>
)

export const BrandFooter = () => (
  <>
    <Hr style={{ borderColor: '#eeeef2', margin: '32px 0 16px' }} />
    <Text style={{ fontSize: '12px', color: '#999999', margin: '0 0 4px' }}>
      PostSpark — Turn 1 post into 30. Instantly.
    </Text>
    <Text style={{ fontSize: '12px', color: '#999999', margin: 0 }}>
      <Link href="https://postspark.co" style={{ color: '#7c3aed', textDecoration: 'none' }}>
        postspark.co
      </Link>
      {' · '}© 2026 PostSpark
    </Text>
  </>
)
