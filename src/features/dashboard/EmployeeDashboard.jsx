// Employee dashboard (the backend sends layout "personal").
// Shows today's attendance, the employee's own job details, own leave
// requests and own recent activity.
import { PlusIcon } from 'lucide-react'
import { Link } from 'react-router'
import { EmploymentStatusBadge } from '@/components/StatusBadges'
import { Button } from '@/components/ui/button'
import { TodayAttendanceCard } from '@/features/attendance/TodayAttendanceCard'
import { useSession } from '@/features/auth/useSession'
import { RecentLeaveList } from '@/features/leave/RecentLeaveList'
import { EMPLOYMENT_TYPE_LABELS, formatDate, labelFor } from '@/lib/format'
import { SectionCard, ViewAllLink } from './cards'
import { ActivityList } from './lists'

// Clock in / clock out card, or a short message if clocking is not possible.
function AttendanceSection({ canClock }) {
  if (canClock) {
    return <TodayAttendanceCard />
  }

  return (
    <SectionCard title="Today's attendance">
      <p className="text-sm text-muted-foreground">Clocking in needs an employee record linked to your account. Please contact HR.</p>
    </SectionCard>
  )
}

// One label with its value, e.g. "Designation" / "Software Engineer".
function DetailItem({ label, children }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{children}</dd>
    </div>
  )
}

// Same as DetailItem, for values shown as a coloured badge.
function BadgeItem({ label, children }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  )
}

// The employee's own job details, from the dashboard answer (data.me.employee).
function EmploymentSection({ record, canOpenProfile }) {
  let profileLink = null
  if (canOpenProfile) {
    profileLink = <ViewAllLink to="/profile">Profile</ViewAllLink>
  }

  if (!record) {
    return (
      <SectionCard title="My employment" className="xl:col-span-2" action={profileLink}>
        <p className="text-sm text-muted-foreground">No employee record is linked to your account.</p>
      </SectionCard>
    )
  }

  return (
    <SectionCard title="My employment" className="xl:col-span-2" action={profileLink}>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
        <DetailItem label="Employee ID">#{record.employeeCode}</DetailItem>
        {/* The position: the designation name ("—" for an older record without one). */}
        <DetailItem label="Designation">{record.designation ? record.designation.name : '—'}</DetailItem>
        <DetailItem label="Employment type">{labelFor(EMPLOYMENT_TYPE_LABELS, record.employmentType)}</DetailItem>
        <DetailItem label="Joined">{formatDate(record.joiningDate)}</DetailItem>
        {/* currentStatus shows "On leave" automatically during approved leave. */}
        <BadgeItem label="Job status">
          <EmploymentStatusBadge status={record.currentStatus} />
        </BadgeItem>
      </dl>
    </SectionCard>
  )
}

// The buttons in the header of "My leave requests".
function LeaveSectionButtons({ canRequestLeave }) {
  return (
    <div className="flex items-center gap-1">
      {canRequestLeave ? (
        <Button asChild size="sm" variant="outline">
          <Link to="/leave?new=1">
            <PlusIcon aria-hidden="true" />
            Request leave
          </Link>
        </Button>
      ) : null}
      <ViewAllLink to="/leave" />
    </div>
  )
}

// data = the "data" part of the GET /api/dashboard answer.
export function EmployeeDashboard({ data }) {
  const { can } = useSession()

  // The employee record linked to this account (null if there is none).
  let record = null
  if (data.me && data.me.employee) {
    record = data.me.employee
  }

  // Clocking in and requesting leave both need an employee record.
  const canClock = can('attendance:clock') && record !== null
  const canRequestLeave = can('leave:request') && record !== null

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <AttendanceSection canClock={canClock} />
        </div>
        <EmploymentSection record={record} canOpenProfile={can('profile:view')} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {can('leave:view') ? (
          <SectionCard title="My leave requests" description="Your latest requests" action={<LeaveSectionButtons canRequestLeave={canRequestLeave} />}>
            <RecentLeaveList emptyText="Requests you submit will appear here." />
          </SectionCard>
        ) : null}
        <SectionCard title="My recent activity" description="Your latest actions in PeopleDesk">
          <ActivityList items={data.myRecentActivity} showActor={false} />
        </SectionCard>
      </div>
    </div>
  )
}
