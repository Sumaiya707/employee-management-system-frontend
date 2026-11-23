// All routes. Every page inside the app is wrapped in RequirePermission with
// the same permission key the sidebar uses (src/config/navigation.js) and the
// backend route checks.
import { createBrowserRouter } from 'react-router'
import { AppLayout } from '@/layouts/AppLayout'
import LoginPage from '@/pages/LoginPage'
import { NoAccessPage, NotFoundPage } from '@/pages/StatusPages'
import { RouteErrorPage } from '@/pages/RouteErrorPage'
import {
  AttendancePage,
  DashboardPage,
  DepartmentsPage,
  DesignationsPage,
  EmployeeDetailPage,
  EmployeeFormPage,
  EmployeesPage,
  ForcedPasswordPage,
  LeavePage,
  ProfilePage,
  RoleFormPage,
  RolesPage,
  UsersPage,
} from './lazyPages'
import { GuestOnly, HomeRedirect, RequireAuth, RequirePermission, SessionGate } from './guards'

function guarded(permission, element) {
  return <RequirePermission permission={permission}>{element}</RequirePermission>
}

export const router = createBrowserRouter([
  {
    element: <SessionGate />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        path: '/login',
        element: (
          <GuestOnly>
            <LoginPage />
          </GuestOnly>
        ),
      },
      {
        element: <RequireAuth />,
        children: [
          { path: '/change-password', element: <ForcedPasswordPage /> },
          {
            element: <AppLayout />,
            children: [
              { index: true, element: <HomeRedirect /> },
              { path: 'dashboard', element: guarded('dashboard:view', <DashboardPage />) },
              { path: 'profile', element: guarded('profile:view', <ProfilePage />) },
              { path: 'employees', element: guarded('employees:view', <EmployeesPage />) },
              { path: 'employees/new', element: guarded('employees:create', <EmployeeFormPage />) },
              { path: 'employees/:id', element: guarded('employees:view', <EmployeeDetailPage />) },
              { path: 'employees/:id/edit', element: guarded('employees:update', <EmployeeFormPage />) },
              { path: 'attendance', element: guarded('attendance:view', <AttendancePage />) },
              { path: 'leave', element: guarded('leave:view', <LeavePage />) },
              { path: 'departments', element: guarded('departments:view', <DepartmentsPage />) },
              { path: 'designations', element: guarded('designations:view', <DesignationsPage />) },
              { path: 'users', element: guarded('users:view', <UsersPage />) },
              { path: 'roles', element: guarded('roles:view', <RolesPage />) },
              { path: 'roles/new', element: guarded('roles:manage', <RoleFormPage />) },
              { path: 'roles/:id', element: guarded('roles:view', <RoleFormPage />) },
              { path: 'no-access', element: <NoAccessPage /> },
              { path: '*', element: <NotFoundPage /> },
            ],
          },
        ],
      },
    ],
  },
])
