import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button, Card, CardBody, Container, Input } from '@/components/ui'
import { PageHeader } from '@/components/PageHeader'
import { ROLES, ROLE_LABELS } from '@/constants'
import { useAsync } from '@/hooks/useAsync'
import { userService } from '@/services'
import { WORKSPACE_BY_ROLE } from '@/constants/navigation'

const loadDemoAccounts = () => userService.getDemoAccounts()

/**
 * Sign in.
 *
 * The email and password form is deliberately inert — authentication is
 * simulated until the backend requirements are known (CLAUDE.md §6.1). The
 * development panel below it is what actually signs you in, by choosing one of
 * the seed accounts.
 *
 * @param {Object} props
 * @param {(role: string) => void} props.onSignIn
 */
export function LoginPage({ onSignIn }) {
  const navigate = useNavigate()
  const location = useLocation()
  // Defined at module scope, so its identity is already stable.
  const { data: accounts } = useAsync(loadDemoAccounts)

  // Where the guard bounced them from, so they land back there after signing in.
  const returnTo = location.state?.from

  const signInAs = (role) => {
    onSignIn(role)
    navigate(returnTo ?? WORKSPACE_BY_ROLE[role].to, { replace: true })
  }

  return (
    <Container width="form" className="flex flex-col gap-6">
      <PageHeader title="Sign in" description="Access your reports, matches and notifications." />

      {returnTo && (
        <p className="rounded-control border border-border bg-accent-soft px-3 py-2 text-sm text-fg">
          Please sign in to continue.
        </p>
      )}

      <Card>
        <CardBody className="flex flex-col gap-4">
          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
          />
          <Input label="Password" type="password" autoComplete="current-password" />

          <Button disabled>Sign in</Button>

          <p className="text-sm text-fg-muted">
            No account yet?{' '}
            <Link to="/register" className="text-brand underline">
              Create one
            </Link>
            .
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-col gap-3">
          <div>
            <h2 className="font-semibold text-fg">Development sign-in</h2>
            <p className="text-sm text-fg-muted">
              Real accounts are not connected yet. Continue as one of the demo accounts to
              see what each kind of user can do.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {Object.values(ROLES).map((role) => (
              <Button
                key={role}
                variant="secondary"
                fullWidth
                onClick={() => signInAs(role)}
                className="justify-between"
              >
                <span>{accounts?.[role]?.fullName ?? ROLE_LABELS[role]}</span>
                <span className="text-fg-muted">{ROLE_LABELS[role]}</span>
              </Button>
            ))}
          </div>
        </CardBody>
      </Card>
    </Container>
  )
}
