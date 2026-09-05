import { useState } from 'react'
import { Button, Modal, Select, Textarea } from '@/components/ui'
import { MODERATION_REASONS, MODERATION_REASON_LABELS } from '@/constants'
import { moderationService } from '@/services'
import { optionsFromLabels } from '@/utils/options'

/**
 * "Report this listing" — raises a moderation case for an administrator to
 * review in Phase 11.
 *
 * Flagging only records a concern. It does not hide the report, and it never
 * tells the reporter who flagged them.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {string} props.reportId
 */
export function FlagReportDialog({ isOpen, onClose, reportId }) {
  const [reason, setReason] = useState(MODERATION_REASONS.FALSE_REPORT)
  const [details, setDetails] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [isDone, setIsDone] = useState(false)

  const close = () => {
    onClose()
    // Reset after closing so reopening starts clean, without the form visibly
    // resetting while the dialog is still on screen.
    setTimeout(() => {
      setIsDone(false)
      setDetails('')
      setError(null)
    }, 200)
  }

  const submit = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      await moderationService.createCase({
        reportId,
        reason,
        details: details.trim(),
      })
      setIsDone(true)
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error(String(caught)))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={isDone ? 'Thank you' : 'Report this listing'}
      description={
        isDone
          ? undefined
          : 'Tell an administrator what is wrong with this report. Your name is not shown to the person who filed it.'
      }
      footer={
        isDone ? (
          <Button onClick={close}>Close</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={close} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={submit} isLoading={isSubmitting}>
              {isSubmitting ? 'Sending…' : 'Send report'}
            </Button>
          </>
        )
      }
    >
      {isDone ? (
        <p className="text-sm text-fg-muted">
          An administrator will review this listing. Thank you for helping keep Paws&amp;Found
          useful for people who are actually searching.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <Select
            label="What is the problem?"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            options={optionsFromLabels(MODERATION_REASON_LABELS)}
          />

          <Textarea
            label="Anything else we should know?"
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Optional, but it helps an administrator decide quickly."
          />

          {error && (
            <p role="alert" className="text-sm text-danger">
              The report could not be sent: {error.message}
            </p>
          )}
        </div>
      )}
    </Modal>
  )
}
