// The pages that exist in the app, each with the backend permission it needs.
// The sidebar shows an item only if GET /api/auth/me returned that permission,
// and the route itself is guarded with the same key (src/routes/router.jsx).
//
// Only implemented pages are listed. Backend permissions without an API yet
// (departments, designations, reports, activity log list) have no page.
import { CalendarClockIcon, CalendarDaysIcon, IdCardIcon, LayoutDashboardIcon, ShieldCheckIcon, UserCogIcon, UsersIcon } from 'lucide-react'

export const NAV_SECTIONS = [
  {
    title: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboardIcon, permission: 'dashboard:view' },
      { to: '/profile', label: 'My Profile', icon: IdCardIcon, permission: 'profile:view' },
    ],
  },
  {
    title: 'Workplace',
    items: [
      { to: '/employees', label: 'Employees', icon: UsersIcon, permission: 'employees:view' },
      // Labels change with the data scope: "self" users only see their own records.
      { to: '/attendance', label: 'Attendance', selfLabel: 'My Attendance', icon: CalendarClockIcon, permission: 'attendance:view' },
      { to: '/leave', label: 'Leave Requests', selfLabel: 'My Leave', icon: CalendarDaysIcon, permission: 'leave:view' },
    ],
  },
  {
    title: 'Administration',
    items: [
      { to: '/users', label: 'User Accounts', icon: UserCogIcon, permission: 'users:view' },
      { to: '/roles', label: 'Roles & Permissions', icon: ShieldCheckIcon, permission: 'roles:view' },
    ],
  },
]

// The sections and items this user may see.
// - An item is shown only if the user has its permission.
// - A section is shown only if at least one of its items is shown.
export function visibleNavigation(user, scope) {
  let permissions = []
  if (user && user.permissions) {
    permissions = user.permissions
  }

  const visibleSections = []

  for (const section of NAV_SECTIONS) {
    const visibleItems = []

    for (const item of section.items) {
      if (permissions.includes(item.permission)) {
        // "self" users (Employee) see e.g. "My Attendance" instead of "Attendance".
        let label = item.label
        if (scope === 'self' && item.selfLabel) {
          label = item.selfLabel
        }
        visibleItems.push({ to: item.to, label: label, icon: item.icon, permission: item.permission })
      }
    }

    if (visibleItems.length > 0) {
      visibleSections.push({ title: section.title, items: visibleItems })
    }
  }

  return visibleSections
}

// Where to send a user after login: the dashboard, or the first page they may open.
export function homePathFor(user) {
  const permissions = (user && user.permissions) || []
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (permissions.includes(item.permission)) {
        return item.to
      }
    }
  }
  return '/no-access'
}
