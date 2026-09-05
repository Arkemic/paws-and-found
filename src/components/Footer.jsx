import { Link } from 'react-router-dom'
import { ArrowRight, Mail, Users } from 'lucide-react'
import facebookIcon from '@/assets/img-009-icon-facebook.png'
import instagramIcon from '@/assets/img-010-icon-instagram.png'
import logoMark from '@/assets/pawsfound-logo-mark.png'
import { Button, Container } from '@/components/ui'

/**
 * Site footer.
 *
 * Grouped into columns that mirror what people came to do — explore, report,
 * understand, get help — rather than one undifferentiated row of links.
 */
const COLUMNS = [
  {
    heading: 'Explore',
    links: [
      { to: '/explore?type=lost', label: 'Browse lost pets' },
      { to: '/explore?type=found', label: 'Browse found pets' },
      { to: '/explore', label: 'Search all reports' },
    ],
  },
  {
    heading: 'Report',
    links: [
      { to: '/report/lost', label: 'Report a lost pet' },
      { to: '/report/found', label: 'Report a found pet' },
    ],
  },
  {
    heading: 'About',
    links: [
      { to: '/about', label: 'About Paws&Found' },
      { to: '/about', label: 'How it works' },
    ],
  },
  {
    heading: 'Help',
    links: [
      { to: '/help', label: 'Help & safety' },
      { to: '/help', label: 'Safe handovers' },
    ],
  },
]

/**
 * Social links.
 *
 * Facebook and Instagram wordmarks are not in `lucide-react` — it dropped brand
 * icons — so those two slots are waiting on real SVG marks. Until then they use
 * the closest neutral icon and are labelled for screen readers.
 */
const SOCIALS = [
  { label: 'Paws&Found on Facebook', image: facebookIcon },
  { label: 'Email Paws&Found', icon: Mail },
  { label: 'Paws&Found on Instagram', image: instagramIcon },
]

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-surface-warm">
      <Container className="grid gap-x-8 gap-y-10 py-12 lg:grid-cols-[1.7fr_repeat(4,1fr)_1.5fr]">
        <div className="flex flex-col gap-2.5">
          <Link to="/" className="flex items-center gap-2.5 text-lg font-semibold text-fg">
            <img src={logoMark} alt="" className="size-9" />
            Paws&amp;Found
          </Link>
          <p className="text-sm text-fg-muted">
            A community platform that helps lost pets and the people looking for them find
            each other.
          </p>

          {/* Demo only: the project has no real accounts, so these are marks
              rather than links. Rendering them as links would promise a
              destination that does not exist. */}
          <ul className="mt-1 flex items-center gap-2">
            {SOCIALS.map((social) => {
              const Icon = social.icon

              return (
                <li
                  key={social.label}
                  className="flex size-9 items-center justify-center rounded-full bg-brand text-fg-inverted"
                >
                  {social.image ? (
                    <img src={social.image} alt="" className="h-4 w-auto" />
                  ) : (
                    <Icon size={16} aria-hidden="true" />
                  )}
                  <span className="sr-only">{social.label} (demo only)</span>
                </li>
              )
            })}
          </ul>
        </div>

        {COLUMNS.map((column) => (
          <nav key={column.heading} aria-label={column.heading}>
            <h2 className="text-sm font-semibold text-fg">{column.heading}</h2>
            <ul className="mt-2 flex flex-col gap-0.5">
              {column.links.map((link) => (
                <li key={link.to + link.label}>
                  <Link
                    to={link.to}
                    className="inline-block py-1 text-sm text-fg-muted underline decoration-border-strong underline-offset-4 transition-colors hover:text-brand hover:decoration-brand"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="self-start rounded-card bg-brand-soft p-4">
          <p className="flex items-start gap-2 text-sm font-semibold text-fg">
            <Users size={18} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
            Together, we can bring them home.
          </p>
          <p className="mt-1.5 text-sm text-fg-muted">
            Every report helps somebody find the pet they are looking for.
          </p>
          <Button as={Link} to="/explore" size="sm" className="mt-3">
            Report or search now
            <ArrowRight size={14} aria-hidden="true" />
          </Button>
        </div>
      </Container>

      <div className="border-t border-border">
        <Container className="py-4">
          <p className="text-sm text-fg-muted">
            &copy; 2026 Paws&amp;Found. Academic project for Web Systems and Technologies 2.
            All pets, people and reports shown are fictional demonstration data.
          </p>
        </Container>
      </div>
    </footer>
  )
}
