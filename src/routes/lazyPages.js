// Route-level pages, loaded on demand so the login page stays small.
import { lazy } from 'react'

export const ForcedPasswordPage = lazy(() => import('@/pages/ForcedPasswordPage'))
export const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'))
export const ProfilePage = lazy(() => import('@/features/profile/ProfilePage'))
export const EmployeesPage = lazy(() => import('@/features/employees/EmployeesPage'))
export const EmployeeDetailPage = lazy(() => import('@/features/employees/EmployeeDetailPage'))
export const EmployeeFormPage = lazy(() => import('@/features/employees/EmployeeFormPage'))
export const AttendancePage = lazy(() => import('@/features/attendance/AttendancePage'))
export const LeavePage = lazy(() => import('@/features/leave/LeavePage'))
export const UsersPage = lazy(() => import('@/features/users/UsersPage'))
export const RolesPage = lazy(() => import('@/features/roles/RolesPage'))
export const RoleFormPage = lazy(() => import('@/features/roles/RoleFormPage'))
