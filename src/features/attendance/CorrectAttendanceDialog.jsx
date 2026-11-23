import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2Icon } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { FormField } from '@/components/FormField'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input, Textarea } from '@/components/ui/input'
import { applyFieldErrors, normalizeError } from '@/lib/apiError'
import { formatDate, fullName, toDateTimeInput } from '@/lib/format'
import { fieldA11y } from '@/lib/form'
import { useCorrectAttendanceMutation } from './attendanceApi'

const schema = z
  .object({
    clockIn: z.string().min(1, 'Clock-in is required'),
    clockOut: z.string(),
    note: z.string().trim().min(3, 'A correction note is required (at least 3 characters)').max(300, 'Note must be at most 300 characters'),
  })
  .refine((data) => !data.clockOut || new Date(data.clockOut) > new Date(data.clockIn), {
    path: ['clockOut'],
    message: 'Clock-out must be after clock-in',
  })

function CorrectionForm({ record, onDone, onCancel }) {
  const [correct] = useCorrectAttendanceMutation()
  const [formError, setFormError] = useState(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { clockIn: toDateTimeInput(record.clockIn), clockOut: toDateTimeInput(record.clockOut), note: '' },
  })

  async function onSubmit(values) {
    setFormError(null)
    // The inputs are in this browser's time zone; toISOString() sends the
    // exact moment with a time zone, as the backend requires.
    const changes = { note: values.note }
    if (dirtyFields.clockIn) changes.clockIn = new Date(values.clockIn).toISOString()
    if (dirtyFields.clockOut) changes.clockOut = values.clockOut ? new Date(values.clockOut).toISOString() : null
    if (!('clockIn' in changes) && !('clockOut' in changes)) {
      setFormError('Change the clock-in or clock-out time to correct this record.')
      return
    }
    try {
      await correct({ id: record.id, changes: changes }).unwrap()
      toast.success('Attendance corrected')
      onDone()
    } catch (error) {
      const problem = normalizeError(error)
      const shown = applyFieldErrors(problem.fieldErrors, setError, ['clockIn', 'clockOut', 'note'])
      if (!shown) setFormError(problem.message)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <DialogHeader>
        <DialogTitle>Correct attendance</DialogTitle>
        <DialogDescription>
          {fullName(record.employee)} · {formatDate(record.workDate)}. Times are in your local time zone; clock-in must stay on this working day.
        </DialogDescription>
      </DialogHeader>
      <DialogBody className="flex flex-col gap-4">
        {formError ? <Alert variant="danger">{formError}</Alert> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="clockIn" label="Clock in" error={errors.clockIn && errors.clockIn.message} required>
            <Input type="datetime-local" {...fieldA11y('clockIn', errors.clockIn)} {...register('clockIn')} />
          </FormField>
          <FormField id="clockOut" label="Clock out" error={errors.clockOut && errors.clockOut.message} hint="Leave empty to reopen the record">
            <Input type="datetime-local" {...fieldA11y('clockOut', errors.clockOut, 'hint')} {...register('clockOut')} />
          </FormField>
        </div>
        <FormField id="note" label="Reason for the correction" error={errors.note && errors.note.message} required>
          <Textarea rows={3} maxLength={300} placeholder="e.g. Forgot to clock out" {...fieldA11y('note', errors.note)} {...register('note')} />
        </FormField>
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : null}
          Save correction
        </Button>
      </DialogFooter>
    </form>
  )
}

// PATCH /api/attendance/:id (attendance:manage)
export function CorrectAttendanceDialog({ record, onOpenChange }) {
  return (
    <Dialog open={Boolean(record)} onOpenChange={onOpenChange}>
      <DialogContent>
        {record ? <CorrectionForm key={record.id} record={record} onDone={() => onOpenChange(false)} onCancel={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  )
}
