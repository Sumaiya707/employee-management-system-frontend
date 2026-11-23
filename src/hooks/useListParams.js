import { useSearchParams } from 'react-router'

// List filters kept in the address bar (?page=2&status=active), so page reloads
// and coming back to the page keep the same view. Changing a filter resets the page.
//
// Filter changes REPLACE the current address instead of adding a new history
// entry, so the browser Back button leaves the list page instead of stepping
// back through every filter change.
export function useListParams(defaults) {
  const [searchParams, setSearchParams] = useSearchParams()

  // Each filter: its value from the address bar, or its default when missing.
  const params = {}
  for (const [key, fallback] of Object.entries(defaults)) {
    const valueInAddressBar = searchParams.get(key)
    if (valueInAddressBar === null) {
      params[key] = fallback
    } else {
      params[key] = valueInAddressBar
    }
  }

  // The page number: a positive number from the address bar, otherwise page 1.
  const pageInAddressBar = Number(searchParams.get('page'))
  params.page = 1
  if (pageInAddressBar > 0) {
    params.page = pageInAddressBar
  }

  // Sets one filter. An empty or default value is removed from the address bar.
  function setParam(key, value) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (value === '' || value === null || value === undefined || value === defaults[key]) {
          next.delete(key)
        } else {
          next.set(key, String(value))
        }
        // Any filter change starts again at page 1.
        if (key !== 'page') next.delete('page')
        return next
      },
      { replace: true },
    )
  }

  // Removes the given filters (used by "Clear filters").
  function clear(keys) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        for (const key of keys) next.delete(key)
        next.delete('page')
        return next
      },
      { replace: true },
    )
  }

  return { params, setParam, clear, searchParams, setSearchParams }
}
