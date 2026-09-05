/**
 * The HTTP client every service uses to reach the PHP API.
 *
 * One place that knows about `fetch`, credentials and error handling, so no
 * component ever calls the network directly and the services stay the only
 * boundary (CLAUDE.md §9).
 */

/**
 * Vite bundles the seeded photographs with hashed filenames, but the database
 * stores the plain name ('pet-012-dog.jpg'). This maps one to the other.
 *
 * `eager: true` means the map is built at compile time, so a lookup is just an
 * object read. Photos uploaded through the form later will be served by Apache
 * and will not need this — the map only covers the demonstration set.
 */
const bundledPhotos = import.meta.glob('@/assets/pet-*.{jpg,png}', {
  eager: true,
  query: '?url',
  import: 'default',
})

const photoByFilename = Object.fromEntries(
  Object.entries(bundledPhotos).map(([path, url]) => [path.split('/').pop(), url]),
)

/** Resolve a stored image filename to something an `<img src>` can load. */
export function assetUrl(filename) {
  if (!filename) return null
  return photoByFilename[filename] ?? `/api/uploads/${filename}`
}

/**
 * Call the API and return the decoded JSON.
 *
 * `credentials: 'include'` is what carries the PHP session cookie. Without it
 * every request would look anonymous and the workspaces would 401.
 */
export async function apiFetch(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    ...options,
  })

  // A 204 has no body to parse.
  if (response.status === 204) return null

  let payload
  try {
    payload = await response.json()
  } catch {
    throw new Error('The server sent a response that could not be read.')
  }

  if (!response.ok) {
    // The API always answers errors as { error: "..." }, written for a person.
    throw new Error(payload?.error ?? 'The request failed.')
  }

  return payload
}

/** Build a query string, leaving out anything empty. */
export function queryString(params) {
  const search = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value))
    }
  }

  const text = search.toString()
  return text ? `?${text}` : ''
}
