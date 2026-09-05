import { useState } from 'react'
import { Check } from 'lucide-react'
import { Button, Card, CardBody, CardHeader, Checkbox, Input, LoadingSkeleton } from '@/components/ui'
import { PageHeader } from '@/components/PageHeader'
import { ROLE_LABELS } from '@/constants'
import { useAsync } from '@/hooks/useAsync'
import { userService } from '@/services'

const loadCurrentUser = () => userService.getCurrentUser()

const header = (
  <PageHeader
    title="Profile"
    description="Your contact details and what you want to be told about."
    breadcrumb={[{ label: 'My dashboard', to: '/dashboard' }, { label: 'Profile' }]}
  />
)

/**
 * Your own details and notification preferences.
 *
 * Loads the account, then hands it to the form. The form initialises its own
 * state from the prop, so there is no effect copying loaded data into state —
 * `key={user.id}` is what resets it if the account ever changes.
 */
export function ProfilePage() {
  const { data: user, isLoading, error, reload } = useAsync(loadCurrentUser)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <LoadingSkeleton lines={6} />
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <p role="alert" className="text-sm text-danger">
          Your profile could not be loaded{error ? `: ${error.message}` : '.'}
        </p>
      </div>
    )
  }

  return <ProfileForm key={user.id} user={user} onSaved={reload} />
}

function ProfileForm({ user, onSaved }) {
  const [form, setForm] = useState(() => ({
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    preferredLocation: user.preferredLocation,
    ...user.notificationPreferences,
  }))
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [saveError, setSaveError] = useState(null)

  const change = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setIsSaved(false)
  }

  const save = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    setSaveError(null)

    try {
      await userService.updateUser(user.id, {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        preferredLocation: form.preferredLocation.trim(),
        notificationPreferences: {
          possibleMatches: form.possibleMatches,
          statusUpdates: form.statusUpdates,
          staffMessages: form.staffMessages,
        },
      })
      setIsSaved(true)
      onSaved()
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught : new Error(String(caught)))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-6">
      {header}

      <Card>
        <CardHeader titleAs="h2" title="Your details" />
        <CardBody className="flex flex-col gap-4">
          <Input
            label="Full name"
            value={form.fullName}
            onChange={(event) => change('fullName', event.target.value)}
            maxLength={80}
            required
            hint="Shown on the reports you file."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Email address"
              type="email"
              value={form.email}
              onChange={(event) => change('email', event.target.value)}
              required
            />
            <Input
              label="Phone number"
              type="tel"
              value={form.phone}
              onChange={(event) => change('phone', event.target.value)}
            />
          </div>

          <p className="rounded-control border border-border bg-brand-soft px-3 py-2 text-sm text-fg-muted">
            Your email and phone number are only shown on a report if you choose to share
            them, and you choose that separately for each report.
          </p>

          <Input
            label="Preferred location"
            value={form.preferredLocation}
            onChange={(event) => change('preferredLocation', event.target.value)}
            maxLength={80}
            placeholder="e.g. Makati City, Metro Manila"
            hint="Where you usually search. Used to sort nearby reports first once maps arrive."
          />

          <div>
            <p className="text-sm font-medium text-fg">Account type</p>
            <p className="text-sm text-fg-muted">{ROLE_LABELS[user.role]}</p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          titleAs="h2"
          title="Notifications"
          subtitle="Which updates you want. Delivery is not connected yet."
        />
        <CardBody className="flex flex-col gap-3">
          <Checkbox
            label="Possible matches"
            hint="When a report is filed that could be the same pet."
            checked={form.possibleMatches}
            onChange={(event) => change('possibleMatches', event.target.checked)}
          />
          <Checkbox
            label="Status updates"
            hint="When one of your reports changes status."
            checked={form.statusUpdates}
            onChange={(event) => change('statusUpdates', event.target.checked)}
          />
          <Checkbox
            label="Messages from a Pet Coordinator"
            checked={form.staffMessages}
            onChange={(event) => change('staffMessages', event.target.checked)}
          />
        </CardBody>
      </Card>

      {saveError && (
        <p role="alert" className="text-sm text-danger">
          Your profile could not be saved: {saveError.message}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" isLoading={isSaving}>
          {isSaving ? 'Saving…' : 'Save changes'}
        </Button>

        {isSaved && (
          <p role="status" className="flex items-center gap-1 text-sm text-success">
            <Check size={16} aria-hidden="true" />
            Profile saved
          </p>
        )}
      </div>
    </form>
  )
}
