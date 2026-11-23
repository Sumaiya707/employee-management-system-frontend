// Session events raised by the API layer (src/api/baseApi.js). They live in
// their own file so the API layer and the auth slice do not import each other.
import { createAction } from '@reduxjs/toolkit'

// The backend answered 401 to a normal request: the session ended (expired,
// logged out elsewhere, account deactivated). Payload: the backend's message.
export const sessionEnded = createAction('auth/sessionEnded')

// The backend answered 403 "You must change your password before continuing."
export const passwordChangeRequired = createAction('auth/passwordChangeRequired')
