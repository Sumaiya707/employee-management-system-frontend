// Attendance (backend: routes/attendance.routes.js). Clock-in/out always use
// the logged-in user's own employee record.
import { baseApi, listResult, toQueryString } from '@/api/baseApi'

export const attendanceApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /api/attendance/today (attendance:clock) → { workDate, attendance|null }
    getTodayAttendance: build.query({
      query: () => '/attendance/today',
      transformResponse: (response) => response.data,
      providesTags: [{ type: 'Attendance', id: 'TODAY' }],
    }),

    clockIn: build.mutation({
      query: () => ({ url: '/attendance/clock-in', method: 'POST' }),
      transformResponse: (response) => response.data.attendance,
      invalidatesTags: ['Attendance', 'Dashboard'],
    }),

    clockOut: build.mutation({
      query: () => ({ url: '/attendance/clock-out', method: 'POST' }),
      transformResponse: (response) => response.data.attendance,
      invalidatesTags: ['Attendance', 'Dashboard'],
    }),

    // GET /api/attendance?page&limit&employeeId&from&to&status&sort (attendance:view, scoped)
    listAttendance: build.query({
      query: (params) => '/attendance' + toQueryString(params),
      transformResponse: listResult,
      providesTags: [{ type: 'Attendance', id: 'LIST' }],
    }),

    // PATCH /api/attendance/:id { clockIn?, clockOut?, note } (attendance:manage)
    correctAttendance: build.mutation({
      query: ({ id, changes }) => ({ url: '/attendance/' + id, method: 'PATCH', body: changes }),
      transformResponse: (response) => response.data.attendance,
      invalidatesTags: ['Attendance'],
    }),
  }),
})

export const { useGetTodayAttendanceQuery, useClockInMutation, useClockOutMutation, useListAttendanceQuery, useCorrectAttendanceMutation } =
  attendanceApi
