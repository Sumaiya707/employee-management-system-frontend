// Super Admin dashboard (the backend sends layout "admin").
// Shows employees, login accounts, roles, recent activity and pending leave.
import { useSession } from '@/features/auth/useSession'
import { EmployeeStats, EmploymentTypeSection, PendingLeaveSection, WorkforceSection, WorkQueue } from './SharedSections'
import { SectionCard, ViewAllLink } from './cards'
import { ActivityList, BreakdownList } from './lists'

// One small grey box with a number and a label, e.g. "6 Active".
function AccountNumber({ value, label }) {
  return (
    <div className="rounded-md bg-muted/60 py-2.5">
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

// Login account numbers, and how many accounts each role has.
function AccountsSection({ accounts, canOpenUsers }) {
  let viewAllLink = null
  if (canOpenUsers) {
    viewAllLink = <ViewAllLink to="/users" />
  }

  const roleRows = []
  for (const role of accounts.byRole || []) {
    roleRows.push({ label: role.name, value: role.count })
  }

  return (
    <SectionCard title="Login accounts" description="All roles" action={viewAllLink}>
      <div className="mb-4 grid grid-cols-3 gap-3 text-center">
        <AccountNumber value={accounts.total} label="Total" />
        <AccountNumber value={accounts.active} label="Active" />
        <AccountNumber value={accounts.neverLoggedIn} label="Never logged in" />
      </div>
      <BreakdownList rows={roleRows} />
    </SectionCard>
  )
}

// Role numbers: total, active, inactive and custom roles.
function RolesSection({ roles, canOpenRoles }) {
  let viewAllLink = null
  if (canOpenRoles) {
    viewAllLink = <ViewAllLink to="/roles" />
  }

  const roleRows = [
    { label: 'Total roles', value: roles.total },
    { label: 'Active', value: roles.active },
    { label: 'Inactive', value: roles.inactive },
    { label: 'Custom roles', value: roles.custom },
  ]

  return (
    <SectionCard title="Roles" description="System and custom roles" action={viewAllLink}>
      <BreakdownList rows={roleRows} />
    </SectionCard>
  )
}

// data = the "data" part of the GET /api/dashboard answer.
// A section is shown only if the backend included it.
export function AdminDashboard({ data }) {
  const { can } = useSession()

  return (
    <div className="flex flex-col gap-6">
      {data.employees ? <EmployeeStats employees={data.employees} /> : null}
      <WorkQueue />
      {data.employees ? <WorkforceSection employees={data.employees} canOpenEmployees={can('employees:view')} /> : null}

      <div className="grid gap-4 xl:grid-cols-3">
        {data.accounts ? <AccountsSection accounts={data.accounts} canOpenUsers={can('users:view')} /> : null}
        {data.roles ? <RolesSection roles={data.roles} canOpenRoles={can('roles:view')} /> : null}
        {data.employees ? <EmploymentTypeSection employees={data.employees} /> : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {data.recentActivity ? (
          <SectionCard title="Recent activity" description="Latest actions across the system">
            <ActivityList items={data.recentActivity} />
          </SectionCard>
        ) : null}
        <PendingLeaveSection />
      </div>
    </div>
  )
}
