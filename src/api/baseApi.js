// The one RTK Query API for the EMS backend. Feature files add their endpoints
// with baseApi.injectEndpoints(...).
//
// - Every request goes to /api (Vite forwards it to the backend in development;
//   VITE_API_BASE_URL can point a build at another address).
// - credentials: "include" sends the HttpOnly ems_token cookie. The token is
//   never read or stored by this app.
// - A 401 on any request except login / me / logout means the session ended:
//   the app clears its state and shows the login page.
// - A 403 with errors.mustChangePassword sends the user to the password page.
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { passwordChangeRequired, sessionEnded } from '@/features/auth/sessionActions'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// The basic request function every endpoint uses: a small wrapper around the
// browser's fetch() with shared settings.
const rawBaseQuery = fetchBaseQuery({
  // Put in front of every endpoint path: '/employees' becomes '/api/employees'.
  baseUrl: API_BASE_URL,
  // Tells the browser to send (and accept) cookies with every request, so the
  // HttpOnly login cookie travels along. JavaScript itself cannot read it.
  credentials: 'include',
  // Give up after 20 seconds (reported as a TIMEOUT_ERROR).
  timeout: 20000,
  // Headers added to every request: we always want JSON back.
  prepareHeaders: (headers) => {
    headers.set('Accept', 'application/json')
    return headers
  },
})

// Requests whose 401 is an expected answer, not "session ended".
const SESSION_ENDPOINTS = ['login', 'getMe', 'logout']

// Every request goes through this function: it sends the request with
// rawBaseQuery, then checks the answer for an ended session.
//   api.endpoint  the name of the request, e.g. 'listEmployees'
//   api.dispatch  sends an action to the Redux store
// The 401 of login (wrong password), /auth/me (not logged in yet) and logout
// is handled by the login page and authSlice.js instead.
async function baseQueryWithSession(args, api, extraOptions) {
  const result = await rawBaseQuery(args, api, extraOptions)
  // On failure, error is { status, data }; data is the backend's JSON answer.
  const error = result.error

  if (error && !SESSION_ENDPOINTS.includes(api.endpoint)) {
    // 401: the session expired or was ended elsewhere. authSlice.js reacts to
    // sessionEnded by clearing the user, and the route guard shows the login page.
    if (error.status === 401) {
      const message = (error.data && error.data.message) || 'Your session has ended. Please log in again.'
      api.dispatch(sessionEnded(message))
      // Forget every cached answer of the previous session.
      // (baseApi is defined below; it exists by the time a request runs.)
      api.dispatch(baseApi.util.resetApiState())
    } else if (error.status === 403 && error.data && error.data.data && error.data.data.errors && error.data.data.errors.mustChangePassword) {
      // A 403 whose answer contains data.errors.mustChangePassword: the user
      // must change the password first (rule P1). Each part is checked one by
      // one because other 403 answers do not have them.
      api.dispatch(passwordChangeRequired())
    }
  }
  return result
}

export const baseApi = createApi({
  // Where RTK Query keeps its cache of answers inside the Redux store (state.api).
  reducerPath: 'api',
  // Every endpoint sends its request through the function above.
  baseQuery: baseQueryWithSession,
  // Labels for cached data. A query "provides" a label (e.g. 'Employee'); a
  // change "invalidates" it, and RTK Query then loads that data again.
  tagTypes: ['Session', 'Dashboard', 'Profile', 'Employee', 'Attendance', 'Leave', 'User', 'Role', 'Permission', 'Department', 'Designation'],
  // Data can change from other people's work; refresh lists when they are shown again.
  // (Reload when a page opens if the cached answer is older than 30 seconds.)
  refetchOnMountOrArgChange: 30,
  // Empty here: each feature adds its own endpoints with injectEndpoints().
  endpoints: () => ({}),
})

// Builds a query string from an object, leaving out empty values.
export function toQueryString(params) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params || {})) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value))
    }
  }
  const text = search.toString()
  return text ? '?' + text : ''
}

// List endpoints answer { data: [...], meta: { page, limit, total, totalPages } }.
export function listResult(response) {
  return { items: response.data || [], meta: response.meta || { page: 1, limit: 10, total: 0, totalPages: 0 } }
}
