// Turns any RTK Query error into { status, message, fieldErrors } with a
// message that is safe and understandable to show to a user.
//
// RTK Query (fetchBaseQuery) errors look like:
//   { status: 422, data: { success: false, message, data: { errors } } }  backend answered
//   { status: 'FETCH_ERROR', error }        no connection at all
//   { status: 'PARSING_ERROR', originalStatus, data }  answer was not JSON (e.g. proxy error page)
//   { status: 'TIMEOUT_ERROR', error }

export const NETWORK_MESSAGE = 'Cannot reach the server. Check your connection and try again.'
export const SERVER_DOWN_MESSAGE = 'The server is not responding right now. Please try again in a moment.'
export const SERVER_ERROR_MESSAGE = 'Something went wrong on the server. Please try again.'

export function normalizeError(error) {
  if (!error) {
    return { status: null, message: SERVER_ERROR_MESSAGE, fieldErrors: {} }
  }

  if (error.status === 'FETCH_ERROR' || error.status === 'TIMEOUT_ERROR') {
    return { status: 'network', message: NETWORK_MESSAGE, fieldErrors: {} }
  }

  if (error.status === 'PARSING_ERROR') {
    // In development the Vite proxy answers 502/504 with a non-JSON page when
    // the backend is not running.
    return { status: error.originalStatus || 'network', message: SERVER_DOWN_MESSAGE, fieldErrors: {} }
  }

  if (typeof error.status === 'number') {
    const body = error.data || {}
    const fieldErrors = (body.data && body.data.errors) || {}
    // 5xx: the backend shows its internal error text in development; never show it.
    if (error.status >= 500) {
      return { status: error.status, message: SERVER_ERROR_MESSAGE, fieldErrors: {} }
    }
    let message = body.message
    if (!message) {
      message = defaultMessageFor(error.status)
    }
    return { status: error.status, message: message, fieldErrors: fieldErrors }
  }

  return { status: null, message: SERVER_ERROR_MESSAGE, fieldErrors: {} }
}

function defaultMessageFor(status) {
  if (status === 401) return 'Please log in to continue.'
  if (status === 403) return 'You do not have permission to do this.'
  if (status === 404) return 'This record was not found.'
  if (status === 409) return 'This conflicts with existing data.'
  if (status === 422) return 'Please check the highlighted fields.'
  if (status === 429) return 'Too many attempts. Please wait and try again.'
  return SERVER_ERROR_MESSAGE
}

// Copies backend field errors ({ "emergencyContact.phone": "..." }) onto a
// React Hook Form. Returns true if at least one field error was shown.
// Errors for fields that are not on the form are left for the caller to show.
export function applyFieldErrors(fieldErrors, setError, knownFields) {
  let applied = false
  for (const [field, message] of Object.entries(fieldErrors || {})) {
    if (!knownFields || knownFields.includes(field) || knownFields.includes(field.split('.')[0])) {
      setError(field, { type: 'server', message: message })
      applied = true
    }
  }
  return applied
}
