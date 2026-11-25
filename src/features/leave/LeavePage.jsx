import { ChevronRightIcon, PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { FilterSelect, ListToolbar } from '@/components/ListToolbar'
import { PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/Pagination'
import { EmptyState, ErrorState, LoadingRows } from '@/components/QueryState'
import { LeaveStatusBadge } from '@/components/StatusBadges'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useSession } from '@/features/auth/useSession'
import { useOwnEmployee } from '@/features/profile/useOwnEmployee'
import { useListParams } from '@/hooks/useListParams'
import { LEAVE_STATUS_LABELS, formatDate, fullName } from '@/lib/format'
import { cn } from '@/lib/utils'
import { LeaveDetailsDialog } from './LeaveDetailsDialog'
import { LeaveRequestDialog } from './LeaveRequestDialog'
import { useListLeavesQuery } from './leaveApi'

const DEFAULTS = { status: '', sort: '-createdAt' }

// The status tabs above the table. The value '' means "all statuses".
const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'pending', label: LEAVE_STATUS_LABELS.pending },
  { value: 'approved', label: LEAVE_STATUS_LABELS.approved },
  { value: 'rejected', label: LEAVE_STATUS_LABELS.rejected },
  { value: 'cancelled', label: LEAVE_STATUS_LABELS.cancelled },
]

// One row of the leave table. Clicking the row or its button opens the details.
//   showEmployee  show the Employee column (organisation view)
//   canReview     the user may approve / reject, so pending requests say "Review"
//   onOpen        opens the details dialog for this request
function LeaveRow({ leave, showEmployee, canReview, onOpen }) {
  let buttonText = 'View'
  if (canReview && leave.status === 'pending') {
    buttonText = 'Review'
  }

  return (
    <TableRow className="cursor-pointer" onClick={onOpen}>
      {showEmployee ? (
        <TableCell>
          <span className="font-medium">{fullName(leave.employee)}</span>
          <span className="block text-xs text-muted-foreground">#{leave.employee ? leave.employee.employeeCode : ''}</span>
        </TableCell>
      ) : null}
      <TableCell>{leave.leaveTypeName}</TableCell>
      <TableCell>
        {formatDate(leave.startDate)}
        {leave.endDate !== leave.startDate ? ' – ' + formatDate(leave.endDate) : ''}
      </TableCell>
      <TableCell className="tabular-nums">{leave.days}</TableCell>
      <TableCell>
        <LeaveStatusBadge status={leave.status} />
      </TableCell>
      <TableCell className="text-muted-foreground">{formatDate(leave.createdAt)}</TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="sm"
          onClick={(event) => {
            // Stop the click from also reaching the row (it would open the dialog twice).
            event.stopPropagation()
            onOpen()
          }}
          aria-label={'Open ' + leave.leaveTypeName + ' from ' + formatDate(leave.startDate)}
        >
          {buttonText}
          <ChevronRightIcon aria-hidden="true" />
        </Button>
      </TableCell>
    </TableRow>
  )
}

export default function LeavePage() {
  const { can, scope } = useSession()
  const own = useOwnEmployee()
  const { params, setParam, searchParams, setSearchParams } = useListParams(DEFAULTS)
  const [selectedId, setSelectedId] = useState(null)
  const leaves = useListLeavesQuery({ ...params, limit: 15 })

  const organisation = scope === 'all'
  const canRequest = can('leave:request') && Boolean(own.employee)
  const requestOpen = canRequest && searchParams.get('new') === '1'
  const ownEmployeeId = own.employee ? own.employee.id : null

  function setRequestOpen(open) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (open) next.set('new', '1')
        else next.delete('new')
        return next
      },
      { replace: true },
    )
  }

  // Look the selected request up in the current list, so the dialog shows fresh data.
  let selected = null
  if (selectedId && leaves.data) {
    selected = leaves.data.items.find((item) => item.id === selectedId) || null
  }

  // Is the selected request the logged-in employee's own request?
  // (Own requests can be cancelled but never reviewed by yourself.)
  let selectedIsOwn = false
  if (selected && ownEmployeeId && selected.employee) {
    selectedIsOwn = selected.employee.id === ownEmployeeId
  }

  return (
    <>
      <PageHeader
        title={organisation ? 'Leave Requests' : 'My Leave'}
        description={organisation ? 'Review and track leave requests across the organisation.' : 'Request leave and follow your requests.'}
        actions={
          canRequest ? (
            <Button onClick={() => setRequestOpen(true)}>
              <PlusIcon aria-hidden="true" />
              Request leave
            </Button>
          ) : null
        }
      />
      <Card>
        <ListToolbar>
          <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-1 rounded-md bg-muted p-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value || 'all'}
                type="button"
                onClick={() => setParam('status', tab.value)}
                aria-pressed={params.status === tab.value}
                className={cn(
                  'h-7 rounded-sm px-3 text-[13px] transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                  params.status === tab.value ? 'bg-card font-medium text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <FilterSelect
            id="leave-sort"
            label="Sort order"
            value={params.sort}
            onChange={(value) => setParam('sort', value)}
            options={[
              { value: '-createdAt', label: 'Newest submitted' },
              { value: 'createdAt', label: 'Oldest submitted' },
              { value: 'startDate', label: 'Start date (soonest)' },
              { value: '-startDate', label: 'Start date (latest)' },
            ]}
            className="sm:ml-auto"
          />
        </ListToolbar>

        {leaves.isLoading ? <LoadingRows /> : null}
        {leaves.isError ? <ErrorState error={leaves.error} onRetry={leaves.refetch} /> : null}
        {leaves.data && leaves.data.items.length === 0 ? (
          <EmptyState
            filtered={Boolean(params.status)}
            title={params.status ? 'No ' + LEAVE_STATUS_LABELS[params.status].toLowerCase() + ' requests' : 'No leave requests yet'}
            text={!params.status && canRequest ? 'Requests you submit will appear here.' : undefined}
            action={
              !params.status && canRequest ? (
                <Button size="sm" onClick={() => setRequestOpen(true)}>
                  Request leave
                </Button>
              ) : null
            }
          />
        ) : null}
        {leaves.data && leaves.data.items.length > 0 ? (
          <div aria-busy={leaves.isFetching}>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {organisation ? <TableHead>Employee</TableHead> : null}
                  <TableHead>Type</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>
                    <span className="sr-only">Details</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className={leaves.isFetching ? 'opacity-60' : undefined}>
                {leaves.data.items.map((leave) => (
                  <LeaveRow
                    key={leave.id}
                    leave={leave}
                    showEmployee={organisation}
                    canReview={organisation && can('leave:approve')}
                    onOpen={() => setSelectedId(leave.id)}
                  />
                ))}
              </TableBody>
            </Table>
            <Pagination meta={leaves.data.meta} onPageChange={(page) => setParam('page', page)} isFetching={leaves.isFetching} />
          </div>
        ) : null}
      </Card>

      <LeaveDetailsDialog
        leave={selected}
        canReview={organisation && can('leave:approve') && !selectedIsOwn}
        canCancel={can('leave:request') && selectedIsOwn}
        onOpenChange={(open) => !open && setSelectedId(null)}
      />
      <LeaveRequestDialog open={requestOpen} onOpenChange={setRequestOpen} />
    </>
  )
}
