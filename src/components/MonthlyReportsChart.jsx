/**
 * Reports filed per month, lost beside found.
 *
 * Drawn with plain elements rather than a charting library: six months of two
 * numbers does not justify a dependency, and every part of this is something a
 * member can explain during the defence (CLAUDE.md §15).
 *
 * Bars are measured against the tallest single value rather than the tallest
 * month, so the two series stay comparable to each other.
 *
 * The drawing is `aria-hidden` and the same figures are given as a table for
 * screen readers — a chart with no text alternative is not readable at all.
 *
 * @param {Object} props
 * @param {{month: string, label: string, lost: number, found: number, total: number}[]} props.months
 */
export function MonthlyReportsChart({ months }) {
  // Never zero, or every bar would divide by it.
  const peak = Math.max(1, ...months.map((month) => Math.max(month.lost, month.found)))
  const height = (value) => `${(value / peak) * 100}%`

  const filed = months.reduce((sum, month) => sum + month.total, 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="flex items-center gap-1.5 text-fg-muted">
          <span aria-hidden="true" className="size-2.5 rounded-xs bg-lost" />
          Lost
        </span>
        <span className="flex items-center gap-1.5 text-fg-muted">
          <span aria-hidden="true" className="size-2.5 rounded-xs bg-found" />
          Found
        </span>
      </div>

      <div aria-hidden="true" className="flex items-end gap-2 sm:gap-4">
        {months.map((month) => (
          <div key={month.month} className="flex flex-1 flex-col items-center gap-2">
            <span className="text-sm font-medium text-fg tabular-nums">{month.total}</span>

            <div className="flex h-32 w-full items-end justify-center gap-1">
              {/* A month with no reports draws no bar, which is the honest
                  reading — not a stub that suggests something happened. */}
              <span
                className="w-2.5 rounded-t-xs bg-lost sm:w-3.5"
                style={{ height: height(month.lost) }}
              />
              <span
                className="w-2.5 rounded-t-xs bg-found sm:w-3.5"
                style={{ height: height(month.found) }}
              />
            </div>

            <span className="text-xs text-fg-muted">{month.label}</span>
          </div>
        ))}
      </div>

      <table className="sr-only">
        <caption>Reports filed per month, over the last six months</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Lost</th>
            <th scope="col">Found</th>
            <th scope="col">Total</th>
          </tr>
        </thead>
        <tbody>
          {months.map((month) => (
            <tr key={month.month}>
              <th scope="row">{month.month}</th>
              <td>{month.lost}</td>
              <td>{month.found}</td>
              <td>{month.total}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="text-sm text-fg-muted">
        {filed} {filed === 1 ? 'report' : 'reports'} filed in the last six months.
      </p>
    </div>
  )
}
