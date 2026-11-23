// Designations (backend: routes/designation.routes.js).
// designations:view lists and views them; designations:manage creates, edits and
// activates/deactivates them. Designations are never deleted.
import { baseApi, listResult, toQueryString } from '@/api/baseApi'

export const designationsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /api/designations?page&limit&search&status&sort
    listDesignations: build.query({
      query: (params) => '/designations' + toQueryString(params),
      transformResponse: listResult,
      providesTags: ['Designation'],
    }),

    // POST /api/designations { name, description }
    createDesignation: build.mutation({
      query: (body) => ({ url: '/designations', method: 'POST', body: body }),
      transformResponse: (response) => response.data.designation,
      invalidatesTags: ['Designation'],
    }),

    // PATCH /api/designations/:id — name and/or description (only the changes).
    // Employees show the designation name, so their cached data is refreshed too.
    updateDesignation: build.mutation({
      query: ({ id, changes }) => ({ url: '/designations/' + id, method: 'PATCH', body: changes }),
      transformResponse: (response) => response.data.designation,
      invalidatesTags: ['Designation', 'Employee', 'Profile'],
    }),

    // PATCH /api/designations/:id/status { isActive }
    setDesignationStatus: build.mutation({
      query: ({ id, isActive }) => ({ url: '/designations/' + id + '/status', method: 'PATCH', body: { isActive: isActive } }),
      transformResponse: (response) => response.data.designation,
      invalidatesTags: ['Designation', 'Employee', 'Profile'],
    }),
  }),
})

export const { useListDesignationsQuery, useCreateDesignationMutation, useUpdateDesignationMutation, useSetDesignationStatusMutation } = designationsApi
