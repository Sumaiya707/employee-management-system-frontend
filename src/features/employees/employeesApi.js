// Employee records and their linked Employee login accounts
// (backend: routes/employee.routes.js). Creating an employee also creates the
// login account in the same transaction (rule E1).
import { baseApi, listResult, toQueryString } from '@/api/baseApi'

export const employeesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /api/employees?page&limit&search&status&employmentStatus&sort
    listEmployees: build.query({
      query: (params) => '/employees' + toQueryString(params),
      transformResponse: listResult,
      providesTags: (result) => [{ type: 'Employee', id: 'LIST' }, ...(result ? result.items.map((item) => ({ type: 'Employee', id: item.id })) : [])],
    }),

    getEmployee: build.query({
      query: (id) => '/employees/' + id,
      transformResponse: (response) => response.data.employee,
      providesTags: (result, error, id) => [{ type: 'Employee', id: id }],
    }),

    createEmployee: build.mutation({
      query: (body) => ({ url: '/employees', method: 'POST', body: body }),
      transformResponse: (response) => response.data.employee,
      invalidatesTags: [{ type: 'Employee', id: 'LIST' }, 'Dashboard'],
    }),

    // PATCH /api/employees/:id — send only the changed fields.
    updateEmployee: build.mutation({
      query: ({ id, changes }) => ({ url: '/employees/' + id, method: 'PATCH', body: changes }),
      transformResponse: (response) => response.data.employee,
      invalidatesTags: (result, error, { id }) => [{ type: 'Employee', id: id }, { type: 'Employee', id: 'LIST' }, 'Dashboard'],
    }),

    // PATCH /api/employees/:id/status { isActive }
    setEmployeeStatus: build.mutation({
      query: ({ id, isActive }) => ({ url: '/employees/' + id + '/status', method: 'PATCH', body: { isActive: isActive } }),
      transformResponse: (response) => response.data.employee,
      invalidatesTags: (result, error, { id }) => [{ type: 'Employee', id: id }, { type: 'Employee', id: 'LIST' }, 'Dashboard', 'User'],
    }),

    // PATCH /api/employees/:id/password { newPassword, confirmPassword }
    resetEmployeePassword: build.mutation({
      query: ({ id, newPassword, confirmPassword }) => ({
        url: '/employees/' + id + '/password',
        method: 'PATCH',
        body: { newPassword: newPassword, confirmPassword: confirmPassword },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Employee', id: id }],
    }),
  }),
})

export const {
  useListEmployeesQuery,
  useGetEmployeeQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useSetEmployeeStatusMutation,
  useResetEmployeePasswordMutation,
} = employeesApi
