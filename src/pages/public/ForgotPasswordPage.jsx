import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import { AuthShell } from '@/components/AuthShell'
import { PageHeader } from '@/components/PageHeader'
import { Button, Card, CardBody, Input } from '@/components/ui'
import { userService } from '@/services'

/**
 * Asking for a password reset.
 *
 * The answer is the same whatever is typed — a real address, an invented one,
 * a suspended account, an address whose mail server is refusing everything.
 * That is the whole point: anything that varies is a way of asking the site
 * which addresses have accounts, one guess at a time.
 *
 * So this page does not branch on the result. It shows one confirmation, and
 * that confirmation is deliberately careful about what it claims.
 */
export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      await userService.forgotPassword(email.trim())
      setSent(true)
    } catch (caught) {
      // Only a rate limit or the server being down reaches here — an unknown
      // address does not, by design.
      setError(caught instanceof Error ? caught : new Error(String(caught)))
      setIsSubmitting(false)
    }
  }

  if (sent) {
    return (
      <AuthShell>
        <Card>
          <CardBody className="flex flex-col items-center gap-4 text-center">
            <MailCheck size={40} className="text-brand" aria-hidden="true" />
            <PageHeader
              title="Check your email"
              description="If an account uses that address, instructions for setting a new password are on their way."
            />
            <p className="text-sm text-fg-muted">
              The link works once and expires in an hour. If nothing arrives, check the spam
              folder before asking again — a second request replaces the first link.
            </p>
            <Button as={Link} to="/login" variant="ghost">
              Back to sign in
            </Button>
          </CardBody>
        </Card>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <Card>
        <CardBody>
          <form onSubmit={submit} className="flex flex-col gap-5">
            <PageHeader
              title="Forgot your password?"
              description="Type the address on your account and we will send a link for setting a new one."
            />

            {error && (
              <p role="alert" className="text-sm text-danger">
                {error.message}
              </p>
            )}

            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" isLoading={isSubmitting}>
                {isSubmitting ? 'Sending…' : 'Send the link'}
              </Button>
              <Button as={Link} to="/login" variant="ghost" disabled={isSubmitting}>
                Cancel
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </AuthShell>
  )
}
