// Leave types (backend: routes/leaveType.routes.js).
// Only the Super Admin lists, creates, edits and activates/deactivates them;
// leave:request reads the active ones for the leave request form.
//
// How these requests work (RTK Query):
//   query             -> a request that READS data (GET); its answer is kept in a cache
//   mutation          -> a request that CHANGES data (POST / PATCH)
//   transformResponse -> keeps only the part of the answer the pages need
//   providesTags      -> labels the cached answer, e.g. 'LeaveType'
//   invalidatesTags   -> after a change, every cached answer with that label is
//                        loaded again, so the lists on screen show the new data
// Each endpoint automatically gets a "hook" for the pages, e.g. listLeaveTypes ->
// useListLeaveTypesQuery (see the export at the bottom).
import { baseApi, listResult, toQueryString } from '@/api/baseApi'

export const leaveTypesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /api/leave-types?page&limit&search&status&sort (Super Admin only)
    listLeaveTypes: build.query({
      query: (params) => '/leave-types' + toQueryString(params),
      transformResponse: listResult,
      providesTags: ['LeaveType'],
    }),

    // GET /api/leave-types/active (leave:request): every active leave type, by name
    listActiveLeaveTypes: build.query({
      query: () => '/leave-types/active',
      transformResponse: (response) => response.data,
      providesTags: ['LeaveType'],
    }),

    // POST /api/leave-types { name, description, isPaid, allowanceRule, allowanceDays }
    createLeaveType: build.mutation({
      query: (body) => ({ url: '/leave-types', method: 'POST', body: body }),
      transformResponse: (response) => response.data.leaveType,
      invalidatesTags: ['LeaveType'],
    }),

    // PATCH /api/leave-types/:id — the whole form; the code never changes.
    // Leave requests show the leave type name, and balances use its allowance,
    // so their cached data is refreshed too.
    updateLeaveType: build.mutation({
      query: ({ id, body }) => ({ url: '/leave-types/' + id, method: 'PATCH', body: body }),
      transformResponse: (response) => response.data.leaveType,
      invalidatesTags: ['LeaveType', 'Leave', 'LeaveBalance'],
    }),

    // PATCH /api/leave-types/:id/status { isActive }
    // Balances show only active leave types, so they are refreshed too.
    setLeaveTypeStatus: build.mutation({
      query: ({ id, isActive }) => ({ url: '/leave-types/' + id + '/status', method: 'PATCH', body: { isActive: isActive } }),
      transformResponse: (response) => response.data.leaveType,
      invalidatesTags: ['LeaveType', 'LeaveBalance'],
    }),
  }),
})

export const {
  useListLeaveTypesQuery,
  useListActiveLeaveTypesQuery,
  useCreateLeaveTypeMutation,
  useUpdateLeaveTypeMutation,
  useSetLeaveTypeStatusMutation,
} = leaveTypesApi
