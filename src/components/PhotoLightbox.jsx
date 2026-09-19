import { useLayoutEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui'

/**
 * A report photograph at full size — used by the report page and the Possible
 * Matches comparison.
 *
 * Built on the native `<dialog>` for the same reason `Modal` is: Escape, the
 * focus trap and the inert background come from the platform rather than from
 * a library. It is not `Modal` itself because that draws a titled white panel,
 * which is the wrong frame for a photograph.
 *
 * It is only in the page while it is open. It used to sit in the page closed,
 * relying on the browser to hide a closed `<dialog>`; mounting it only when
 * needed means no close button or backdrop can ever be left showing on a
 * normal page. When it closes, focus goes back to whatever opened it.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose  Called on Escape, the close button and a
 *   click on the backdrop. Must set `isOpen` to false.
 * @param {string} props.src
 * @param {string} props.alt
 * @param {number} [props.index]  Zero-based position, when there are several.
 * @param {number} [props.total]
 * @param {(step: 1|-1) => void} [props.onStep]
 */
export function PhotoLightbox({ isOpen, ...props }) {
  if (!isOpen) return null
  return <LightboxDialog {...props} />
}

function LightboxDialog({ onClose, src, alt, index = 0, total = 1, onStep }) {
  const dialogRef = useRef(null)

  // A layout effect, so showModal() runs before the first paint: with a plain
  // effect the dialog could appear for one frame before it became modal.
  useLayoutEffect(() => {
    const dialog = dialogRef.current
    // Remembered before the dialog takes focus, so it can be handed back.
    const opener = document.activeElement
    if (!dialog.open) dialog.showModal()

    // Not dialog.close(): that fires `close`, which tells the parent the
    // photo was dismissed. React's development check mounts, cleans up and
    // mounts again, so closing here shut the viewer the moment it opened.
    // Unmounting removes the element, which ends the modal state without an
    // event.
    return () => opener?.focus?.()
  }, [])

  return (
    <dialog
      ref={dialogRef}
      aria-label={alt || 'Photo'}
      // Escape closes the dialog natively; the resulting `close` event tells
      // the parent, which then removes it.
      onClose={onClose}
      // A click that lands on the dialog itself is a click on the backdrop —
      // the image and controls are children and stop it here.
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose()
      }}
      className="fixed inset-0 flex size-full max-h-none max-w-none items-center justify-center bg-transparent p-0 backdrop:bg-fg/85"
    >
      <div className="relative flex max-h-full max-w-full flex-col items-center gap-3 p-2 sm:p-4">
        <img
          src={src}
          alt={alt}
          className="max-h-[82vh] max-w-[97vw] rounded-card object-contain sm:max-w-[92vw]"
        />

        {total > 1 && onStep && (
          <div className="flex items-center gap-4">
            <Button variant="secondary" size="sm" onClick={() => onStep(-1)}>
              Previous
            </Button>
            <span className="text-sm font-medium text-fg-inverted">
              {index + 1} / {total}
            </span>
            <Button variant="secondary" size="sm" onClick={() => onStep(1)}>
              Next
            </Button>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 flex size-11 items-center justify-center rounded-full bg-panel text-fg shadow-raised hover:bg-surface-muted"
      >
        <X size={20} aria-hidden="true" />
        <span className="sr-only">Close full photo</span>
      </button>
    </dialog>
  )
}
