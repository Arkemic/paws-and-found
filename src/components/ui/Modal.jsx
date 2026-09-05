import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from './Button'

/**
 * Dialog built on the native `<dialog>` element.
 *
 * Using the platform element rather than a hand-rolled overlay gives us the
 * focus trap, the inert background, Escape-to-close and correct dialog
 * semantics for free — which is both more accessible and far easier for the
 * team to explain than a custom implementation (CLAUDE.md §15).
 *
 * The parent owns `isOpen`; this component only reflects it.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose  Called on Escape, backdrop click, and the
 *   close button. Must actually flip `isOpen`, or the dialog reopens.
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {React.ReactNode} [props.footer] Action row, usually Buttons.
 * @param {'sm'|'md'|'lg'} [props.size]
 */
const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  footer,
  size = 'md',
  className,
  children,
}) {
  const dialogRef = useRef(null)
  const titleId = useId()
  const descriptionId = useId()

  // Reflect `isOpen` onto the element. showModal()/close() are imperative, so
  // this is one of the few places a ref is the right tool.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen && !dialog.open) {
      dialog.showModal()
    } else if (!isOpen && dialog.open) {
      dialog.close()
    }
  }, [isOpen])

  // The browser fires `close` for Escape too, so this covers every exit route.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const handleClose = () => onClose?.()
    dialog.addEventListener('close', handleClose)
    return () => dialog.removeEventListener('close', handleClose)
  }, [onClose])

  // A click that lands on the dialog element itself is a click on the backdrop:
  // the panel inside stops it from reaching here.
  const handleBackdropClick = (event) => {
    if (event.target === dialogRef.current) onClose?.()
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClick={handleBackdropClick}
      className={cn(
        // `m-auto` is what centres it. A native dialog is centred by the browser's
        // own `margin: auto`, and Tailwind's reset sets `margin: 0` on every
        // element — which silently pinned every dialog to the top-left corner.
        'm-auto w-[calc(100%-2rem)] rounded-card border border-border bg-panel p-0 text-fg shadow-lg',
        // A tall dialog scrolls inside itself instead of running off a short
        // screen. `overflow-x-hidden` is required, not decoration: a box with
        // `auto` on one axis promotes `visible` on the other to `auto` too,
        // which put a stray horizontal scrollbar along the bottom.
        'max-h-[calc(100dvh-2rem)] overflow-x-hidden overflow-y-auto',
        'backdrop:bg-black/40',
        SIZES[size],
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h2 id={titleId} className="text-base font-semibold">
            {title}
          </h2>
          {description && (
            <p id={descriptionId} className="mt-0.5 text-sm text-fg-muted">
              {description}
            </p>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close dialog">
          <X size={16} aria-hidden="true" />
        </Button>
      </div>

      <div className="px-4 py-4">{children}</div>

      {footer && (
        <div className="flex flex-wrap justify-end gap-2 border-t border-border px-4 py-3">
          {footer}
        </div>
      )}
    </dialog>
  )
}
