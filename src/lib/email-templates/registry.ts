import type { ComponentType } from 'react'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
  /**
   * Who is allowed to trigger this template via the public /lovable/email/transactional/send endpoint.
   * - 'server_only': only the server (service role) may send. Authenticated user calls are rejected.
   * - 'invite_owner': caller must own a pending workspace_invite for the recipient email.
   * - 'self': recipient must equal the authenticated user's own email.
   * Defaults to 'server_only' (deny by default).
   */
  callerRestriction?: 'server_only' | 'invite_owner' | 'self'
}

import { template as teamInvite } from './team-invite'
import { template as approvalRequest } from './approval-request'
import { PaymentFailedEmail } from './payment-failed'
import { SubscriptionCanceledEmail } from './subscription-canceled'
import { AccountDeletedEmail } from './account-deleted'
import { WelcomePaidEmail } from './welcome-paid'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'team-invite': { ...teamInvite, callerRestriction: 'invite_owner' },
  'approval-request': { ...approvalRequest, callerRestriction: 'invite_owner' },
  'welcome-paid': {
    component: WelcomePaidEmail,
    subject: (d: any) => `Welcome to PostSpark ${d?.planName ?? 'Premium'} 🎉`,
    displayName: 'Welcome (paid)',
    previewData: { planName: 'Pro', dashboardUrl: 'https://postspark.co/dashboard', manageBillingUrl: 'https://postspark.co/dashboard/settings' },
    callerRestriction: 'server_only',
  },
  'payment-failed': {
    component: PaymentFailedEmail,
    subject: 'Action needed: your PostSpark payment failed',
    displayName: 'Payment failed',
    previewData: { planName: 'Pro', manageBillingUrl: 'https://postspark.co/dashboard/settings' },
    callerRestriction: 'server_only',
  },
  'subscription-canceled': {
    component: SubscriptionCanceledEmail,
    subject: 'Your PostSpark subscription has been canceled',
    displayName: 'Subscription canceled',
    previewData: { planName: 'Pro', endsOn: new Date(Date.now() + 7 * 86400000).toISOString(), resubscribeUrl: 'https://postspark.co/#pricing' },
    callerRestriction: 'server_only',
  },
  'account-deleted': {
    component: AccountDeletedEmail,
    subject: 'Your PostSpark account has been deleted',
    displayName: 'Account deleted',
    previewData: {},
    callerRestriction: 'server_only',
  },
}
