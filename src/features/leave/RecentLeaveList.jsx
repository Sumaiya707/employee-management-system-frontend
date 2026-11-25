import { EmptyState, ErrorState, LoadingRows } from '@/components/QueryState'
import { LeaveStatusBadge } from '@/components/StatusBadges'
import { formatDate, fullName } from '@/lib/format'
import { useListLeavesQuery } from './leaveApi'

// A short list of leave requests for dashboards (GET /api/leaves, scoped by the backend).
export function RecentLeaveList({ params, showEmployee = false, emptyTitle = 'No leave requests', emptyText }) {
  const leaves = useListLeavesQuery({ limit: 5, ...params })

  if (leaves.isLoading) return <LoadingRows rows={3} className="p-0" />
  if (leaves.isError) return <ErrorState error={leaves.error} onRetry={leaves.refetch} className="py-6" />
  if (leaves.data.items.length === 0) return <EmptyState title={emptyTitle} text={emptyText} className="py-8" />

  return (
    <ul className="-my-2 divide-y">
      {leaves.data.items.map((leave) => (
        <li key={leave.id} className="flex items-center justify-between gap-3 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {showEmployee ? fullName(leave.employee) + ' · ' : ''}
              {leave.leaveTypeName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {formatDate(leave.startDate)}
              {leave.endDate !== leave.startDate ? ' – ' + formatDate(leave.endDate) : ''} · {leave.days} {leave.days === 1 ? 'day' : 'days'}
            </p>
          </div>
          <LeaveStatusBadge status={leave.status} />
        </li>
      ))}
    </ul>
  )
}
