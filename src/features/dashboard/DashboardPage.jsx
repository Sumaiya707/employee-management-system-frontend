// The /dashboard page.
//
// It does two things:
//   1. Loads the dashboard data with GET /api/dashboard.
//   2. Shows the dashboard that matches the "layout" value in the answer.
//
// The backend decides the layout from the logged-in user's role:
//   "admin"        → Super Admin → AdminDashboard
//   "organisation" → HR          → HrDashboard
//   "personal"     → Employee    → EmployeeDashboard
import { PageHeader } from '@/components/PageHeader'
import { ErrorState, LoadingBlock } from '@/components/QueryState'
import { useSession } from '@/features/auth/useSession'
import { formatDateTime } from '@/lib/format'
import { AdminDashboard } from './AdminDashboard'
import { useGetDashboardQuery } from './dashboardApi'
import { EmployeeDashboard } from './EmployeeDashboard'
import { HrDashboard } from './HrDashboard'

// "Good morning", "Good afternoon" or "Good evening", from the current time.
function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) {
    return 'Good morning'
  }
  if (hour < 18) {
    return 'Good afternoon'
  }
  return 'Good evening'
}

// The short text under the page title.
function getDescription(layout) {
  if (layout === 'admin') {
    return 'System overview: people, accounts, roles and recent activity.'
  }
  if (layout === 'organisation') {
    return 'Organisation overview: employee records, attendance and leave requests.'
  }
  if (layout === 'personal') {
    return 'Your attendance, leave requests and employment details.'
  }
  return 'Your overview'
}

// Picks the dashboard for the layout the backend sent.
function SelectedDashboard({ data }) {
  if (data.layout === 'admin') {
    return <AdminDashboard data={data} />
  }
  if (data.layout === 'organisation') {
    return <HrDashboard data={data} />
  }
  if (data.layout === 'personal') {
    return <EmployeeDashboard data={data} />
  }
  return null
}

export default function DashboardPage() {
  const { user } = useSession()

  // refetchOnFocus: load fresh numbers when the user comes back to this browser tab.
  const dashboard = useGetDashboardQuery(undefined, { refetchOnFocus: true })

  let layout = null
  let updatedText = null
  if (dashboard.data) {
    layout = dashboard.data.layout
    updatedText = <p className="text-xs text-muted-foreground">Updated {formatDateTime(dashboard.data.generatedAt)}</p>
  }

  return (
    <>
      <PageHeader title={getGreeting() + ', ' + user.firstName} documentTitle="Dashboard" description={getDescription(layout)} actions={updatedText} />
      {dashboard.isLoading ? <LoadingBlock /> : null}
      {dashboard.isError ? <ErrorState error={dashboard.error} onRetry={dashboard.refetch} /> : null}
      {dashboard.data ? <SelectedDashboard data={dashboard.data} /> : null}
    </>
  )
}
