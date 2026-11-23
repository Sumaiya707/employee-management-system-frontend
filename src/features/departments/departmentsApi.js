// Departments (backend: routes/department.routes.js).
// departments:view lists and views them; departments:manage creates, edits and
// activates/deactivates them. Departments are never deleted.
import { baseApi, listResult, toQueryString } from '@/api/baseApi'

export const departmentsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /api/departments?page&limit&search&status&sort
    listDepartments: build.query({
      query: (params) => '/departments' + toQueryString(params),
      transformResponse: listResult,
      providesTags: ['Department'],
    }),

    // POST /api/departments { name, description }
    createDepartment: build.mutation({
      query: (body) => ({ url: '/departments', method: 'POST', body: body }),
      transformResponse: (response) => response.data.department,
      invalidatesTags: ['Department'],
    }),

    // PATCH /api/departments/:id — name and/or description (only the changes).
    // Employees show the department name, so their cached data is refreshed too.
    updateDepartment: build.mutation({
      query: ({ id, changes }) => ({ url: '/departments/' + id, method: 'PATCH', body: changes }),
      transformResponse: (response) => response.data.department,
      invalidatesTags: ['Department', 'Employee', 'Profile'],
    }),

    // PATCH /api/departments/:id/status { isActive }
    setDepartmentStatus: build.mutation({
      query: ({ id, isActive }) => ({ url: '/departments/' + id + '/status', method: 'PATCH', body: { isActive: isActive } }),
      transformResponse: (response) => response.data.department,
      invalidatesTags: ['Department', 'Employee', 'Profile'],
    }),
  }),
})

export const { useListDepartmentsQuery, useCreateDepartmentMutation, useUpdateDepartmentMutation, useSetDepartmentStatusMutation } = departmentsApi
