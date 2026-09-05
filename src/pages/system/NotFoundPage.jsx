import { Link } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import { Container, EmptyState } from '@/components/ui'
import { PageHeader } from '@/components/PageHeader'

export function NotFoundPage() {
  return (
    <Container width="prose" className="flex flex-col gap-6">
      <PageHeader
        title="Page not found"
        description="The page you were looking for does not exist, or it may have been moved."
      />

      <EmptyState
        icon={SearchX}
        title="Nothing here"
        description="Check the address, or start from the homepage."
        action={
          <Link to="/" className="text-sm text-fg underline">
            Go to the homepage
          </Link>
        }
      />
    </Container>
  )
}
