// The pages that exist in the app, each with the backend permission it needs.
// The sidebar shows an item only if GET /api/auth/me returned that permission,
// and the route itself is guarded with the same key (src/routes/router.jsx).
//
// Only implemented pages are listed. Backend permissions without an API yet
// (reports, activity log list) have no page.
import {
  BriefcaseBusinessIcon,
  Building2Icon,
  CalendarClockIcon,
  CalendarCogIcon,
  CalendarDaysIcon,
  IdCardIcon,
  ListChecksIcon,
  LayoutDashboardIcon,
  ShieldCheckIcon,
  UserCogIcon,
  UsersIcon,
} from 'lucide-react'

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
    title: 'Organisation',
    items: [
      { to: '/departments', label: 'Departments', icon: Building2Icon, permission: 'departments:view' },
      { to: '/designations', label: 'Designations', icon: BriefcaseBusinessIcon, permission: 'designations:view' },
    ],
  },
  {
    // Leave policy: only the Super Admin (superAdminOnly), the same rule as the backend
    // (middlewares/requireSuperAdmin.js). HR also has leave:manage, but does not see these.
    title: 'Leave Setup',
    items: [
      { to: '/leave-types', label: 'Leave Types', icon: ListChecksIcon, permission: 'leave:manage', superAdminOnly: true },
      { to: '/work-calendar', label: 'Work Calendar', icon: CalendarCogIcon, permission: 'leave:manage', superAdminOnly: true },
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

// true if this user may open this page: they need its permission, and a
// superAdminOnly page is only for the Super Admin.
function canOpenItem(user, item) {
  if (!user || !user.permissions) {
    return false
  }
  if (!user.permissions.includes(item.permission)) {
    return false
  }
  let isSuperAdmin = false
  if (user.role && user.role.isSuperAdmin) {
    isSuperAdmin = true
  }
  if (item.superAdminOnly && !isSuperAdmin) {
    return false
  }
  return true
}

// The sections and items this user may see.
// - An item is shown only if the user may open it (canOpenItem).
// - A section is shown only if at least one of its items is shown.
export function visibleNavigation(user, scope) {
  const visibleSections = []

  for (const section of NAV_SECTIONS) {
    const visibleItems = []

    for (const item of section.items) {
      if (canOpenItem(user, item)) {
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
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (canOpenItem(user, item)) {
        return item.to
      }
    }
  }
  return '/no-access'
}
