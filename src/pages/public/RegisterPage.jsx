import { Link } from 'react-router-dom'
import { Button, Card, CardBody, Container, Input } from '@/components/ui'
import { PageHeader } from '@/components/PageHeader'

/**
 * Registration shell. Like the sign-in page, this does not submit anywhere
 * while authentication is simulated.
 */
export function RegisterPage() {
  return (
    <Container width="form" className="flex flex-col gap-6">
      <PageHeader
        title="Create an account"
        description="An account lets you file reports, follow possible matches, and receive notifications."
      />

      <Card>
        <CardBody className="flex flex-col gap-4">
          <p className="rounded-control border border-border bg-brand-soft px-3 py-2 text-sm text-fg-muted">
            Registration is not connected yet. To look around, use the development sign-in on
            the{' '}
            <Link to="/login" className="text-brand underline">
              sign-in page
            </Link>
            .
          </p>

          <Input label="Full name" autoComplete="name" placeholder="e.g. Maria Santos" />
          <Input label="Email address" type="email" autoComplete="email" placeholder="you@example.com" />
          <Input label="Password" type="password" autoComplete="new-password" />

          <Button disabled>Create account</Button>

          <p className="text-sm text-fg-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-fg underline">
              Sign in
            </Link>
            .
          </p>
        </CardBody>
      </Card>
    </Container>
  )
}
