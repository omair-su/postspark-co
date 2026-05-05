import type { ComponentType } from 'react'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

import { template as teamInvite } from './team-invite'
import { template as approvalRequest } from './approval-request'
import { PaymentFailedEmail } from './payment-failed'
import { SubscriptionCanceledEmail } from './subscription-canceled'
import { AccountDeletedEmail } from './account-deleted'
import { WelcomePaidEmail } from './welcome-paid'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'team-invite': teamInvite,
  'approval-request': approvalRequest,
  'welcome-paid': {
    component: WelcomePaidEmail,
    subject: (d: any) => `Welcome to PostSpark ${d?.planName ?? 'Premium'} 🎉`,
    displayName: 'Welcome (paid)',
    previewData: { planName: 'Pro', dashboardUrl: 'https://postspark.co/dashboard', manageBillingUrl: 'https://postspark.co/dashboard/settings' },
  },
  'payment-failed': {
    component: PaymentFailedEmail,
    subject: 'Action needed: your PostSpark payment failed',
    displayName: 'Payment failed',
    previewData: { planName: 'Pro', manageBillingUrl: 'https://postspark.co/dashboard/settings' },
  },
  'subscription-canceled': {
    component: SubscriptionCanceledEmail,
    subject: 'Your PostSpark subscription has been canceled',
    displayName: 'Subscription canceled',
    previewData: { planName: 'Pro', endsOn: new Date(Date.now() + 7 * 86400000).toISOString(), resubscribeUrl: 'https://postspark.co/#pricing' },
  },
  'account-deleted': {
    component: AccountDeletedEmail,
    subject: 'Your PostSpark account has been deleted',
    displayName: 'Account deleted',
    previewData: {},
  },
}
