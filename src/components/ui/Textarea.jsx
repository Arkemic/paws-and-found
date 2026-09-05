import { useId } from 'react'
import { cn } from '@/utils/cn'
import { Field } from './Field'
import { controlClasses, describedBy } from './formControl'

/**
 * Multi-line text input, for descriptions and distinctive markings.
 *
 * @param {Object} props
 * @param {string} props.label
 * @param {string} [props.id]
 * @param {string} [props.hint]
 * @param {string} [props.error]
 * @param {boolean} [props.required]
 * @param {number} [props.rows]
 */
export function Textarea({
  label,
  id,
  hint,
  error,
  required = false,
  rows = 4,
  className,
  ...rest
}) {
  const generatedId = useId()
  const textareaId = id ?? generatedId

  return (
    <Field id={textareaId} label={label} hint={hint} error={error} required={required}>
      <textarea
        id={textareaId}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(textareaId, { hint, error })}
        className={cn(
          controlClasses,
          'resize-y',
          error ? 'border-danger' : 'border-border-strong',
          className,
        )}
        {...rest}
      />
    </Field>
  )
}
