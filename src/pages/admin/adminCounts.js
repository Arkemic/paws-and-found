import { moderationService } from '@/services'

/**
 * The Administration sidebar's count badge: flags awaiting a decision, the
 * same number the Moderation page's first tab shows. The other sections are
 * records to look through rather than work waiting, so they carry no count.
 */
export async function loadAdminCounts() {
  const open = await moderationService.getCasesWithContext({ status: 'open' })
  return { '/admin/moderation': open.length }
}
