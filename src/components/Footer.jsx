import { Link } from 'react-router-dom'
import { ArrowRight, Users } from 'lucide-react'
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

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-surface-warm">
      {/* Phones: the four link groups sit two by two, tablets four across, with
          the brand block and the call-to-action card spanning the row. Stacked
          one above another they made the footer longer than a phone screen. */}
      <Container className="grid grid-cols-2 gap-x-8 gap-y-8 py-12 sm:grid-cols-4 lg:grid-cols-[1.7fr_repeat(4,1fr)_1.5fr]">
        <div className="col-span-2 flex flex-col gap-2.5 sm:col-span-4 lg:col-span-1">
          <Link to="/" className="flex items-center gap-2.5 text-lg font-semibold text-fg">
            <img src={logoMark} alt="" className="size-9" />
            Paws&amp;Found
          </Link>
          <p className="text-sm text-fg-muted">
            A community platform that helps lost pets and the people looking for them find
            each other.
          </p>

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

        <div className="col-span-2 self-start rounded-card bg-brand-soft p-4 sm:col-span-4 lg:col-span-1">
          <p className="flex items-start gap-2 text-sm font-semibold text-fg">
            <Users size={18} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
            Together, we can bring them home.
          </p>
          {/* `fg` rather than `fg-muted`: this card sits on `brand-soft`,
              where the muted ink measures 4.14:1 — the lowest reading in the
              interface and the furthest under AA. */}
          <p className="mt-1.5 text-sm text-fg">
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
