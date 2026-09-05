import { useId } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Field } from './Field'
import { controlClasses, describedBy } from './formControl'

/**
 * Native select. Deliberately not a custom dropdown — the native control is
 * keyboard accessible, works on mobile, and needs no dependency.
 *
 * Options come from the constant maps in `@/constants` so lists stay
 * data-driven rather than hard-coded in JSX — build them with
 * `optionsFromLabels()` from `@/utils/options`.
 *
 * @param {Object} props
 * @param {string} props.label
 * @param {{ value: string, label: string }[]} props.options
 * @param {string} [props.placeholder] Rendered as a disabled first option.
 * @param {string} [props.id]
 * @param {string} [props.hint]
 * @param {string} [props.error]
 * @param {boolean} [props.required]
 * @param {boolean} [props.hideLabel]
 */
export function Select({
  label,
  options,
  placeholder,
  id,
  hint,
  error,
  required = false,
  hideLabel = false,
  className,
  ...rest
}) {
  const generatedId = useId()
  const selectId = id ?? generatedId

  return (
    <Field
      id={selectId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      hideLabel={hideLabel}
    >
      {/* `appearance-none` strips the native arrow, so one is drawn back in.
          Without it a select is indistinguishable from a text input. */}
      <div className="relative">
        <ChevronDown
          size={18}
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-fg-muted"
        />
        <select
          id={selectId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(selectId, { hint, error })}
          className={cn(
            controlClasses,
            'appearance-none pr-10',
            error ? 'border-danger' : 'border-border-strong',
            className,
          )}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </Field>
  )
}
