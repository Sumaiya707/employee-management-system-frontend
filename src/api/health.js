// Calls the EMS backend health check: GET /api/health
//
// API_BASE_URL is "/api" by default. In development Vite forwards /api to the
// backend (see vite.config.js). A build that talks to an API on another address
// can set VITE_API_BASE_URL when building, e.g. https://api.example.com/api
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// Thrown when the backend cannot be reached at all (not running, wrong address,
// or the development proxy could not connect).
export class BackendUnreachableError extends Error {}

// Thrown when the backend answered, but not with a successful health result.
export class BackendResponseError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

/**
 * Returns the health data, e.g. { status: "ok", database: "connected", time: "..." }.
 * @param {AbortSignal} [signal] cancels the request (used when the page unmounts)
 */
export async function fetchHealth(signal) {
  let response
  try {
    response = await fetch(API_BASE_URL + '/health', {
      // Always send cookies: the EMS login session is an httpOnly cookie, and
      // every API call will need it once login is built.
      credentials: 'include',
      headers: { Accept: 'application/json' },
      signal: signal,
    })
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error
    }
    throw new BackendUnreachableError('The backend cannot be reached. Is it running?')
  }

  // Every EMS API answer is JSON: { success, message, data }.
  let body
  try {
    body = await response.json()
  } catch (error) {
    // The request can also be cancelled while the body is still being read.
    // That is a cancellation, not a backend problem, so pass it on unchanged.
    if (error.name === 'AbortError') {
      throw error
    }
    body = null
  }

  if (body === null) {
    // No JSON at all: in development this is the proxy saying the backend is down.
    throw new BackendUnreachableError('The backend did not answer (HTTP ' + response.status + '). Is it running?')
  }
  if (!response.ok || body.success !== true) {
    throw new BackendResponseError(body.message || 'The backend answered with HTTP ' + response.status, response.status)
  }
  return body.data
}
