// Dashboard sections used by BOTH the Super Admin and the HR dashboards.
// Keeping them here means each section is written only once.
import { CalendarClockIcon, CalendarDaysIcon, UserCheckIcon, UserPlusIcon, UsersIcon, UserXIcon } from 'lucide-react'
import { useSession } from '@/features/auth/useSession'
import { RecentLeaveList } from '@/features/leave/RecentLeaveList'
import { EMPLOYMENT_STATUS_LABELS, EMPLOYMENT_TYPE_LABELS } from '@/lib/format'
import { useOpenAttendanceCount, usePendingLeaveCount } from './useCounts'
import { SectionCard, StatCard, StatGrid, ViewAllLink } from './cards'
import { CountBarChart } from './charts'
import { BreakdownList, RecentHiresList } from './lists'

// Turns { active: 3, on_leave: 1, ... } into chart rows: [{ label: 'Active', value: 3 }, ...]
// Every status is listed, with 0 when the backend sent no number for it.
function makeEmploymentStatusRows(countsByStatus) {
  const rows = []
  for (const statusKey of Object.keys(EMPLOYMENT_STATUS_LABELS)) {
    let count = 0
    if (countsByStatus && countsByStatus[statusKey]) {
      count = countsByStatus[statusKey]
    }
    rows.push({ label: EMPLOYMENT_STATUS_LABELS[statusKey], value: count })
  }
  return rows
}

// Same idea for employment types (full-time, part-time, contract, intern).
function makeEmploymentTypeRows(countsByType) {
  const rows = []
  for (const typeKey of Object.keys(EMPLOYMENT_TYPE_LABELS)) {
    let count = 0
    if (countsByType && countsByType[typeKey]) {
      count = countsByType[typeKey]
    }
    rows.push({ label: EMPLOYMENT_TYPE_LABELS[typeKey], value: count })
  }
  return rows
}

// Shows "—" while a number is still loading (or could not be loaded).
function showCount(count) {
  if (count === null || count === undefined) {
    return '—'
  }
  return count
}

// Four number cards: total, active, inactive and recently joined employees.
export function EmployeeStats({ employees }) {
  return (
    <StatGrid>
      <StatCard label="Total employees" value={employees.total} icon={UsersIcon} to="/employees" hint="All employee records" />
      <StatCard label="Active records" value={employees.active} icon={UserCheckIcon} hint="Can log in" />
      <StatCard label="Inactive records" value={employees.inactive} icon={UserXIcon} hint="Login disabled" />
      <StatCard label="Joined in last 30 days" value={employees.joinedLast30Days} icon={UserPlusIcon} hint="By joining date" />
    </StatGrid>
  )
}

// Employment status chart and the list of recent hires, side by side.
export function WorkforceSection({ employees, canOpenEmployees }) {
  let viewAllLink = null
  if (canOpenEmployees) {
    viewAllLink = <ViewAllLink to="/employees" />
  }

  return (
    <div className="grid gap-4 xl:grid-cols-5">
      <SectionCard title="Employment status" description="Active employee records by job status" className="xl:col-span-3">
        <CountBarChart rows={makeEmploymentStatusRows(employees.byEmploymentStatus)} caption="Active employee records by employment status" />
      </SectionCard>
      <SectionCard title="Recent hires" description="Latest joining dates" className="xl:col-span-2" action={viewAllLink}>
        <RecentHiresList hires={employees.recentHires} canOpen={canOpenEmployees} />
      </SectionCard>
    </div>
  )
}

// Number of active employee records per employment type.
export function EmploymentTypeSection({ employees }) {
  return (
    <SectionCard title="Employment type" description="Active employee records">
      <BreakdownList rows={makeEmploymentTypeRows(employees.byEmploymentType)} />
    </SectionCard>
  )
}

// Two cards with work waiting for HR / Super Admin:
// leave requests to review and attendance records still open.
export function WorkQueue() {
  const { can, scope } = useSession()
  const canReviewLeave = can('leave:view') && can('leave:approve') && scope === 'all'
  const canSeeAllAttendance = can('attendance:view') && scope === 'all'

  // Each count is only requested when its card is shown.
  const pendingLeave = usePendingLeaveCount(canReviewLeave)
  const openAttendance = useOpenAttendanceCount(canSeeAllAttendance)

  if (!canReviewLeave && !canSeeAllAttendance) {
    return null
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {canReviewLeave ? (
        <StatCard label="Leave requests to review" value={showCount(pendingLeave.count)} icon={CalendarDaysIcon} to="/leave" hint="Pending decisions" />
      ) : null}
      {canSeeAllAttendance ? (
        <StatCard
          label="Open attendance records"
          value={showCount(openAttendance.count)}
          icon={CalendarClockIcon}
          to="/attendance"
          hint="Clocked in, not yet clocked out"
        />
      ) : null}
    </div>
  )
}

// The five leave requests that are waiting for a decision.
export function PendingLeaveSection() {
  const { can, scope } = useSession()
  const canReviewLeave = can('leave:view') && can('leave:approve') && scope === 'all'

  if (!canReviewLeave) {
    return null
  }

  return (
    <SectionCard title="Pending leave requests" description="Waiting for a decision" action={<ViewAllLink to="/leave">Review</ViewAllLink>}>
      <RecentLeaveList
        params={{ status: 'pending', sort: 'startDate' }}
        showEmployee
        emptyTitle="Nothing to review"
        emptyText="There are no pending leave requests."
      />
    </SectionCard>
  )
}
