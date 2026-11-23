// Authentication endpoints (backend: routes/auth.routes.js).
import { baseApi } from '@/api/baseApi'

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /api/auth/me → { data: { user } }. Restores the session after a reload.
    getMe: build.query({
      query: () => '/auth/me',
      transformResponse: (response) => response.data.user,
      providesTags: ['Session'],
    }),

    // POST /api/auth/login { email, password } → { data: { user } } + Set-Cookie
    login: build.mutation({
      query: (body) => ({ url: '/auth/login', method: 'POST', body: body }),
      transformResponse: (response) => response.data.user,
    }),

    // POST /api/auth/logout → always 200; clears the cookie and ends the session.
    logout: build.mutation({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
          dispatch(baseApi.util.resetApiState())
        } catch {
          // Logout failed (e.g. no connection): keep the session, the page shows the error.
        }
      },
    }),

    // PATCH /api/auth/password { currentPassword, newPassword, confirmPassword }
    // The backend ends other sessions and sends a new cookie for this one.
    changePassword: build.mutation({
      query: (body) => ({ url: '/auth/password', method: 'PATCH', body: body }),
      invalidatesTags: ['Session', 'Profile'],
    }),
  }),
})

export const { useGetMeQuery, useLoginMutation, useLogoutMutation, useChangePasswordMutation } = authApi
