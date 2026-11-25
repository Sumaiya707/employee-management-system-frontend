// The leave balance table (GET /api/leaves/balances). It is used on the My Leave
// page (your own balance) and on the Employee details page (HR / Super Admin).
//   employeeId  the employee to show; leave it out for your own balance
//
// For every active leave type: Allowance, Used (approved), Pending and Remaining.
// Remaining = Allowance - Used - Pending, because pending requests reserve their
// days until HR approves or rejects them. All numbers are working days.
import { useState } from 'react'
import { ErrorState, LoadingRows } from '@/components/QueryState'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { NativeSelect } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ALLOWANCE_RULE_LABELS, paidText } from '@/lib/format'
import { useGetLeaveBalancesQuery } from './leaveApi'

// The Allowance cell: the number of days, or "—" for leave types without a limit.
function allowanceCell(row) {
  if (row.allowanceDays === null) {
    return '—'
  }
  return String(row.allowanceDays)
}

// The Remaining cell: "No limit", a number, or e.g. "-1 (over the allowance)"
// when the Super Admin lowered the allowance below the days already used and pending.
function remainingCell(row) {
  if (row.remainingDays === null) {
    return 'No limit'
  }
  if (row.remainingDays < 0) {
    return row.remainingDays + ' (over the allowance)'
  }
  return String(row.remainingDays)
}

// The style of the Remaining cell: red when the balance is below zero.
function remainingClass(row) {
  if (row.remainingDays !== null && row.remainingDays < 0) {
    return 'font-medium text-danger tabular-nums'
  }
  return 'font-medium tabular-nums'
}

export function LeaveBalanceTable({ employeeId }) {
  // The dropdown offers last year, this year and next year; this year is chosen first.
  const thisYear = new Date().getFullYear()
  const [year, setYear] = useState(thisYear)
  const balances = useGetLeaveBalancesQuery({ employeeId: employeeId, year: year })

  let title = 'Leave balance'
  if (!employeeId) {
    title = 'My leave balance'
  }

  let content
  if (balances.isLoading) {
    content = <LoadingRows rows={3} />
  } else if (balances.isError) {
    content = <ErrorState error={balances.error} onRetry={balances.refetch} />
  } else if (balances.data.employee === null) {
    // Some HR and Super Admin accounts have no employee record, so they have no leave.
    content = <p className="px-5 py-5 text-sm text-muted-foreground">No employee record is linked to this account, so there is no leave balance.</p>
  } else if (balances.data.balances.length === 0) {
    content = <p className="px-5 py-5 text-sm text-muted-foreground">No leave types are available yet.</p>
  } else {
    content = (
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Leave type</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Allowance rule</TableHead>
            <TableHead>Allowance</TableHead>
            <TableHead>Used</TableHead>
            <TableHead>Pending</TableHead>
            <TableHead>Remaining</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {balances.data.balances.map((row) => (
            <TableRow key={row.code}>
              <TableCell className="font-medium">{row.name}</TableCell>
              <TableCell>{paidText(row.isPaid)}</TableCell>
              <TableCell>{ALLOWANCE_RULE_LABELS[row.allowanceRule]}</TableCell>
              <TableCell className="tabular-nums">{allowanceCell(row)}</TableCell>
              <TableCell className="tabular-nums">{row.approvedDays}</TableCell>
              <TableCell className="tabular-nums">{row.pendingDays}</TableCell>
              <TableCell className={remainingClass(row)}>{remainingCell(row)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            Working days. Pending requests reserve their days until they are approved or rejected. "Once per employment" counts all years together.
          </CardDescription>
        </div>
        <NativeSelect aria-label="Year" className="w-28" value={year} onChange={(event) => setYear(Number(event.target.value))}>
          <option value={thisYear - 1}>{thisYear - 1}</option>
          <option value={thisYear}>{thisYear}</option>
          <option value={thisYear + 1}>{thisYear + 1}</option>
        </NativeSelect>
      </CardHeader>
      <div className="pt-4">{content}</div>
    </Card>
  )
}
