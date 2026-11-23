import { Badge } from '@/components/ui/badge'
import { EMPLOYMENT_STATUS_LABELS, LEAVE_STATUS_LABELS, labelFor } from '@/lib/format'

export function ActiveBadge({ isActive, activeText = 'Active', inactiveText = 'Inactive' }) {
  return (
    <Badge variant={isActive ? 'success' : 'neutral'} dot>
      {isActive ? activeText : inactiveText}
    </Badge>
  )
}

const EMPLOYMENT_VARIANTS = { active: 'success', on_leave: 'warning', resigned: 'neutral', terminated: 'danger' }

export function EmploymentStatusBadge({ status }) {
  return <Badge variant={EMPLOYMENT_VARIANTS[status] || 'neutral'}>{labelFor(EMPLOYMENT_STATUS_LABELS, status)}</Badge>
}

const LEAVE_VARIANTS = { pending: 'warning', approved: 'success', rejected: 'danger', cancelled: 'neutral' }

export function LeaveStatusBadge({ status }) {
  return (
    <Badge variant={LEAVE_VARIANTS[status] || 'neutral'} dot>
      {labelFor(LEAVE_STATUS_LABELS, status)}
    </Badge>
  )
}

export function AttendanceStatusBadge({ isOpen }) {
  return (
    <Badge variant={isOpen ? 'accent' : 'neutral'} dot>
      {isOpen ? 'Clocked in' : 'Completed'}
    </Badge>
  )
}
