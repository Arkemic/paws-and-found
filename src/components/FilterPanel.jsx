import {
  CalendarDays,
  CircleCheck,
  Dog,
  MapPin,
  Palette,
  PawPrint,
  Ruler,
} from 'lucide-react'
import { Button, Input, Select } from '@/components/ui'
import { cn } from '@/utils/cn'
import {
  PET_SIZE_LABELS,
  REPORT_STATUS_LABELS,
  REPORT_STATUS_ORDER,
  REPORT_TYPE_LABELS,
} from '@/constants'
import { optionsFromLabels, orderedOptionsFromLabels } from '@/utils/options'
import { todayAsInputValue } from '@/utils/date'

const ANY = ''

/**
 * The filter controls for Explore.
 *
 * Presentational only — it holds no state. The page owns the filter values so
 * the same panel can be rendered in the desktop sidebar and inside the mobile
 * dialog without the two getting out of step.
 *
 * @param {Object} props
 * @param {Object} props.filters
 * @param {(field: string, value: string) => void} props.onChange
 * @param {() => void} props.onClear
 * @param {boolean} props.hasActiveFilters
 * @param {{value: string, label: string}[]} props.speciesOptions  From
 *   `categoryService` — administrators manage the list.
 */
export function FilterPanel({
  filters,
  onChange,
  onClear,
  hasActiveFilters,
  speciesOptions = [],
}) {
  return (
    // One white panel rather than a bare column of controls: it separates
    // filtering from the results beside it, and stops the sidebar reading as a
    // form on the page background.
    <div className="flex flex-col gap-5 rounded-card border border-border bg-panel p-5 shadow-card">
      <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
        <h2 className="text-lg font-semibold text-fg">Filters</h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClear}
            className="text-sm font-medium text-brand hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Report type is three options and the most consequential filter on the
          page, so it is a visible choice rather than something hidden inside a
          dropdown. */}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-0.5">
          <FilterLabel icon={PawPrint}>Report type</FilterLabel>
        </legend>
        <div className="flex rounded-control border border-border-strong bg-panel p-1">
          {[
            { value: ANY, label: 'Both' },
            ...optionsFromLabels(REPORT_TYPE_LABELS),
          ].map((option) => (
            <button
              key={option.value || 'any'}
              type="button"
              onClick={() => onChange('reportType', option.value)}
              aria-pressed={filters.reportType === option.value}
              className={cn(
                'flex-1 rounded-[0.45rem] px-2 py-1.5 text-sm transition-colors',
                filters.reportType === option.value
                  ? 'bg-brand-soft font-medium text-brand-hover'
                  : 'text-fg-muted hover:text-fg',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      <Select
        label={<FilterLabel icon={Dog}>Species</FilterLabel>}
        value={filters.species}
        onChange={(event) => onChange('species', event.target.value)}
        options={[{ value: ANY, label: 'Any species' }, ...speciesOptions]}
      />

      <Select
        label={<FilterLabel icon={Ruler}>Size</FilterLabel>}
        value={filters.size}
        onChange={(event) => onChange('size', event.target.value)}
        options={[{ value: ANY, label: 'Any size' }, ...optionsFromLabels(PET_SIZE_LABELS)]}
      />

      <Input
        label={<FilterLabel icon={Palette}>Colour</FilterLabel>}
        value={filters.color}
        onChange={(event) => onChange('color', event.target.value)}
        placeholder="e.g. brown"
      />

      <Input
        label={<FilterLabel icon={MapPin}>City</FilterLabel>}
        value={filters.city}
        onChange={(event) => onChange('city', event.target.value)}
        placeholder="e.g. Makati"
      />

      <Select
        label={<FilterLabel icon={CircleCheck}>Status</FilterLabel>}
        value={filters.status}
        onChange={(event) => onChange('status', event.target.value)}
        options={[
          { value: ANY, label: 'Any status' },
          ...orderedOptionsFromLabels(REPORT_STATUS_LABELS, REPORT_STATUS_ORDER),
        ]}
      />

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1">
          <FilterLabel icon={CalendarDays}>Date of incident</FilterLabel>
        </legend>
        <Input
          label="From"
          type="date"
          value={filters.dateFrom}
          max={filters.dateTo || todayAsInputValue()}
          onChange={(event) => onChange('dateFrom', event.target.value)}
        />
        <Input
          label="To"
          type="date"
          value={filters.dateTo}
          min={filters.dateFrom || undefined}
          max={todayAsInputValue()}
          onChange={(event) => onChange('dateTo', event.target.value)}
        />
      </fieldset>

      <Button variant="secondary" onClick={onClear} disabled={!hasActiveFilters} fullWidth>
        Clear all filters
      </Button>
    </div>
  )
}

/**
 * A filter's label. The icon is decorative — it makes the panel scannable at a
 * glance, but the word is what carries the meaning.
 */
function FilterLabel({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-fg">
      <Icon size={15} className="shrink-0 text-brand" aria-hidden="true" />
      {children}
    </span>
  )
}
