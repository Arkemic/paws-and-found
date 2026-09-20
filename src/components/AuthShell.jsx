import { Heart } from 'lucide-react'
import authImage from '@/assets/img-017-auth-community.jpg'
import { Container } from '@/components/ui'
import { PatternVeil } from '@/components/PatternVeil'

/**
 * The frame around signing in and registering.
 *
 * From `lg` the form keeps its comfortable reading width on the left and
 * IMG-017 fills the space beside it — the same kind of doorway the reports in
 * this system are filed from. Below `lg` the photograph is dropped rather than
 * stacked: on a phone it would push the form below the fold, and somebody
 * opening this page came to sign in.
 *
 * The photograph is decoration with a subject, not content: it carries a short
 * alt text and never has text placed over it, so nothing here depends on
 * contrast against a photograph.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children  The form column.
 */
export function AuthShell({ children }) {
  return (
    <Container className="relative isolate grid items-start gap-10 lg:grid-cols-[minmax(0,32rem)_minmax(0,1fr)] lg:gap-14">
      <PatternVeil className="-top-8 h-72" />

      <div className="flex min-w-0 flex-col gap-6">{children}</div>

      <figure className="hidden lg:sticky lg:top-24 lg:block">
        <img
          src={authImage}
          alt="A cat at the open door of a home, with somebody crouched beside it."
          width="1200"
          height="900"
          loading="lazy"
          decoding="async"
          className="w-full rounded-[1.25rem] object-cover shadow-raised ring-1 ring-black/5 lg:max-h-[30rem]"
        />
        {/* One line under the photograph rather than over it: text on top of a
            photograph cannot promise its own contrast. */}
        <figcaption className="mt-4 flex items-start gap-2.5 text-fg-muted">
          <Heart size={18} className="mt-0.5 shrink-0 text-accent-hover" aria-hidden="true" />
          Every report can help bring someone home.
        </figcaption>
      </figure>
    </Container>
  )
}
