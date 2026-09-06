import { useState } from 'react'
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
 * The form posts to the API, which verifies the password against the bcrypt
 * hash in the database and starts a PHP session. This component never sees a
 * password again after it is sent, and never decides what the account may do —
 * it only remembers who signed in so the interface can follow.
 *
 * The development panel below stays for the demonstration: it signs in as one
 * of the seeded accounts without needing their passwords typed out.
 *
 * @param {Object} props
 * @param {(user: Object) => void} props.onSignedIn
 * @param {(role: string) => Promise<void>} props.onDemoSignIn
 */
export function LoginPage({ onSignedIn, onDemoSignIn }) {
  const navigate = useNavigate()
  const location = useLocation()
  // Defined at module scope, so its identity is already stable.
  const { data: accounts } = useAsync(loadDemoAccounts)

  const [form, setForm] = useState({ email: '', password: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // Where the guard bounced them from, so they land back there after signing in.
  const returnTo = location.state?.from

  const change = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setError(null)
  }

  /** Send whoever just signed in to where they were going. */
  const goToWorkspace = (user) => {
    onSignedIn(user)
    navigate(returnTo ?? WORKSPACE_BY_ROLE[user.role].to, { replace: true })
  }

  const submit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      goToWorkspace(await userService.signIn(form.email.trim(), form.password))
    } catch (caught) {
      // The API answers "that email address and password do not match" for both
      // an unknown account and a wrong password, and that wording is shown as
      // it stands — narrowing it down would confirm which addresses exist.
      setError(caught instanceof Error ? caught : new Error(String(caught)))
      setIsSubmitting(false)
    }
  }

  const signInAs = async (role) => {
    await onDemoSignIn(role)
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
        <CardBody>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(event) => change('email', event.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(event) => change('password', event.target.value)}
              required
            />

            {error && (
              <p role="alert" className="text-sm text-danger">
                {error.message}
              </p>
            )}

            <Button type="submit" isLoading={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>

            <p className="text-sm text-fg-muted">
              No account yet?{' '}
              <Link to="/register" className="text-brand underline">
                Create one
              </Link>
              .
            </p>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-col gap-3">
          <div>
            <h2 className="font-semibold text-fg">Development sign-in</h2>
            <p className="text-sm text-fg-muted">
              A shortcut for the demonstration. These sign in as the seeded accounts, so you
              can see what each kind of user is allowed to do without typing their passwords.
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
