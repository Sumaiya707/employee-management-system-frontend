// My Profile (backend: routes/profile.routes.js).
import { baseApi } from '@/api/baseApi'

export const profileApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /api/profile (profile:view) → { account, employee } (employee is null
    // for accounts without an employee record, e.g. HR and Super Admin).
    getProfile: build.query({
      query: () => '/profile',
      transformResponse: (response) => response.data,
      providesTags: ['Profile'],
    }),

    // PATCH /api/profile (profile:update): phone, address, emergencyContact only.
    updateProfile: build.mutation({
      query: (body) => ({ url: '/profile', method: 'PATCH', body: body }),
      invalidatesTags: ['Profile', 'Dashboard'],
    }),
  }),
})

export const { useGetProfileQuery, useUpdateProfileMutation } = profileApi
