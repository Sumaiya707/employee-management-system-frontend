// Who is logged in, as last confirmed by the backend.
//
// status:
//   "checking"     the first GET /api/auth/me has not answered yet
//   "authenticated" the backend confirmed a session; user = data.user from the backend
//   "guest"        no session (or it ended)
//   "unreachable"  the first check could not reach the server
//
// The user object (including role and permissions) always comes from the
// backend's login or /auth/me answer. Nothing is stored in localStorage.
import { createSlice, isAnyOf } from '@reduxjs/toolkit'
import { authApi } from './authApi'
import { passwordChangeRequired, sessionEnded } from './sessionActions'

const initialState = {
  status: 'checking',
  user: null,
  // A message for the login page, e.g. "Your session has expired."
  notice: null,
}

// createSlice builds the reducer and its actions in one place. Inside these
// functions the code may "change" state directly (state.user = ...): Redux
// Toolkit turns that into a safe, new state object behind the scenes.
const authSlice = createSlice({
  name: 'auth',
  initialState: initialState,
  // Actions owned by this slice (exported below as clearNotice and retrySessionCheck).
  reducers: {
    clearNotice(state) {
      state.notice = null
    },
    retrySessionCheck(state) {
      state.status = 'checking'
    },
  },
  // Reactions to actions that are created ELSEWHERE: the session events from
  // sessionActions.js and the results of the RTK Query requests in authApi.js.
  //   addCase    reacts to one exact action.
  //   addMatcher reacts to every action a "matcher" test accepts. RTK Query
  //              gives each request ready-made tests, e.g. matchFulfilled
  //              (the request succeeded) and matchRejected (it failed).
  extraReducers: (builder) => {
    builder
      // The API layer saw a 401 on a normal request (see src/api/baseApi.js).
      .addCase(sessionEnded, (state, action) => {
        state.status = 'guest'
        state.user = null
        state.notice = action.payload || 'Your session has ended. Please log in again.'
      })
      // The backend refused a request until the password is changed (rule P1).
      .addCase(passwordChangeRequired, (state) => {
        if (state.user) {
          state.user.mustChangePassword = true
        }
      })
      // A successful login OR a successful /auth/me: both answer with the user.
      // isAnyOf joins the two tests so one reducer handles both.
      // action.payload is the user (authApi.js keeps only data.user).
      .addMatcher(isAnyOf(authApi.endpoints.getMe.matchFulfilled, authApi.endpoints.login.matchFulfilled), (state, action) => {
        state.status = 'authenticated'
        state.user = action.payload
        state.notice = null
      })
      // /auth/me failed. action.payload is the error: { status, data }, where
      // data is the backend's answer, e.g. { success: false, message: "..." }.
      .addMatcher(authApi.endpoints.getMe.matchRejected, (state, action) => {
        // Cancelled or skipped requests carry no answer: nothing changes.
        if (!action.payload) {
          return
        }
        // 401: there is no valid session (never logged in, or it expired).
        if (action.payload.status === 401) {
          // Only show a message if the user was logged in a moment ago.
          if (state.status === 'authenticated') {
            state.notice = (action.payload.data && action.payload.data.message) || 'Your session has ended. Please log in again.'
          }
          state.status = 'guest'
          state.user = null
        } else if (state.status === 'checking') {
          // Only the very first check decides "unreachable"; a failed refresh
          // later keeps the confirmed session until the backend says otherwise.
          state.status = 'unreachable'
        }
      })
      // Logged out only after the backend confirmed it (the cookie is cleared there).
      .addMatcher(authApi.endpoints.logout.matchFulfilled, (state) => {
        state.status = 'guest'
        state.user = null
        state.notice = 'You have been logged out.'
      })
      // Own password changed: the forced password change (if any) is done.
      .addMatcher(authApi.endpoints.changePassword.matchFulfilled, (state) => {
        if (state.user) {
          state.user.mustChangePassword = false
        }
      })
  },
})

export const { clearNotice, retrySessionCheck } = authSlice.actions
export default authSlice.reducer

// Selectors: small functions that read this slice from the whole Redux store.
export const selectAuth = (state) => state.auth
export const selectUser = (state) => state.auth.user
