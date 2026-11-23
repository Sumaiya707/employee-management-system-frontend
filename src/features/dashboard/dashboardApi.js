// GET /api/dashboard (permission dashboard:view). One endpoint for every role;
// the backend adds only the sections the user may see (data.layout tells which).
import { baseApi } from '@/api/baseApi'

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getDashboard: build.query({
      query: () => '/dashboard',
      transformResponse: (response) => response.data,
      providesTags: ['Dashboard'],
    }),
  }),
})

export const { useGetDashboardQuery } = dashboardApi
