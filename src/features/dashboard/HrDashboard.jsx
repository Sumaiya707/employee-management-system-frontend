// HR dashboard (the backend sends layout "organisation").
// Shows employee numbers, work waiting for HR, and activity.
import { useSession } from '@/features/auth/useSession'
import { EmployeeStats, EmploymentTypeSection, PendingLeaveSection, WorkforceSection, WorkQueue } from './SharedSections'
import { SectionCard } from './cards'
import { ActivityList } from './lists'

// Everyone's recent activity if the backend sent it (needs activity:view),
// otherwise the HR user's own recent activity.
function ActivitySection({ data }) {
  if (data.recentActivity) {
    return (
      <SectionCard title="Recent activity">
        <ActivityList items={data.recentActivity} />
      </SectionCard>
    )
  }

  return (
    <SectionCard title="My recent activity" description="Your latest actions">
      <ActivityList items={data.myRecentActivity} showActor={false} />
    </SectionCard>
  )
}

// data = the "data" part of the GET /api/dashboard answer.
export function HrDashboard({ data }) {
  const { can } = useSession()

  return (
    <div className="flex flex-col gap-6">
      {data.employees ? <EmployeeStats employees={data.employees} /> : null}
      <WorkQueue />
      {data.employees ? <WorkforceSection employees={data.employees} canOpenEmployees={can('employees:view')} /> : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <PendingLeaveSection />
        {data.employees ? <EmploymentTypeSection employees={data.employees} /> : null}
      </div>

      <ActivitySection data={data} />
    </div>
  )
}
