import { useId } from 'react'
import { cn } from '@/utils/cn'

/**
 * Checkbox with its label and optional hint.
 *
 * Laid out label-beside-control rather than label-above, which is why it does
 * not reuse `Field` like the text inputs do.
 *
 * @param {Object} props
 * @param {string} props.label
 * @param {string} [props.hint]
 * @param {string} [props.id]
 */
export function Checkbox({ label, hint, id, className, ...rest }) {
  const generatedId = useId()
  const checkboxId = id ?? generatedId

  return (
    <div className={cn('flex items-start gap-2', className)}>
      <input
        id={checkboxId}
        type="checkbox"
        aria-describedby={hint ? `${checkboxId}-hint` : undefined}
        className="mt-0.5 size-4 shrink-0 rounded-sm border-border-strong accent-brand"
        {...rest}
      />
      <div className="flex flex-col">
        <label htmlFor={checkboxId} className="text-sm text-fg">
          {label}
        </label>
        {hint && (
          <p id={`${checkboxId}-hint`} className="text-sm text-fg-muted">
            {hint}
          </p>
        )}
      </div>
    </div>
  )
}
