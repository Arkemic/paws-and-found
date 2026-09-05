import {
  ChevronDown,
  Flag,
  HandHeart,
  Handshake,
  KeyRound,
  Lock,
  MessageSquareOff,
  Search,
  ShieldCheck,
  Sun,
  TriangleAlert,
  Users,
} from 'lucide-react'
import logoMark from '@/assets/pawsfound-logo-mark.png'
import { Container } from '@/components/ui'
import { PageHeader } from '@/components/PageHeader'
import { SectionHeading } from '@/components/SectionHeading'

/**
 * Every help topic, with its questions.
 *
 * Kept as data rather than markup so the topic cards at the top and the
 * sections below cannot fall out of step — they are built from the same list.
 */
const TOPICS = [
  {
    id: 'reporting-lost',
    icon: TriangleAlert,
    title: 'Reporting a lost pet',
    summary: 'What to include so a stranger can recognise your pet.',
    faqs: [
      {
        q: 'What details actually help?',
        a: 'The ones a stranger could check on the spot: colour and markings, size, collar, and anything unusual such as a scar, a bent ear or a short tail. Give the area rather than an exact address, plus the date and approximate time.',
      },
      {
        q: 'Do I need a photo?',
        a: 'No, but it is the single most useful thing you can add. A clear, well-lit picture of the whole animal is what people recognise, and what a coordinator compares against a found report.',
      },
      {
        q: 'Can I edit a report after filing it?',
        a: 'Yes. Your reports are listed in My Reports, and you can update the details or mark the pet returned at any time.',
      },
    ],
  },
  {
    id: 'reporting-found',
    icon: HandHeart,
    title: 'Reporting a found pet',
    summary: 'Filing a sighting, even with nothing to go on.',
    faqs: [
      {
        q: 'The pet has no collar and no name. Can I still report it?',
        a: 'Yes. A found report never asks for a pet name — the finder is not expected to know it. Species, colour, size and where you found it are enough to be useful.',
      },
      {
        q: 'Should I include everything I noticed?',
        a: 'Almost. Keep one identifying detail to yourself — something only the real owner would know — so ownership can be checked later. Everything else helps.',
      },
    ],
  },
  {
    id: 'possible-matches',
    icon: Search,
    title: 'Possible matches',
    summary: 'What a match suggestion is, and what it is not.',
    faqs: [
      {
        q: 'How does the system find a match?',
        a: 'It compares structured details between a lost and a found report: species, breed, colour, size, how close the two locations are, how close the dates are, and distinctive characteristics. There is no image recognition and no AI involved.',
      },
      {
        q: 'Does a possible match mean you found my pet?',
        a: 'No. A possible match is a suggestion, never a conclusion. Every match shows exactly which details lined up and which did not, so you can judge it yourself.',
      },
    ],
  },
  {
    id: 'verifying-ownership',
    icon: ShieldCheck,
    title: 'Verifying ownership',
    summary: 'How a claim is checked before anything is arranged.',
    faqs: [
      {
        q: 'What happens after I respond to a match?',
        a: 'The match goes to a Pet Coordinator, who compares both reports and helps confirm ownership before a handover is coordinated. Confirming a match closes both reports as returned.',
      },
      {
        q: 'What counts as proof of ownership?',
        a: 'Earlier photographs, veterinary records, or a description of a detail that was never published — which is why finders are asked to hold one back.',
      },
      {
        q: 'Who can see verification information?',
        a: 'Only the coordinator handling the case. It is never shown on a public report page.',
      },
    ],
  },
  {
    id: 'safe-handovers',
    icon: Handshake,
    title: 'Safe handovers',
    summary: 'Meeting someone to return or collect a pet.',
    faqs: [
      {
        q: 'Where should we meet?',
        a: 'A public place, during daylight, with someone else along. There is no reason a handover needs to happen at anybody’s home.',
      },
      {
        q: 'What should make me cautious?',
        a: 'Anyone who claims a pet without being able to describe it, who cannot answer a question about a detail that was never published, or who pushes to move the conversation off the platform.',
      },
    ],
  },
  {
    id: 'privacy',
    icon: Lock,
    title: 'Privacy',
    summary: 'What a public report page shows about you.',
    faqs: [
      {
        q: 'Is my phone number or email shown?',
        a: 'Only if you choose to share it. Otherwise the page offers to pass a message through Paws&Found instead.',
      },
      {
        q: 'Does the map show where I live?',
        a: 'No. Report locations are approximate areas, not addresses, and the detail page draws a circle around the pin so the imprecision is visible rather than implied.',
      },
    ],
  },
  {
    id: 'reporting-abuse',
    icon: Flag,
    title: 'Reporting abuse',
    summary: 'Flagging a listing that should not be there.',
    faqs: [
      {
        q: 'How do I report a listing?',
        a: 'Every report page has a “Report this listing” action. You will be asked to pick a reason: false report, spam, scam, harassment, inappropriate content, duplicate report, or other.',
      },
      {
        q: 'What happens to a flag?',
        a: 'It goes to an administrator for review. They can dismiss it, remove the content, warn the user, or suspend the account.',
      },
    ],
  },
]

/**
 * The four rules that matter most, lifted out of the FAQ.
 *
 * "Safe handovers" was topic five of seven, which buried the only advice on
 * this page that can keep somebody out of trouble. The page is called Help &
 * community safety; the safety half now has a band of its own rather than an
 * accordion halfway down.
 */
const SAFETY_RULES = [
  {
    icon: Users,
    title: 'Meet in public, and bring someone',
    body: 'A barangay hall, a vet clinic, a busy café. There is no reason a handover has to happen at anybody’s home.',
  },
  {
    icon: Sun,
    title: 'Daylight only',
    body: 'Arrange it for a time when the place you have chosen is open and there are other people around.',
  },
  {
    icon: KeyRound,
    title: 'Hold one detail back',
    body: 'If you found a pet, keep one identifying mark to yourself. The real owner will be able to name it.',
  },
  {
    icon: MessageSquareOff,
    title: 'Keep it on Paws&Found',
    body: 'Anyone pushing to move the conversation somewhere private before ownership is settled is a reason to slow down.',
  },
]

/**
 * Topics are tinted by what they are about — filing, matching, or staying safe
 * — rather than all seven sharing one teal. Seven identical cards gave the eye
 * nothing to sort them by.
 */
const TOPIC_TINTS = {
  'reporting-lost': 'bg-accent-soft text-lost',
  'reporting-found': 'bg-found-soft text-found',
  'possible-matches': 'bg-brand-soft text-brand',
  'verifying-ownership': 'bg-brand-soft text-brand',
  'safe-handovers': 'bg-status-returned-soft text-success-ink',
  privacy: 'bg-status-returned-soft text-success-ink',
  'reporting-abuse': 'bg-danger-soft text-danger-hover',
}

export function HelpPage() {
  return (
    <div className="-my-8 flex flex-col">
      {/* The page opens on its own ground rather than on flat white, so it
          reads as a destination the way Home and Explore do. */}
      <section className="hero-ground border-b border-border pt-10 pb-12 sm:pt-14">
        <Container className="flex flex-col gap-10">
          <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:gap-12">
            <div className="flex-1">
              <PageHeader
                title="Help & community safety"
                description="How to file a report that helps, how a match is checked, and how to stay safe arranging a handover."
              />
            </div>

            {/* The brand mark, sized as artwork. Until IMG-012 exists this is
                the one piece of imagery the page has, and it is a real asset
                rather than a placeholder box. */}
            <img
              src={logoMark}
              alt=""
              className="hidden w-40 shrink-0 opacity-90 lg:block"
            />
          </div>

          {/* Jump links rather than a search box: with seven topics, scanning
              them is faster than typing, and there is no index to search. */}
          <nav aria-label="Help topics">
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {TOPICS.map((topic) => {
                const Icon = topic.icon

                return (
                  <li key={topic.id}>
                    <a
                      href={`#${topic.id}`}
                      className="flex h-full gap-4 rounded-card border border-border bg-panel p-5 shadow-card transition-shadow hover:shadow-raised"
                    >
                      <span
                        className={`flex size-10 shrink-0 items-center justify-center rounded-control ${TOPIC_TINTS[topic.id]}`}
                      >
                        <Icon size={20} aria-hidden="true" />
                      </span>
                      <span className="flex flex-col gap-1">
                        <span className="font-medium text-fg">{topic.title}</span>
                        <span className="text-sm text-fg-muted">{topic.summary}</span>
                      </span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </nav>
        </Container>
      </section>

      {/* Safety, given the weight the page title promises it. */}
      <section className="border-b border-border bg-surface-alt py-12 sm:py-16">
        <Container className="flex flex-col gap-8">
          <SectionHeading
            title="Before you meet anyone"
            description="Four things worth settling before a handover is arranged. They apply whether you are collecting a pet or returning one."
          />

          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SAFETY_RULES.map((rule) => {
              const Icon = rule.icon

              return (
                <li
                  key={rule.title}
                  className="flex flex-col gap-3 rounded-card border border-border bg-panel p-5 shadow-card"
                >
                  <span className="flex size-11 items-center justify-center rounded-control bg-status-returned-soft text-success-ink">
                    <Icon size={22} aria-hidden="true" />
                  </span>
                  <h3 className="leading-snug font-semibold text-fg">{rule.title}</h3>
                  <p className="text-sm leading-relaxed text-fg-muted">{rule.body}</p>
                </li>
              )
            })}
          </ul>

          <p className="max-w-prose text-sm leading-relaxed text-fg-muted">
            Paws&amp;Found does not take custody of any animal and does not attend handovers. A Pet
            Coordinator helps confirm ownership before contact details are exchanged, but the
            meeting itself is between the two of you — which is why these four are worth reading.
          </p>
        </Container>
      </section>

      {TOPICS.map((topic, index) => (
        <section
          key={topic.id}
          id={topic.id}
          // Clears the sticky navbar when jumped to from the list above.
          className={index % 2 === 0 ? 'scroll-mt-24 py-12 sm:py-16' : 'scroll-mt-24 bg-surface-alt py-12 sm:py-16'}
        >
          <Container className="flex flex-col gap-6">
            <SectionHeading title={topic.title} description={topic.summary} />

            <ul className="flex max-w-prose flex-col gap-3">
              {topic.faqs.map((faq) => (
                <li key={faq.q}>
                  <Faq question={faq.q} answer={faq.a} />
                </li>
              ))}
            </ul>
          </Container>
        </section>
      ))}
    </div>
  )
}

/**
 * One question and its answer.
 *
 * Native `<details>` — it opens, closes, is keyboard operable and is announced
 * correctly without a line of JavaScript or a component library.
 */
function Faq({ question, answer }) {
  return (
    <details className="group rounded-card border border-border bg-panel shadow-card">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-medium text-fg [&::-webkit-details-marker]:hidden">
        {question}
        <ChevronDown
          size={18}
          aria-hidden="true"
          className="shrink-0 text-fg-muted transition-transform group-open:rotate-180"
        />
      </summary>
      <p className="px-5 pb-5 text-fg-muted">{answer}</p>
    </details>
  )
}
