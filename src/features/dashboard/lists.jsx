// Dashboard lists: label/number rows, recent hires and recent activity.
import { Link } from 'react-router'
import { EmptyState } from '@/components/QueryState'
import { EmploymentStatusBadge } from '@/components/StatusBadges'
import { activityLabel, formatDate, formatDateTime, fullName } from '@/lib/format'

// Label/value rows, e.g. accounts per role.
export function BreakdownList({ rows }) {
  return (
    <dl className="divide-y">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between py-2.5 text-sm first:pt-0 last:pb-0">
          <dt className="text-muted-foreground">{row.label}</dt>
          <dd className="font-medium tabular-nums">{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function RecentHiresList({ hires, canOpen }) {
  if (!hires || hires.length === 0) {
    return <EmptyState title="No employees yet" className="py-8" />
  }
  return (
    <ul className="-my-2 divide-y">
      {hires.map((hire) => {
        const content = (
          <>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{fullName(hire)}</p>
              <p className="truncate text-xs text-muted-foreground">
                #{hire.employeeCode} · {hire.jobTitle}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <EmploymentStatusBadge status={hire.employmentStatus} />
              <span className="text-xs text-muted-foreground">Joined {formatDate(hire.joiningDate)}</span>
            </div>
          </>
        )
        return (
          <li key={hire.id}>
            {canOpen ? (
              <Link to={'/employees/' + hire.id} className="-mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-2.5 hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                {content}
              </Link>
            ) : (
              <div className="flex items-center justify-between gap-3 py-2.5">{content}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export function ActivityList({ items, showActor = true, emptyText = 'No activity recorded yet.' }) {
  if (!items || items.length === 0) {
    return <EmptyState title="No activity" text={emptyText} className="py-8" />
  }
  return (
    <ol className="-my-2 divide-y">
      {items.map((item) => (
        <li key={item.id} className="flex items-start justify-between gap-4 py-2.5">
          <div className="min-w-0">
            <p className="text-sm">{item.description || activityLabel(item.action)}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {showActor ? (item.actor ? fullName(item.actor) : 'System') + ' · ' : ''}
              {activityLabel(item.action)}
            </p>
          </div>
          <time dateTime={item.createdAt} className="shrink-0 text-xs text-muted-foreground">
            {formatDateTime(item.createdAt)}
          </time>
        </li>
      ))}
    </ol>
  )
}
