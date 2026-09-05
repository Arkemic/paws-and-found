import { HandHeart, Lock } from 'lucide-react'
import { Container } from '@/components/ui'
import { ReportForm } from '@/components/report-form/ReportForm'
import { REPORT_TYPES } from '@/constants'

export function ReportFoundPage() {
  return (
    <div className="found-ground -my-8 py-8">
      <Container width="wizard" className="flex flex-col gap-8">
        <title>Report a found pet · Paws&Found</title>

        <div className="flex flex-col gap-3 border-b border-border pb-6">
          <p className="inline-flex w-fit items-center gap-2 rounded-pill bg-found-soft px-3 py-1 text-sm font-semibold text-found">
            <HandHeart size={15} aria-hidden="true" />
            Report found
          </p>

          <h1 className="text-3xl font-semibold tracking-tight text-balance text-fg sm:text-4xl">
            Report a found pet
          </h1>
          <p className="text-lg text-fg-muted">Give the owner the best chance of recognising them.</p>
          <p className="max-w-prose text-fg-muted">
            We&apos;ll compare these details with pets reported missing nearby. It takes a few minutes,
            and you can edit anything afterwards.
          </p>

          <p className="mt-1 flex items-center gap-2 text-sm text-fg-muted">
            <Lock size={14} className="shrink-0 text-fg-subtle" aria-hidden="true" />
            Exact addresses are never shown publicly.
          </p>
        </div>

        <ReportForm reportType={REPORT_TYPES.FOUND} />
      </Container>
    </div>
  )
}
