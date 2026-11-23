// Roles and the permission catalogue (backend: routes/role.routes.js,
// routes/permission.routes.js). roles:view and roles:manage are Super Admin only.
import { baseApi, listResult, toQueryString } from '@/api/baseApi'

export const rolesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /api/roles?page&limit&search&status&sort
    listRoles: build.query({
      query: (params) => '/roles' + toQueryString(params),
      transformResponse: listResult,
      providesTags: ['Role'],
    }),

    getRole: build.query({
      query: (id) => '/roles/' + id,
      transformResponse: (response) => response.data.role,
      providesTags: (result, error, id) => [{ type: 'Role', id: id }],
    }),

    // GET /api/permissions → { total, modules: [{ module, permissions: [...] }] }
    getPermissionCatalogue: build.query({
      query: () => '/permissions',
      transformResponse: (response) => response.data,
      providesTags: ['Permission'],
    }),

    // POST /api/roles { name, key, description, dataScope, permissionKeys }
    createRole: build.mutation({
      query: (body) => ({ url: '/roles', method: 'POST', body: body }),
      transformResponse: (response) => response.data.role,
      invalidatesTags: ['Role', 'Dashboard'],
    }),

    // PATCH /api/roles/:id { name?, description?, dataScope?, permissionKeys? }
    updateRole: build.mutation({
      query: ({ id, changes }) => ({ url: '/roles/' + id, method: 'PATCH', body: changes }),
      transformResponse: (response) => response.data.role,
      invalidatesTags: ['Role', 'Dashboard', 'Session'],
    }),

    // PATCH /api/roles/:id/status { isActive } (custom roles only)
    setRoleStatus: build.mutation({
      query: ({ id, isActive }) => ({ url: '/roles/' + id + '/status', method: 'PATCH', body: { isActive: isActive } }),
      invalidatesTags: ['Role', 'User', 'Dashboard'],
    }),
  }),
})

export const {
  useListRolesQuery,
  useGetRoleQuery,
  useGetPermissionCatalogueQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useSetRoleStatusMutation,
} = rolesApi
