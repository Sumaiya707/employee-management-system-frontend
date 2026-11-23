// Leave requests (backend: routes/leave.routes.js).
// Flow: pending → approved / rejected (reviewer), or pending → cancelled (owner).
import { baseApi, listResult, toQueryString } from '@/api/baseApi'

export const leaveApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /api/leaves?page&limit&status&employeeId&from&to&sort (leave:view, scoped)
    listLeaves: build.query({
      query: (params) => '/leaves' + toQueryString(params),
      transformResponse: listResult,
      providesTags: [{ type: 'Leave', id: 'LIST' }],
    }),

    // POST /api/leaves { leaveType, startDate, endDate, reason } (leave:request)
    submitLeave: build.mutation({
      query: (body) => ({ url: '/leaves', method: 'POST', body: body }),
      transformResponse: (response) => response.data.leave,
      invalidatesTags: ['Leave', 'Dashboard'],
    }),

    // PATCH /api/leaves/:id/cancel (leave:request, own pending request)
    cancelLeave: build.mutation({
      query: (id) => ({ url: '/leaves/' + id + '/cancel', method: 'PATCH' }),
      transformResponse: (response) => response.data.leave,
      invalidatesTags: ['Leave', 'Dashboard'],
    }),

    // PATCH /api/leaves/:id/review { decision, note } (leave:approve)
    reviewLeave: build.mutation({
      query: ({ id, decision, note }) => ({ url: '/leaves/' + id + '/review', method: 'PATCH', body: { decision: decision, note: note } }),
      transformResponse: (response) => response.data.leave,
      invalidatesTags: ['Leave', 'Dashboard'],
    }),
  }),
})

export const { useListLeavesQuery, useSubmitLeaveMutation, useCancelLeaveMutation, useReviewLeaveMutation } = leaveApi
