/**
 * Seed moderation cases.
 *
 * FICTIONAL DEMO DATA. A moderation case is a flag raised by a community member
 * against a report; administrators resolve it in Phase 11.
 */

import { MODERATION_REASONS } from '@/constants'

export const moderationCases = [
  {
    id: 'mod-001',
    reportId: 'report-009',
    reportedByUserId: 'user-002',
    reason: MODERATION_REASONS.SCAM,
    details:
      'No photo, no distinguishing details, and the description pushes people to call a number directly instead of using the platform. Looks like a reward scam.',
    status: 'actioned',
    resolvedByAdminId: 'admin-001',
    resolutionNote: 'Report removed and the account suspended pending review.',
    createdAt: '2026-08-08T22:10:00.000Z',
  },
  {
    id: 'mod-002',
    reportId: 'report-006',
    reportedByUserId: 'user-006',
    reason: MODERATION_REASONS.DUPLICATE,
    details: 'I think this same lovebird was already posted last week by someone else.',
    status: 'open',
    resolvedByAdminId: null,
    resolutionNote: '',
    createdAt: '2026-08-16T03:25:00.000Z',
  },
]
