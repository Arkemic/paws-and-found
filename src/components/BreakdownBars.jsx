import { cn } from '@/utils/cn'

/**
 * A labelled list of proportion bars — "where reports stand", "which animals
 * get reported most".
 *
 * The bar is `aria-hidden`: it shows nothing the number beside it does not
 * already say, and announcing a decorative box helps nobody. The label and the
 * figure are real text, so the whole thing reads correctly with styles off.
 *
 * @param {Object} props
 * @param {{key: string, label: string, value: number, barClassName: string}[]} props.rows
 * @param {number} [props.total]  Denominator for the widths. Defaults to the sum
 *   of the rows, which is what you want unless the rows are a subset of a larger
 *   whole.
 */
export function BreakdownBars({ rows, total, className }) {
  const denominator = total ?? rows.reduce((sum, row) => sum + row.value, 0)

  return (
    <dl className={cn('flex flex-col gap-3', className)}>
      {rows.map((row) => {
        const share = denominator === 0 ? 0 : Math.round((row.value / denominator) * 100)

        return (
          <div key={row.key} className="flex items-center gap-4">
            <dt className="w-32 shrink-0 text-sm text-fg sm:w-36">{row.label}</dt>
            <dd className="flex flex-1 items-center gap-3">
              <span
                aria-hidden="true"
                className="h-2 flex-1 overflow-hidden rounded-pill bg-surface-muted"
              >
                <span
                  className={cn('block h-full rounded-pill', row.barClassName)}
                  style={{ width: `${share}%` }}
                />
              </span>
              <span className="w-8 shrink-0 text-right font-medium text-fg tabular-nums">
                {row.value}
              </span>
            </dd>
          </div>
        )
      })}
    </dl>
  )
}
