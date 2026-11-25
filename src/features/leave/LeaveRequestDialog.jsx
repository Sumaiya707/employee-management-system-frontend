import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2Icon } from 'lucide-react'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { FormField } from '@/components/FormField'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input, NativeSelect, Textarea } from '@/components/ui/input'
import { useListActiveLeaveTypesQuery } from '@/features/leaveTypes/leaveTypesApi'
import { useGetWorkCalendarQuery } from '@/features/workCalendar/workCalendarApi'
import { applyFieldErrors, normalizeError } from '@/lib/apiError'
import { allowanceText, balanceText, countDays, countWorkingDays, paidText } from '@/lib/format'
import { fieldA11y } from '@/lib/form'
import { requiredDate } from '@/lib/validation'
import { useGetLeaveBalancesQuery, useSubmitLeaveMutation } from './leaveApi'

// Same rules as the backend's createLeaveSchema (the backend also checks the
// 60-day limit, the allowed date window, the leave type and overlaps).
const schema = z
  .object({
    leaveType: z.string().min(1, 'Select a leave type'),
    startDate: requiredDate('Start date'),
    endDate: requiredDate('End date'),
    reason: z.string().trim().min(3, 'Reason is required (at least 3 characters)').max(500, 'Reason must be at most 500 characters'),
  })
  .refine((data) => !data.startDate || !data.endDate || data.startDate <= data.endDate, {
    path: ['endDate'],
    message: 'End date must be on or after the start date',
  })
  .refine((data) => (countDays(data.startDate, data.endDate) || 0) <= 60, { path: ['endDate'], message: 'A request can cover at most 60 days' })

function RequestForm({ onDone, onCancel }) {
  const [submitLeave] = useSubmitLeaveMutation()
  // The active leave types and the work calendar, both from the backend.
  const leaveTypes = useListActiveLeaveTypesQuery()
  const calendar = useGetWorkCalendarQuery()
  const [formError, setFormError] = useState(null)
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { leaveType: '', startDate: '', endDate: '', reason: '' } })
  // useWatch gives the CURRENT values of these fields, and the form is drawn again
  // every time one of them changes. We need them to show the chosen leave type's
  // details and the number of working days while the employee fills in the form.
  const [leaveTypeCode, startDate, endDate] = useWatch({ control, name: ['leaveType', 'startDate', 'endDate'] })

  // The year of the leave: the year of the first day ("2026-12-30" -> 2026),
  // or this year while no first day is chosen yet.
  let leaveYear = new Date().getFullYear()
  if (startDate) {
    leaveYear = Number(startDate.slice(0, 4))
  }
  // Your own leave balances in that year (the backend always gives your own).
  const balances = useGetLeaveBalancesQuery({ year: leaveYear })

  // Leave can be requested only after the work calendar has been set up.
  // calendar.data is empty (undefined) while the calendar is still loading.
  const calendarReady = Boolean(calendar.data && calendar.data.configured)

  // The leave types for the dropdown. While they are still loading there are none yet.
  let leaveTypeList = []
  if (leaveTypes.data) {
    leaveTypeList = leaveTypes.data
  }

  // The leave type chosen in the dropdown, to show its payment type and allowance.
  // The dropdown gives us only the code, so we look for the leave type with that code.
  let chosenType = null
  for (const leaveType of leaveTypeList) {
    if (leaveType.code === leaveTypeCode) {
      chosenType = leaveType
    }
  }

  // The text under the dates, e.g. "Total: 3 working days (weekend days and holidays are not counted)."
  // requestedDays stays null until both dates are chosen.
  let totalText = 'Choose the first and last day of your leave.'
  let requestedDays = null
  if (calendarReady) {
    // countWorkingDays needs only the holiday DATES, so we copy them into a simple list.
    const holidayDates = []
    for (const holiday of calendar.data.holidays) {
      holidayDates.push(holiday.date)
    }
    requestedDays = countWorkingDays(startDate, endDate, calendar.data.weekendDays, holidayDates)
    if (requestedDays !== null) {
      let dayWord = ' working days'
      if (requestedDays === 1) {
        dayWord = ' working day'
      }
      totalText = 'Total: ' + requestedDays + dayWord + ' (weekend days and holidays are not counted).'
    }
  }

  // The balance of the chosen leave type in that year, found by its code.
  let chosenBalance = null
  if (chosenType && balances.data) {
    for (const row of balances.data.balances) {
      if (row.code === chosenType.code) {
        chosenBalance = row
      }
    }
  }

  // The balance line under the leave type, e.g. "Balance in 2026: 3 of 10 working days available (5 used, 2 pending)".
  let balanceLine = null
  if (chosenBalance) {
    if (chosenBalance.allowanceRule === 'once_per_employment') {
      balanceLine = 'Balance for your whole employment: ' + balanceText(chosenBalance)
    } else {
      balanceLine = 'Balance in ' + leaveYear + ': ' + balanceText(chosenBalance)
    }
  }

  // Does the request cover two calendar years? ("2026" is not "2027")
  let crossesYears = false
  if (startDate && endDate && startDate.slice(0, 4) !== endDate.slice(0, 4)) {
    crossesYears = true
  }

  // A reason why this request cannot be sent, or null when it can be sent.
  // These are the same rules the backend checks again when the request arrives:
  //   1. a "per year" leave type cannot cross from one year into the next
  //   2. the request cannot need more days than are still available
  //      (pending requests already reserve their days)
  let balanceProblem = null
  if (chosenType && chosenType.allowanceRule === 'per_year' && crossesYears) {
    balanceProblem = chosenType.name + ' is counted per calendar year. Please send one request ending on 31 December and another starting on 1 January.'
  } else if (chosenBalance && chosenBalance.remainingDays !== null && requestedDays !== null) {
    if (requestedDays > chosenBalance.remainingDays) {
      // A negative balance (after the allowance was lowered) means 0 days are available.
      let availableDays = chosenBalance.remainingDays
      if (availableDays < 0) {
        availableDays = 0
      }
      balanceProblem =
        'This request needs ' + requestedDays + ' working day(s), but only ' + availableDays + ' ' + chosenType.name + ' day(s) are available, so it cannot be submitted.'
    }
  }

  async function onSubmit(values) {
    setFormError(null)
    try {
      await submitLeave({ ...values, reason: values.reason.trim() }).unwrap()
      toast.success('Leave request submitted', { description: 'It is now waiting for review.' })
      onDone()
    } catch (error) {
      const problem = normalizeError(error)
      const shown = applyFieldErrors(problem.fieldErrors, setError, ['leaveType', 'startDate', 'endDate', 'reason'])
      if (!shown) setFormError(problem.message)
    }
  }

  // The list has loaded, but the Super Admin has not created any active leave type yet.
  const noLeaveTypes = Boolean(leaveTypes.data && leaveTypes.data.length === 0)
  // The Submit button works only when the calendar is set up, leave types exist
  // AND there is no balance problem. (The backend checks the same things again.)
  const canSubmit = calendarReady && !noLeaveTypes && balanceProblem === null

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <DialogHeader>
        <DialogTitle>Request leave</DialogTitle>
        <DialogDescription>Your request is sent to HR for a decision.</DialogDescription>
      </DialogHeader>
      <DialogBody className="flex flex-col gap-4">
        {formError ? <Alert variant="danger">{formError}</Alert> : null}
        {calendar.data && !calendar.data.configured ? (
          <Alert variant="warning">Leave requests are not open yet: the work calendar has not been set up. Please contact your administrator.</Alert>
        ) : null}
        {noLeaveTypes ? <Alert variant="warning">No leave types are available yet. Please contact your administrator.</Alert> : null}
        {leaveTypes.isError || calendar.isError ? <Alert variant="danger">The leave settings could not be loaded. Please try again.</Alert> : null}

        <FormField id="leaveType" label="Leave type" error={errors.leaveType && errors.leaveType.message} required>
          <NativeSelect {...fieldA11y('leaveType', errors.leaveType)} {...register('leaveType')}>
            <option value="">{leaveTypes.isLoading ? 'Loading leave types…' : 'Select…'}</option>
            {/* One <option> for each leave type. The value sent to the backend is the
                leave type's code; the employee sees its name. */}
            {leaveTypeList.map((leaveType) => (
              <option key={leaveType.code} value={leaveType.code}>
                {leaveType.name}
              </option>
            ))}
          </NativeSelect>
        </FormField>
        {chosenType ? (
          <p className="-mt-2 text-[13px] text-muted-foreground">
            <span className="font-medium text-foreground">{paidText(chosenType.isPaid)}</span> · Allowance: {allowanceText(chosenType)}
            {chosenType.description ? ' · ' + chosenType.description : ''}
          </p>
        ) : null}
        {balanceLine ? <p className="-mt-2 text-[13px] text-muted-foreground">{balanceLine}</p> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="startDate" label="First day" error={errors.startDate && errors.startDate.message} required>
            <Input type="date" {...fieldA11y('startDate', errors.startDate)} {...register('startDate')} />
          </FormField>
          <FormField id="endDate" label="Last day" error={errors.endDate && errors.endDate.message} required>
            <Input type="date" {...fieldA11y('endDate', errors.endDate)} {...register('endDate')} />
          </FormField>
        </div>
        <p className="text-[13px] text-muted-foreground" aria-live="polite">
          {totalText}
        </p>
        {balanceProblem ? <Alert variant="danger">{balanceProblem}</Alert> : null}
        <FormField id="reason" label="Reason" error={errors.reason && errors.reason.message} required>
          <Textarea rows={3} maxLength={500} {...fieldA11y('reason', errors.reason)} {...register('reason')} />
        </FormField>
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !canSubmit}>
          {isSubmitting ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : null}
          Submit request
        </Button>
      </DialogFooter>
    </form>
  )
}

// POST /api/leaves (leave:request, own employee record only)
export function LeaveRequestDialog({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>{open ? <RequestForm onDone={() => onOpenChange(false)} onCancel={() => onOpenChange(false)} /> : null}</DialogContent>
    </Dialog>
  )
}
