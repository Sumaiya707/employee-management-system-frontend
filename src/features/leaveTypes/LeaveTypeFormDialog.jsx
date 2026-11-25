// Create (POST /api/leave-types) or edit (PATCH /api/leave-types/:id) a leave type.
// A new leave type is always active; the list page activates/deactivates it.
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
import { ALLOWANCE_RULE_LABELS } from '@/lib/format'
import { fieldA11y } from '@/lib/form'
import { useCreateLeaveTypeMutation, useUpdateLeaveTypeMutation } from './leaveTypesApi'

// The same rules as the backend's leaveType.validators.js, so the employee sees a
// mistake at once, before anything is sent. (The backend still checks again.)
// HTML inputs always give TEXT, so here "paid" is the text "paid" or "unpaid" and
// allowanceDays is text like "14". onSubmit (below) turns them into true/false and a number.
const schema = z
  .object({
    name: z.string().trim().min(2, 'Leave type name must be at least 2 characters').max(60, 'Leave type name must be at most 60 characters'),
    description: z.string().trim().max(300, 'Description must be at most 300 characters'),
    paid: z.enum(['paid', 'unpaid'], { error: 'Choose paid or unpaid' }),
    allowanceRule: z.enum(['per_year', 'once_per_employment', 'no_limit'], { error: 'Choose an allowance rule' }),
    allowanceDays: z.string(),
  })
  // superRefine: a check that looks at TWO fields together (rule and days).
  // ctx.addIssue(...) shows the message under the allowance days field.
  .superRefine(function (data, ctx) {
    // Allowance days are needed for every rule except "no fixed limit".
    if (data.allowanceRule === 'no_limit') {
      return
    }
    // Number("14") gives 14. Number("abc") gives NaN ("not a number").
    const days = Number(data.allowanceDays)
    // The days are wrong when the box is empty, OR it is not a whole number
    // (Number.isInteger(2.5) is false), OR it is below 1, OR it is above 365.
    if (data.allowanceDays.trim() === '' || !Number.isInteger(days) || days < 1 || days > 365) {
      ctx.addIssue({ code: 'custom', path: ['allowanceDays'], message: 'Enter a whole number of days from 1 to 365' })
    }
  })

function LeaveTypeForm({ leaveType, onDone, onCancel }) {
  const isEdit = Boolean(leaveType)
  const [createLeaveType] = useCreateLeaveTypeMutation()
  const [updateLeaveType] = useUpdateLeaveTypeMutation()
  const [formError, setFormError] = useState(null)

  // The values the form starts with: empty when creating, the saved ones when editing.
  let startValues = { name: '', description: '', paid: '', allowanceRule: '', allowanceDays: '' }
  let title = 'New leave type'
  let submitText = 'Create leave type'
  if (isEdit) {
    // Turn the saved values into form text: true -> "paid", 14 -> "14", null -> "".
    let paid = 'unpaid'
    if (leaveType.isPaid) {
      paid = 'paid'
    }
    let days = ''
    if (leaveType.allowanceDays !== null) {
      days = String(leaveType.allowanceDays)
    }
    startValues = { name: leaveType.name, description: leaveType.description || '', paid: paid, allowanceRule: leaveType.allowanceRule, allowanceDays: days }
    title = 'Edit ' + leaveType.name
    submitText = 'Save changes'
  }

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: startValues })
  // The days field is shown only for rules that have a number of days.
  // useWatch gives the CURRENT allowance rule and redraws the form whenever it changes,
  // so the days field appears or disappears as soon as another rule is chosen.
  const allowanceRule = useWatch({ control, name: 'allowanceRule' })
  const needsDays = allowanceRule === 'per_year' || allowanceRule === 'once_per_employment'

  async function onSubmit(values) {
    setFormError(null)
    // Turn the form text into the values the backend expects.
    let allowanceDays = null
    if (values.allowanceRule !== 'no_limit') {
      allowanceDays = Number(values.allowanceDays)
    }
    const body = {
      name: values.name,
      description: values.description,
      isPaid: values.paid === 'paid',
      allowanceRule: values.allowanceRule,
      allowanceDays: allowanceDays,
    }
    try {
      // .unwrap() turns an error answer from the backend (e.g. 409 "name already
      // exists") into an error that the catch block below receives.
      if (isEdit) {
        await updateLeaveType({ id: leaveType.id, body: body }).unwrap()
        toast.success('Leave type updated')
      } else {
        const created = await createLeaveType(body).unwrap()
        toast.success('Leave type created', { description: created.name + ' can now be chosen on leave requests.' })
      }
      onDone()
    } catch (error) {
      const problem = normalizeError(error)
      const shown = applyFieldErrors(problem.fieldErrors, setError, ['name', 'description', 'allowanceRule', 'allowanceDays'])
      if (!shown) {
        setFormError(problem.message)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>Employees see the payment type and allowance when they request leave.</DialogDescription>
      </DialogHeader>
      <DialogBody className="flex flex-col gap-4">
        {formError ? <Alert variant="danger">{formError}</Alert> : null}
        <FormField id="lt-name" label="Leave type name" error={errors.name && errors.name.message} required>
          <Input autoComplete="off" placeholder="e.g. Annual Leave" {...fieldA11y('lt-name', errors.name)} {...register('name')} />
        </FormField>
        <FormField id="lt-description" label="Description" error={errors.description && errors.description.message}>
          <Textarea rows={2} {...fieldA11y('lt-description', errors.description)} {...register('description')} />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="lt-paid" label="Payment type" error={errors.paid && errors.paid.message} required>
            <NativeSelect {...fieldA11y('lt-paid', errors.paid)} {...register('paid')}>
              <option value="">Select…</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </NativeSelect>
          </FormField>
          <FormField id="lt-rule" label="Allowance rule" error={errors.allowanceRule && errors.allowanceRule.message} required>
            <NativeSelect {...fieldA11y('lt-rule', errors.allowanceRule)} {...register('allowanceRule')}>
              <option value="">Select…</option>
              <option value="per_year">{ALLOWANCE_RULE_LABELS.per_year}</option>
              <option value="once_per_employment">{ALLOWANCE_RULE_LABELS.once_per_employment}</option>
              <option value="no_limit">{ALLOWANCE_RULE_LABELS.no_limit}</option>
            </NativeSelect>
          </FormField>
        </div>
        {needsDays ? (
          <FormField id="lt-days" label="Allowance days" error={errors.allowanceDays && errors.allowanceDays.message} hint="Working days, 1 to 365" required>
            <Input type="number" min={1} max={365} {...fieldA11y('lt-days', errors.allowanceDays, 'Working days, 1 to 365')} {...register('allowanceDays')} />
          </FormField>
        ) : null}
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : null}
          {submitText}
        </Button>
      </DialogFooter>
    </form>
  )
}

// leaveType: null → create; a leave type object → edit.
// The form is only drawn while the dialog is open. Its "key" is the leave type's id
// (or "new"): a different key makes React start a NEW, fresh form, so the fields
// always show the right starting values when another leave type is opened.
export function LeaveTypeFormDialog({ open, leaveType, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open ? (
          <LeaveTypeForm key={leaveType ? leaveType.id : 'new'} leaveType={leaveType} onDone={() => onOpenChange(false)} onCancel={() => onOpenChange(false)} />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
