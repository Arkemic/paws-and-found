import { useCallback, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { List, Map as MapIcon, Search, SlidersHorizontal } from 'lucide-react'
import emptyReportsImage from '@/assets/empty-no-reports.png'
import headerIllustration from '@/assets/img-008-explore-header-illustration.jpg'
import { Button, Container, EmptyState, LoadingSkeleton, Modal } from '@/components/ui'
import { PetCard } from '@/components/PetCard'
import { ReportMap } from '@/components/LazyMaps'
import { cn } from '@/utils/cn'
import { hasCoordinates } from '@/utils/location'
import { FilterPanel } from '@/components/FilterPanel'
import { ActiveFilters } from '@/components/ActiveFilters'
import { useAsync } from '@/hooks/useAsync'
import { categoryService, petService } from '@/services'

/** Every filter, empty. Also the shape used to detect "nothing is filtered". */
const EMPTY_FILTERS = {
  text: '',
  reportType: '',
  species: '',
  size: '',
  color: '',
  city: '',
  status: '',
  dateFrom: '',
  dateTo: '',
}

/** How many cards to add each time "Show more" is pressed. */
const PAGE_SIZE = 9

const loadActiveCategories = () => categoryService.getActiveCategories()

export function ExplorePage() {
  // The homepage search band hands off through the URL, so a search can also be
  // shared or bookmarked. Read once on mount: after that the page owns its own
  // filter state and does not fight the address bar.
  const [searchParams] = useSearchParams()
  const [filters, setFilters] = useState(() => ({
    ...EMPTY_FILTERS,
    text: searchParams.get('q') ?? '',
    reportType: searchParams.get('type') ?? '',
    species: searchParams.get('species') ?? '',
    city: searchParams.get('city') ?? '',
  }))
  const [searchDraft, setSearchDraft] = useState(() => searchParams.get('q') ?? '')
  const [sort, setSort] = useState('newest')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false)
  const [view, setView] = useState('list')

  // Re-runs whenever a filter or the sort changes — no page reload, which is
  // the asynchronous behaviour this page is meant to demonstrate.
  const loadReports = useCallback(
    () => petService.getReports({ ...filters, sort }),
    [filters, sort],
  )
  const { data: reports, error, isLoading } = useAsync(loadReports)
  const { data: categories } = useAsync(loadActiveCategories)

  const speciesOptions = (categories ?? []).map((category) => ({
    value: category.id,
    label: category.label,
  }))

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter((value) => value !== '').length,
    [filters],
  )
  const hasActiveFilters = activeFilterCount > 0

  const changeFilter = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }))
    setVisibleCount(PAGE_SIZE) // A new filter means a new result set: start again.
  }

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS)
    setSearchDraft('')
    setVisibleCount(PAGE_SIZE)
  }

  const submitSearch = (event) => {
    event.preventDefault()
    changeFilter('text', searchDraft.trim())
  }

  const visibleReports = reports?.slice(0, visibleCount) ?? []
  const hasMore = (reports?.length ?? 0) > visibleCount
  const unpinnedCount = (reports ?? []).filter((report) => !hasCoordinates(report)).length

  return (
    <Container className="flex flex-col gap-6 pb-6 sm:pb-12">
      {/* The page composes its own header rather than using PageHeader: the
          title, the description and the search all sit together on one tinted
          band, which is what makes this read as a discovery page rather than a
          heading above a form. */}
      <title>Explore reports · Paws&Found</title>

      {/* IMG-008 is the whole band, not a cut-out: the cream-to-teal wave and
          the dog and cat are one 3:1 illustration, with the left side left
          clear for type. The text block is capped at half the width because
          past that the artwork darkens and muted text would fall below AA. */}
      <section className="relative min-h-60 overflow-hidden rounded-card bg-brand-soft/60 lg:min-h-68">
        {/* Shown from `md` up only. The artwork is 3:1; in a narrower band
            `cover` crops horizontally and the cat is the first thing lost.
            Below that the band keeps its tint and the type has it to itself. */}
        <img
          src={headerIllustration}
          alt=""
          className="absolute inset-0 hidden size-full object-cover object-center md:block"
        />

        <div className="relative flex flex-col gap-6 px-6 py-8 sm:px-10 sm:py-10">
          <div className="flex flex-col gap-2 lg:max-w-1/2">
            <h1 className="text-3xl font-semibold tracking-tight text-balance text-fg sm:text-4xl">
              Explore reports
            </h1>
            {/* Full-strength ink, not `fg-muted`: on the tinted band muted text
                measures 4.31:1, and no usable tint strength gets it to AA. */}
            <p className="text-lg text-fg">
              Search lost and found pets reported across the Philippines.
            </p>
          </div>

          <form onSubmit={submitSearch} className="flex gap-2">
            <div className="relative flex-1">
              <label htmlFor="explore-search" className="sr-only">
                Search reports
              </label>
              <Search
                size={18}
                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-fg-subtle"
                aria-hidden="true"
              />
              <input
                id="explore-search"
                type="search"
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder="Search by breed, colour, markings, pet name or place"
                className="h-12 w-full rounded-control border border-border-strong bg-panel pr-4 pl-11 text-base text-fg shadow-card placeholder:text-fg-muted"
              />
            </div>
            <Button type="submit" size="lg" className="sm:min-w-30">
              Search
            </Button>
          </form>
        </div>
      </section>

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        {/* Desktop: a persistent sidebar. Mobile: the same panel in a dialog. */}
        <aside className="hidden lg:block lg:w-65 lg:shrink-0">
          <div className="sticky top-24">
            <FilterPanel
              filters={filters}
              onChange={changeFilter}
              onClear={clearFilters}
              hasActiveFilters={hasActiveFilters}
              speciesOptions={speciesOptions}
            />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <p className="text-lg font-semibold text-fg" aria-live="polite">
              {isLoading
                ? 'Searching…'
                : `${reports?.length ?? 0} ${reports?.length === 1 ? 'pet' : 'pets'} found`}
            </p>

            <div className="flex items-center gap-2">
              <div className="flex rounded-control border border-border-strong bg-panel p-1" role="group" aria-label="View">
                {[
                  { id: 'list', label: 'List', icon: List },
                  { id: 'map', label: 'Map', icon: MapIcon },
                ].map((option) => {
                  const Icon = option.icon

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setView(option.id)}
                      aria-pressed={view === option.id}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-[0.45rem] px-3.5 py-1.5 text-sm transition-colors',
                        view === option.id
                          ? 'bg-brand-soft font-medium text-brand-hover shadow-card'
                          : 'text-fg-muted hover:text-fg',
                      )}
                    >
                      <Icon size={16} aria-hidden="true" />
                      {option.label}
                    </button>
                  )
                })}
              </div>

              <Button
                variant="secondary"
                size="sm"
                className="lg:hidden"
                onClick={() => setIsFilterDialogOpen(true)}
              >
                <SlidersHorizontal size={16} aria-hidden="true" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-0.5 rounded-pill bg-brand px-1.5 text-xs text-fg-inverted">
                    {activeFilterCount}
                  </span>
                )}
              </Button>

              {/* Sorting only changes the list. On the map it would be a
                  control with no visible effect, so it is not offered. */}
              {view === 'list' && (
                <>
                  <label htmlFor="explore-sort" className="sr-only">
                    Sort reports
                  </label>
                  <select
                    id="explore-sort"
                    value={sort}
                    onChange={(event) => setSort(event.target.value)}
                    className="h-10 rounded-control border border-border-strong bg-panel px-3 text-sm text-fg"
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                  </select>
                </>
              )}
            </div>
          </div>

          <ActiveFilters filters={filters} onRemove={(field) => changeFilter(field, '')} />

          {isLoading && (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
              <span className="sr-only">Loading reports…</span>
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="rounded-card border border-border bg-panel p-4">
                  <LoadingSkeleton className="mb-4 aspect-4/3 w-full" />
                  <LoadingSkeleton lines={3} />
                </div>
              ))}
            </div>
          )}

          {error && (
            <p role="alert" className="text-sm text-danger">
              Reports could not be loaded: {error.message}
            </p>
          )}

          {!isLoading && !error && visibleReports.length === 0 && (
            <EmptyState
              illustration={emptyReportsImage}
              title={hasActiveFilters ? 'No reports match those filters' : 'No reports yet'}
              description={
                hasActiveFilters
                  ? 'Try removing a filter or searching for a broader term — for example a colour rather than a breed.'
                  : 'When someone files a lost or found report, it will appear here.'
              }
              action={
                hasActiveFilters ? (
                  <Button variant="secondary" onClick={clearFilters}>
                    Clear all filters
                  </Button>
                ) : (
                  <Button as={Link} to="/report/lost" variant="accent">
                    Report a lost pet
                  </Button>
                )
              }
            />
          )}

          {!isLoading && !error && visibleReports.length > 0 && view === 'map' && (
            <>
              {/* The map shows every result, not just the loaded page — a pin is
                  cheap and paging a map would be confusing. */}
              <ReportMap reports={reports} height="h-[36rem]" />

              {unpinnedCount > 0 && (
                <p className="text-sm text-fg-muted">
                  {unpinnedCount} of these {reports.length} reports {unpinnedCount === 1 ? 'has' : 'have'}{' '}
                  no map pin and {unpinnedCount === 1 ? 'is' : 'are'} only in the list.
                </p>
              )}
            </>
          )}

          {!isLoading && !error && visibleReports.length > 0 && view === 'list' && (
            <>
              <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {visibleReports.map((report) => (
                  <li key={report.id} className="flex">
                    <PetCard report={report} className="w-full" />
                  </li>
                ))}
              </ul>

              {hasMore && (
                <div className="flex flex-col items-center gap-2 pt-2">
                  <p className="text-sm text-fg-muted">
                    Showing {visibleReports.length} of {reports.length}
                  </p>
                  <Button
                    variant="secondary"
                    size="lg"
                    className="min-w-56"
                    onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                  >
                    Show more reports
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Modal
        isOpen={isFilterDialogOpen}
        onClose={() => setIsFilterDialogOpen(false)}
        title="Filters"
        footer={
          <Button onClick={() => setIsFilterDialogOpen(false)}>
            Show {reports?.length ?? 0} results
          </Button>
        }
      >
        <FilterPanel
          filters={filters}
          onChange={changeFilter}
          onClear={clearFilters}
          hasActiveFilters={hasActiveFilters}
          speciesOptions={speciesOptions}
        />
      </Modal>
    </Container>
  )
}
