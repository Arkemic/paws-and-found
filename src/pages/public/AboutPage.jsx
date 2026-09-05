import { ArrowDown, ArrowRight, MapPin, Scale, ShieldCheck, Sparkles } from 'lucide-react'
import aboutIntro from '@/assets/img-007-about-intro.jpg'
import { Container } from '@/components/ui'
import { PageHeader } from '@/components/PageHeader'
import { SectionHeading } from '@/components/SectionHeading'

export function AboutPage() {
  return (
    // RootLayout pads <main>; this page runs its own full-bleed bands, so the
    // padding is cancelled and each section supplies its own.
    <div className="-my-8 flex flex-col">
      <WhyItExists />
      <ProblemAndChange />
      <BuiltForHere />
      <StudentProject />
    </div>
  )
}

function WhyItExists() {
  return (
    <section className="pt-10 pb-14 sm:pt-14 sm:pb-20">
      <Container className="flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-16">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <PageHeader
            title="Why Paws&Found exists"
            description="A missing pet is an emergency with no obvious place to go."
          />
          <p className="text-lg leading-relaxed text-fg-muted">
            When a pet goes missing, the search usually happens across scattered social media
            posts. Information is written differently every time, searching by characteristics
            is difficult, location is rarely structured, and a lost report and a matching found
            report can sit on two different platforms without anyone noticing.
          </p>
          <p className="text-lg leading-relaxed text-fg-muted">
            Paws&amp;Found puts those reports in one place, in one shape, so they can actually
            be compared.
          </p>
        </div>

        <img
          src={aboutIntro}
          alt="Someone crouching to greet a tan Aspin on a narrow residential street, with houses and a tricycle behind them."
          // Capped at the width the source can actually fill. Left uncapped it
          // stretched to the full container between `sm` and `lg` and was being
          // upscaled past its 800px source.
          className="aspect-square w-full max-w-sm shrink-0 self-center rounded-card bg-surface-muted object-cover shadow-card lg:w-96 lg:max-w-none"
        />
      </Container>
    </section>
  )
}

const PROBLEMS = [
  {
    title: 'Scattered posts',
    body: 'A lost pet is posted to several community pages, then buried by the next day of posts.',
  },
  {
    title: 'Incomplete information',
    body: 'Every post describes a pet differently, and the details that identify one are often missing.',
  },
  {
    title: 'Hard-to-find matches',
    body: 'A lost report and the found report that answers it can sit on two platforms, unnoticed.',
  },
]

const CHANGES = [
  {
    icon: Scale,
    title: 'Centralised reports',
    body: 'One structured form for lost and found reports: species, breed, colour, size, distinctive features, date and area.',
  },
  {
    icon: MapPin,
    title: 'Location search',
    body: 'Reports carry an approximate area, so they can be filtered and browsed on a map instead of read one by one.',
  },
  {
    icon: Sparkles,
    title: 'Possible matches',
    body: 'When a lost and a found report share enough details, the system raises a possible match and shows exactly what lined up.',
  },
  {
    icon: ShieldCheck,
    title: 'Coordinator verification',
    body: 'A possible match is a suggestion, never a conclusion. A Pet Coordinator helps verify ownership before a handover is arranged.',
  },
]

function ProblemAndChange() {
  return (
    <section className="bg-surface-alt py-16 sm:py-24">
      <Container className="flex flex-col gap-10">
        <SectionHeading
          title="What changes"
          description="The same community effort, given a structure it can be searched with."
          centered
        />

        <div className="flex flex-col items-stretch gap-6 lg:flex-row lg:items-center lg:gap-8">
          <div className="flex flex-1 flex-col gap-4">
            <h3 className="text-lg font-semibold text-fg">Today</h3>
            <ul className="flex flex-col gap-3">
              {PROBLEMS.map((item) => (
                <li
                  key={item.title}
                  className="rounded-card border border-border bg-surface-muted p-5"
                >
                  <p className="font-medium text-fg">{item.title}</p>
                  <p className="mt-1 text-fg-muted">{item.body}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Decorative — the two headings above already say which way this
              reads. Turns to point down once the columns stack. */}
          <span
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center self-center rounded-full border border-border bg-panel text-brand shadow-card"
          >
            <ArrowDown size={20} className="lg:hidden" />
            <ArrowRight size={20} className="hidden lg:block" />
          </span>

          <div className="flex flex-1 flex-col gap-4">
            <h3 className="text-lg font-semibold text-fg">With Paws&amp;Found</h3>
            <ul className="flex flex-col gap-3">
              {CHANGES.map((item) => {
                const Icon = item.icon

                return (
                  <li
                    key={item.title}
                    className="flex gap-4 rounded-card border border-border bg-panel p-5 shadow-card"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-brand-soft text-brand">
                      <Icon size={20} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="font-medium text-fg">{item.title}</p>
                      <p className="mt-1 text-fg-muted">{item.body}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  )
}

const ROLES = [
  {
    title: 'Owners and finders',
    body: 'File reports, follow them, review possible matches, and mark a pet returned.',
  },
  {
    title: 'Pet Coordinators',
    body: 'Review reports and possible matches, and help verify ownership before a handover.',
  },
  {
    title: 'Administrators',
    body: 'Manage accounts, pet categories, and moderation of false or misleading reports.',
  },
]

function BuiltForHere() {
  return (
    <section className="py-16 sm:py-24">
      <Container className="flex flex-col gap-10">
        <SectionHeading
          title="Built for the Philippine community"
          description="Barangay-level areas, local breeds, and the phone most people will actually open it on."
        />

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="flex flex-col gap-4 text-lg leading-relaxed text-fg-muted">
            <p>
              Locations are recorded as a city and an approximate area rather than an address,
              which is how people describe where a pet was last seen — and it keeps a home
              address off a public page.
            </p>
            <p>
              Breed is an open field, not a fixed list, so <em>Aspin</em> and <em>Puspin</em>{' '}
              are as reportable as any pedigree. Every page is built to work on a phone first,
              because that is where a report gets filed — usually outdoors, usually in a hurry.
            </p>
          </div>

          <ul className="flex flex-col gap-3">
            {ROLES.map((role) => (
              <li key={role.title} className="rounded-card border border-border bg-panel p-5 shadow-card">
                <p className="font-medium text-fg">{role.title}</p>
                <p className="mt-1 text-fg-muted">{role.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  )
}

function StudentProject() {
  return (
    <section className="bg-surface-alt py-14 sm:py-16">
      <Container width="prose" className="flex flex-col gap-3 text-center">
        <h2 className="text-xl font-semibold text-fg">About this build</h2>
        <p className="text-fg-muted">
          Paws&amp;Found is a student project for Web Systems and Technologies 2. Every pet,
          person, report and reunion shown in it is fictional demonstration data.
        </p>
      </Container>
    </section>
  )
}
