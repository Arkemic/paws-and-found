import { useRef, useState } from 'react'
import { ImagePlus, Star, Trash2 } from 'lucide-react'
import photoPlaceholder from '@/assets/pet-photo-placeholder.png'
import { Button, Input } from '@/components/ui'
import { createId } from '@/utils/id'
import { LIMITS, PHOTO_RULES } from './reportFormModel'

/**
 * Step 3 — photographs.
 *
 * NOTHING IS UPLOADED. Files are held in memory and previewed with
 * `URL.createObjectURL`, which is enough to build and demonstrate the whole
 * flow. Real storage arrives with the backend (CLAUDE.md §8). Object URLs are
 * revoked when a photo is removed so the tab does not leak memory.
 *
 * Photos are optional on purpose: a finder often has no chance to take one, and
 * refusing the report would lose the sighting entirely.
 */
export function PhotosStep({ values, onChange }) {
  const [fileErrors, setFileErrors] = useState([])
  const inputRef = useRef(null)

  const addFiles = (fileList) => {
    const incoming = Array.from(fileList)
    const problems = []
    const accepted = []

    for (const file of incoming) {
      if (values.photos.length + accepted.length >= PHOTO_RULES.maxCount) {
        problems.push(`You can add up to ${PHOTO_RULES.maxCount} photos.`)
        break
      }
      if (!PHOTO_RULES.acceptedTypes.includes(file.type)) {
        problems.push(`${file.name} is not a JPEG, PNG or WebP image.`)
        continue
      }
      if (file.size > PHOTO_RULES.maxBytes) {
        problems.push(`${file.name} is larger than 5 MB.`)
        continue
      }

      accepted.push({
        id: createId('photo'),
        url: URL.createObjectURL(file),
        alt: '',
        // The first photo added becomes the primary one by default.
        isPrimary: values.photos.length + accepted.length === 0,
      })
    }

    setFileErrors(problems)
    if (accepted.length > 0) onChange('photos', [...values.photos, ...accepted])

    // Clear the input so choosing the same file again still fires a change.
    if (inputRef.current) inputRef.current.value = ''
  }

  const removePhoto = (id) => {
    const photo = values.photos.find((item) => item.id === id)
    // Only object URLs need revoking; a seeded photo has no url at all.
    if (photo?.url?.startsWith('blob:')) URL.revokeObjectURL(photo.url)

    const remaining = values.photos.filter((item) => item.id !== id)
    // Never leave a set of photos without a primary one.
    if (remaining.length > 0 && !remaining.some((item) => item.isPrimary)) {
      remaining[0] = { ...remaining[0], isPrimary: true }
    }

    onChange('photos', remaining)
  }

  const setPrimary = (id) => {
    onChange(
      'photos',
      values.photos.map((photo) => ({ ...photo, isPrimary: photo.id === id })),
    )
  }

  const updateAlt = (id, alt) => {
    onChange(
      'photos',
      values.photos.map((photo) => (photo.id === id ? { ...photo, alt } : photo)),
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-card border-2 border-dashed border-border-strong bg-surface-alt px-6 py-10 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-panel text-brand shadow-card">
          <ImagePlus size={26} aria-hidden="true" />
        </span>
        <p className="mt-4 text-lg font-semibold text-fg">Add photos</p>
        <p className="mx-auto mt-1.5 max-w-prose text-fg-muted">
          A clear, well-lit picture of the whole animal is the single most useful thing you
          can add — it is what people recognise, and what a coordinator compares.
        </p>
        <p className="mt-1 text-sm text-fg-muted">
          Up to {PHOTO_RULES.maxCount} images · JPEG, PNG or WebP · 5 MB each
        </p>

        <input
          ref={inputRef}
          id="report-photos"
          type="file"
          multiple
          accept={PHOTO_RULES.accept}
          onChange={(event) => addFiles(event.target.files)}
          className="sr-only"
        />
        <Button as="label" htmlFor="report-photos" className="mt-5 cursor-pointer">
          Choose photos
        </Button>
      </div>

      {fileErrors.length > 0 && (
        <ul role="alert" className="flex flex-col gap-1 text-sm text-danger">
          {fileErrors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}

      {values.photos.length === 0 ? (
        <p className="text-fg-muted">
          No photos yet. You can still submit the report without one — a description alone
          still helps.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {values.photos.map((photo, index) => (
            <li
              key={photo.id}
              className="flex flex-col gap-4 rounded-card border border-border bg-panel p-4 shadow-card sm:flex-row"
            >
              {/* Seeded reports have no image file, so an edited report can
                  carry a photo entry with a null url. */}
              <div className="relative shrink-0 sm:w-52">
                <img
                  src={photo.url ?? photoPlaceholder}
                  alt={photo.alt || `Photo ${index + 1}, not yet described`}
                  className="aspect-4/3 w-full rounded-control bg-surface-muted object-cover"
                />
                {photo.isPrimary && (
                  <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-pill bg-panel/90 px-2.5 py-1 text-xs font-medium text-brand-hover shadow-card backdrop-blur-sm">
                    <Star size={12} aria-hidden="true" />
                    Main photo
                  </span>
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <Input
                  label={`Describe photo ${index + 1}`}
                  value={photo.alt}
                  onChange={(event) => updateAlt(photo.id, event.target.value)}
                  maxLength={LIMITS.photoAlt}
                  placeholder="e.g. Brown Shih Tzu sitting on a tiled floor"
                  hint="Used by screen readers, and helps people scanning quickly."
                />

                <div className="flex flex-wrap items-center gap-2">
                  {!photo.isPrimary && (
                    <Button size="sm" variant="secondary" onClick={() => setPrimary(photo.id)}>
                      Make main photo
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removePhoto(photo.id)}
                    className="text-danger"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                    Remove
                    <span className="sr-only"> photo {index + 1}</span>
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
