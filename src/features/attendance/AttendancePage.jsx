import { PencilIcon } from 'lucide-react'
import { useState } from 'react'
import { FilterSelect, ListToolbar } from '@/components/ListToolbar'
import { PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/Pagination'
import { EmptyState, ErrorState, LoadingRows } from '@/components/QueryState'
import { AttendanceStatusBadge } from '@/components/StatusBadges'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useSession } from '@/features/auth/useSession'
import { useOwnEmployee } from '@/features/profile/useOwnEmployee'
import { useListParams } from '@/hooks/useListParams'
import { formatDate, formatMinutes, formatTime, fullName } from '@/lib/format'
import { useListAttendanceQuery } from './attendanceApi'
import { CorrectAttendanceDialog } from './CorrectAttendanceDialog'
import { TodayAttendanceCard } from './TodayAttendanceCard'

const DEFAULTS = { from: '', to: '', status: '', sort: '-workDate' }

function DateFilter({ id, label, value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-[13px] text-muted-foreground">
        {label}
      </label>
      <Input id={id} type="date" value={value} onChange={(event) => onChange(event.target.value)} className="w-auto" />
    </div>
  )
}

export default function AttendancePage() {
  const { can, scope } = useSession()
  const own = useOwnEmployee()
  const { params, setParam, clear } = useListParams(DEFAULTS)
  const [correcting, setCorrecting] = useState(null)

  // Sending from > to would be refused by the backend; show it here instead.
  const rangeInvalid = Boolean(params.from && params.to && params.from > params.to)
  const attendance = useListAttendanceQuery({ ...params, limit: 15 }, { skip: rangeInvalid })

  const organisation = scope === 'all'
  const canCorrect = organisation && can('attendance:manage')
  const canClock = can('attendance:clock') && Boolean(own.employee)
  const filtered = Boolean(params.from || params.to || params.status)

  // The list (loading, error, empty or table) is only shown for a valid date range.
  const isRangeValid = !rangeInvalid

  // Title and text shown when the list is empty.
  let emptyTitle = 'No attendance records yet'
  let emptyText = 'Records appear when employees clock in.'
  if (filtered) {
    emptyTitle = 'No matching records'
    emptyText = 'Try other dates or clear the filters.'
  } else if (canClock) {
    emptyText = 'Records appear after you clock in.'
  }

  return (
    <>
      <PageHeader
        title={organisation ? 'Attendance' : 'My Attendance'}
        description={organisation ? 'Daily attendance records for all employees.' : 'Your clock-in and clock-out history.'}
      />

      {canClock ? (
        <div className="mb-6">
          <TodayAttendanceCard />
        </div>
      ) : null}

      <Card>
        <ListToolbar onClear={() => clear(['from', 'to', 'status'])} showClear={filtered}>
          <DateFilter id="from" label="From" value={params.from} onChange={(value) => setParam('from', value)} />
          <DateFilter id="to" label="To" value={params.to} onChange={(value) => setParam('to', value)} />
          <FilterSelect
            id="attendance-status"
            label="Status"
            value={params.status}
            onChange={(value) => setParam('status', value)}
            options={[
              { value: '', label: 'All records' },
              { value: 'open', label: 'Clocked in (open)' },
              { value: 'closed', label: 'Completed' },
            ]}
          />
          <FilterSelect
            id="attendance-sort"
            label="Sort order"
            value={params.sort}
            onChange={(value) => setParam('sort', value)}
            options={[
              { value: '-workDate', label: 'Newest first' },
              { value: 'workDate', label: 'Oldest first' },
            ]}
            className="sm:ml-auto"
          />
        </ListToolbar>

        {rangeInvalid ? <EmptyState filtered title="Check the dates" text="The From date must be on or before the To date." /> : null}
        {isRangeValid && attendance.isLoading ? <LoadingRows /> : null}
        {isRangeValid && attendance.isError ? <ErrorState error={attendance.error} onRetry={attendance.refetch} /> : null}
        {isRangeValid && attendance.data && attendance.data.items.length === 0 ? <EmptyState filtered={filtered} title={emptyTitle} text={emptyText} /> : null}
        {isRangeValid && attendance.data && attendance.data.items.length > 0 ? (
          <div aria-busy={attendance.isFetching}>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Date</TableHead>
                  {organisation ? <TableHead>Employee</TableHead> : null}
                  <TableHead>Clock in</TableHead>
                  <TableHead>Clock out</TableHead>
                  <TableHead>Worked</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Correction</TableHead>
                  {canCorrect ? (
                    <TableHead>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody className={attendance.isFetching ? 'opacity-60' : undefined}>
                {attendance.data.items.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{formatDate(record.workDate)}</TableCell>
                    {organisation ? (
                      <TableCell>
                        <span className="font-medium">{fullName(record.employee)}</span>
                        <span className="block text-xs text-muted-foreground">#{record.employee ? record.employee.employeeCode : ''}</span>
                      </TableCell>
                    ) : null}
                    <TableCell className="tabular-nums">{formatTime(record.clockIn)}</TableCell>
                    <TableCell className="tabular-nums">{record.clockOut ? formatTime(record.clockOut) : '—'}</TableCell>
                    <TableCell className="tabular-nums">{formatMinutes(record.workedMinutes)}</TableCell>
                    <TableCell>
                      <AttendanceStatusBadge isOpen={record.isOpen} />
                    </TableCell>
                    <TableCell className="max-w-64 whitespace-normal">
                      {record.correctedBy ? (
                        <div>
                          <Badge variant="outline">Corrected by {fullName(record.correctedBy)}</Badge>
                          {record.correctionNote ? <p className="mt-1 text-xs text-muted-foreground">{record.correctionNote}</p> : null}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    {canCorrect ? (
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setCorrecting(record)} aria-label={'Correct attendance of ' + fullName(record.employee) + ' on ' + formatDate(record.workDate)}>
                          <PencilIcon aria-hidden="true" />
                          Correct
                        </Button>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination meta={attendance.data.meta} onPageChange={(page) => setParam('page', page)} isFetching={attendance.isFetching} />
          </div>
        ) : null}
      </Card>

      <CorrectAttendanceDialog record={correcting} onOpenChange={(open) => !open && setCorrecting(null)} />
    </>
  )
}
