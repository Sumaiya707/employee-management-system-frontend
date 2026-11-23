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
import { applyFieldErrors, normalizeError } from '@/lib/apiError'
import { LEAVE_TYPE_LABELS, countDays } from '@/lib/format'
import { fieldA11y } from '@/lib/form'
import { requiredDate } from '@/lib/validation'
import { useSubmitLeaveMutation } from './leaveApi'

// Same rules as the backend's createLeaveSchema (the backend also checks the
// 60-day limit, the allowed date window and overlaps with your other requests).
const schema = z
  .object({
    leaveType: z.string().refine((value) => Object.keys(LEAVE_TYPE_LABELS).includes(value), 'Select a leave type'),
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
  const [formError, setFormError] = useState(null)
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { leaveType: '', startDate: '', endDate: '', reason: '' } })
  const [startDate, endDate] = useWatch({ control, name: ['startDate', 'endDate'] })
  const days = countDays(startDate, endDate)

  // The text under the dates, e.g. "Total: 3 calendar days (first and last day included)."
  let totalText = 'Choose the first and last day of your leave.'
  if (days) {
    let dayWord = ' calendar days'
    if (days === 1) {
      dayWord = ' calendar day'
    }
    totalText = 'Total: ' + days + dayWord + ' (first and last day included).'
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <DialogHeader>
        <DialogTitle>Request leave</DialogTitle>
        <DialogDescription>Your request is sent to HR for a decision.</DialogDescription>
      </DialogHeader>
      <DialogBody className="flex flex-col gap-4">
        {formError ? <Alert variant="danger">{formError}</Alert> : null}
        <FormField id="leaveType" label="Leave type" error={errors.leaveType && errors.leaveType.message} required>
          <NativeSelect {...fieldA11y('leaveType', errors.leaveType)} {...register('leaveType')}>
            <option value="">Select…</option>
            {Object.entries(LEAVE_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </FormField>
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
        <FormField id="reason" label="Reason" error={errors.reason && errors.reason.message} required>
          <Textarea rows={3} maxLength={500} {...fieldA11y('reason', errors.reason)} {...register('reason')} />
        </FormField>
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
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
