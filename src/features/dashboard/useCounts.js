// Small counts for dashboard cards, read from list endpoints' meta.total.
// The dashboard endpoint itself has no attendance or leave numbers yet.
import { useListAttendanceQuery } from '@/features/attendance/attendanceApi'
import { useListLeavesQuery } from '@/features/leave/leaveApi'

// shouldLoad: true = ask the backend for the number, false = do not ask.
// ("skip" below is RTK Query's own option name; it is the opposite of shouldLoad.)

// Leave requests waiting for a decision (GET /api/leaves?status=pending).
export function usePendingLeaveCount(shouldLoad) {
  const result = useListLeavesQuery({ status: 'pending', limit: 1 }, { skip: !shouldLoad })
  return { count: result.data ? result.data.meta.total : null, isError: result.isError }
}

// Attendance records still open, i.e. clocked in but not out (GET /api/attendance?status=open).
export function useOpenAttendanceCount(shouldLoad) {
  const result = useListAttendanceQuery({ status: 'open', limit: 1 }, { skip: !shouldLoad })
  return { count: result.data ? result.data.meta.total : null, isError: result.isError }
}
