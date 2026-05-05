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

export const TEMPLATES: Record<string, TemplateEntry> = {
  'team-invite': teamInvite,
  'approval-request': approvalRequest,
}
