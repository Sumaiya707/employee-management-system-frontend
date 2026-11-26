// Login accounts (backend: routes/user.routes.js). All users:* permissions are
// Super Admin only. Employee accounts are managed with their employee record
// through /api/employees (rule E1); the backend refuses them here.
import { baseApi, listResult, toQueryString } from '@/api/baseApi'

export const usersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /api/users?page&limit&search&role&status&sort
    listUsers: build.query({
      query: (params) => '/users' + toQueryString(params),
      transformResponse: listResult,
      providesTags: ['User'],
    }),

    // POST /api/users { firstName, lastName, email, password, roleId }
    createUser: build.mutation({
      query: (body) => ({ url: '/users', method: 'POST', body: body }),
      transformResponse: (response) => response.data.user,
      invalidatesTags: ['User', 'Role', 'Dashboard'],
    }),

    // PATCH /api/users/:id — firstName, lastName, email, roleId, employmentStatus (only the changes)
    updateUser: build.mutation({
      query: ({ id, changes }) => ({ url: '/users/' + id, method: 'PATCH', body: changes }),
      transformResponse: (response) => response.data.user,
      invalidatesTags: ['User', 'Role', 'Dashboard'],
    }),

    // PATCH /api/users/:id/password { newPassword, confirmPassword }
    resetUserPassword: build.mutation({
      query: ({ id, newPassword, confirmPassword }) => ({
        url: '/users/' + id + '/password',
        method: 'PATCH',
        body: { newPassword: newPassword, confirmPassword: confirmPassword },
      }),
      invalidatesTags: ['User'],
    }),
  }),
})

export const { useListUsersQuery, useCreateUserMutation, useUpdateUserMutation, useSetUserStatusMutation, useResetUserPasswordMutation } =
  usersApi
