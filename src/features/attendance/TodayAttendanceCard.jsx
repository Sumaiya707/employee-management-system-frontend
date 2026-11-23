import { Loader2Icon, LogInIcon, LogOutIcon } from 'lucide-react'
import { toast } from 'sonner'
import { ErrorState, LoadingRows } from '@/components/QueryState'
import { AttendanceStatusBadge } from '@/components/StatusBadges'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { normalizeError } from '@/lib/apiError'
import { formatDate, formatMinutes, formatTime } from '@/lib/format'
import { useClockInMutation, useClockOutMutation, useGetTodayAttendanceQuery } from './attendanceApi'

function Detail({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium tabular-nums">{value}</dd>
    </div>
  )
}

// Clock in / clock out for the logged-in employee's own record.
// Only shown when the user has an employee record and attendance:clock.
export function TodayAttendanceCard() {
  const today = useGetTodayAttendanceQuery()
  const [clockIn, clockInState] = useClockInMutation()
  const [clockOut, clockOutState] = useClockOutMutation()
  const busy = clockInState.isLoading || clockOutState.isLoading

  // Today's attendance record, or null if the employee has not clocked in yet.
  let record = null
  if (today.data) {
    record = today.data.attendance
  }

  // "not_started" = no record yet, "working" = clocked in, "done" = clocked out.
  let status
  if (!record) {
    status = 'not_started'
  } else if (record.isOpen) {
    status = 'working'
  } else {
    status = 'done'
  }

  async function handleClockIn() {
    try {
      const newRecord = await clockIn().unwrap()
      toast.success('Clocked in', { description: 'Recorded at ' + formatTime(newRecord.clockIn) + '.' })
    } catch (error) {
      toast.error('Attendance not updated', { description: normalizeError(error).message })
      today.refetch()
    }
  }

  async function handleClockOut() {
    try {
      const newRecord = await clockOut().unwrap()
      toast.success('Clocked out', { description: 'Recorded at ' + formatTime(newRecord.clockOut) + '.' })
    } catch (error) {
      toast.error('Attendance not updated', { description: normalizeError(error).message })
      today.refetch()
    }
  }

  let clockInText = '—'
  let clockOutText = '—'
  let workedText = '—'
  if (record) {
    clockInText = formatTime(record.clockIn)
    clockOutText = formatTime(record.clockOut)
    workedText = formatMinutes(record.workedMinutes)
  }

  let dateText = 'Your attendance for today'
  if (today.data) {
    dateText = formatDate(today.data.workDate) + ' (company working day)'
  }

  let body
  if (today.isLoading) {
    body = <LoadingRows rows={2} className="p-0" />
  } else if (today.isError) {
    body = <ErrorState error={today.error} onRetry={today.refetch} className="py-6" />
  } else {
    body = (
      <div className="flex flex-col gap-5">
        <dl className="grid grid-cols-3 gap-4">
          <Detail label="Clock in" value={clockInText} />
          <Detail label="Clock out" value={clockOutText} />
          <Detail label="Worked" value={workedText} />
        </dl>
        <div className="flex flex-wrap items-center gap-3">
          {status === 'not_started' ? (
            <Button onClick={handleClockIn} disabled={busy}>
              {clockInState.isLoading ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : <LogInIcon aria-hidden="true" />}
              Clock in
            </Button>
          ) : null}
          {status === 'working' ? (
            <Button onClick={handleClockOut} disabled={busy}>
              {clockOutState.isLoading ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : <LogOutIcon aria-hidden="true" />}
              Clock out
            </Button>
          ) : null}
          {status === 'done' ? <p className="text-sm text-muted-foreground">You have finished today's attendance.</p> : null}
          {status === 'not_started' ? <p className="text-sm text-muted-foreground">You have not clocked in today.</p> : null}
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Today's attendance</CardTitle>
          <CardDescription>{dateText}</CardDescription>
        </div>
        {record ? <AttendanceStatusBadge isOpen={record.isOpen} /> : null}
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  )
}
