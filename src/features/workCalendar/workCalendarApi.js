// Work calendar: weekend days and holidays (backend: routes/workCalendar.routes.js).
// leave:request reads it (the leave form counts working days with it);
// only the Super Admin saves it.
// (query, mutation, transformResponse and tags are explained in
// src/features/leaveTypes/leaveTypesApi.js.)
import { baseApi } from '@/api/baseApi'

export const workCalendarApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /api/work-calendar → { configured, weekendDays, holidays, updatedAt }
    getWorkCalendar: build.query({
      query: () => '/work-calendar',
      transformResponse: (response) => response.data.calendar,
      providesTags: ['WorkCalendar'],
    }),

    // PUT /api/work-calendar { weekendDays, holidays } — saves the whole calendar
    saveWorkCalendar: build.mutation({
      query: (body) => ({ url: '/work-calendar', method: 'PUT', body: body }),
      transformResponse: (response) => response.data.calendar,
      invalidatesTags: ['WorkCalendar'],
    }),
  }),
})

export const { useGetWorkCalendarQuery, useSaveWorkCalendarMutation } = workCalendarApi
