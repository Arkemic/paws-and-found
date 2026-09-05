import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { Container, EmptyState } from '@/components/ui'
import { PageHeader } from '@/components/PageHeader'

export function UnauthorizedPage() {
  return (
    <Container width="prose" className="flex flex-col gap-6">
      <PageHeader
        title="No access"
        description="Your account does not have permission to open that page."
      />

      <EmptyState
        icon={Lock}
        title="This area is for a different role"
        description="Community members, Pet Coordinators and administrators each see a different workspace. While authentication is simulated, switch account using the Demo role selector in the navigation bar."
        action={
          <Link to="/" className="text-sm text-fg underline">
            Go to the homepage
          </Link>
        }
      />
    </Container>
  )
}
