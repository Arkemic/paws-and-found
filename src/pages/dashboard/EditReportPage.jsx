import { useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { Button, Container, EmptyState, LoadingSkeleton } from '@/components/ui'
import { PageHeader } from '@/components/PageHeader'
import { ReportForm } from '@/components/report-form/ReportForm'
import { useAsync } from '@/hooks/useAsync'
import { petService, userService } from '@/services'

/**
 * Edit one of your own reports.
 *
 * Reuses the reporting wizard rather than having a second form, so validation
 * and field rules cannot drift between creating and editing.
 */
export function EditReportPage() {
  const { id } = useParams()

  const loadReport = useCallback(async () => {
    const [report, user] = await Promise.all([
      petService.getReportById(id),
      userService.getCurrentUser(),
    ])
    return { report, user }
  }, [id])

  const { data, error, isLoading } = useAsync(loadReport)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Edit report" />
        <LoadingSkeleton lines={6} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Report not found" />
        <EmptyState
          icon={Lock}
          title="This report does not exist"
          description="It may have been removed, or the address may be wrong."
          action={
            <Button as={Link} to="/dashboard/reports" variant="secondary">
              Back to my reports
            </Button>
          }
        />
      </div>
    )
  }

  const { report, user } = data

  // Client-side only, like every other guard here — it keeps the interface
  // honest but is not security (CLAUDE.md §8).
  if (report.reporterId !== user?.id) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="No access" />
        <EmptyState
          icon={Lock}
          title="This is not your report"
          description="Only the person who filed a report can edit it. You can still view it and, if something is wrong with it, report the listing."
          action={
            <Button as={Link} to={`/pet/${report.id}`} variant="secondary">
              View the report
            </Button>
          }
        />
      </div>
    )
  }

  const heading = report.petName ?? 'Found pet report'

  return (
    <Container width="form" className="flex flex-col gap-6 px-0 sm:px-0 lg:px-0">
      <PageHeader
        title={`Edit ${heading}`}
        description="Changes appear on the public report straight away."
        breadcrumb={[
          { label: 'My dashboard', to: '/dashboard' },
          { label: 'My reports', to: '/dashboard/reports' },
          { label: 'Edit' },
        ]}
      />
      <ReportForm report={report} />
    </Container>
  )
}
