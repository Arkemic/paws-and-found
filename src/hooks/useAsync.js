import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Run an async service call and expose { data, error, isLoading, reload }.
 *
 * Every service method is asynchronous even while it reads mock data, so pages
 * are forced to handle loading and error states from the start rather than
 * having them retrofitted when the real backend arrives (CLAUDE.md §20).
 *
 * The callback must be stable — wrap it in `useCallback` in the caller, or
 * define it outside the component — otherwise it re-runs on every render.
 *
 * @template T
 * @param {() => Promise<T>} asyncFn
 * @param {{ immediate?: boolean }} [options]
 * @returns {{ data: T|null, error: Error|null, isLoading: boolean, reload: () => Promise<void> }}
 *
 * @example
 * const load = useCallback(() => petService.getRecentReports(6), [])
 * const { data: reports, error, isLoading } = useAsync(load)
 */
export function useAsync(asyncFn, options = {}) {
  const { immediate = true } = options

  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(immediate)

  // Guards against setting state after the component has unmounted, and against
  // a slow earlier request overwriting a newer one.
  const isMountedRef = useRef(true)
  const requestIdRef = useRef(0)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const reload = useCallback(async () => {
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId

    setIsLoading(true)
    setError(null)

    try {
      const result = await asyncFn()
      if (!isMountedRef.current || requestIdRef.current !== requestId) return
      setData(result)
    } catch (caught) {
      if (!isMountedRef.current || requestIdRef.current !== requestId) return
      setError(caught instanceof Error ? caught : new Error(String(caught)))
    } finally {
      if (isMountedRef.current && requestIdRef.current === requestId) {
        setIsLoading(false)
      }
    }
  }, [asyncFn])

  useEffect(() => {
    // react-hooks/set-state-in-effect fires because `reload` sets isLoading
    // before its first await. That warning is aimed at state that could be
    // derived during render; here the effect is genuinely synchronising with an
    // external system (the data source), which is the sanctioned use of an
    // effect. The alternative — a data-fetching library or a router loader — is
    // more machinery than this project needs (CLAUDE.md §15). Revisit if the
    // real backend arrives with a client that provides its own hooks.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (immediate) reload()
  }, [immediate, reload])

  return { data, error, isLoading, reload }
}
