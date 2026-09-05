import { useId } from 'react'
import { cn } from '@/utils/cn'
import { Field } from './Field'
import { controlClasses, describedBy } from './formControl'

/**
 * Single-line text input with its label, hint and error handled for you.
 *
 * @param {Object} props
 * @param {string} props.label
 * @param {string} [props.id]     Generated when omitted.
 * @param {string} [props.hint]
 * @param {string} [props.error]  Presence marks the control invalid.
 * @param {boolean} [props.required]
 */
export function Input({ label, id, hint, error, required = false, className, ...rest }) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <Field id={inputId} label={label} hint={hint} error={error} required={required}>
      <input
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(inputId, { hint, error })}
        className={cn(
          controlClasses,
          error ? 'border-danger' : 'border-border-strong',
          className,
        )}
        {...rest}
      />
    </Field>
  )
}
