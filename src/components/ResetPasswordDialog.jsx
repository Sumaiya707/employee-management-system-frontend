import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2Icon } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { FormField } from '@/components/FormField'
import { PasswordInput } from '@/components/PasswordInput'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { applyFieldErrors, normalizeError } from '@/lib/apiError'
import { fieldA11y } from '@/lib/form'
import { PASSWORD_HINT, strongPassword } from '@/lib/validation'

const schema = z
  .object({
    newPassword: strongPassword,
    confirmPassword: z.string().min(1, 'Please confirm the new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' })

function ResetForm({ personName, onSubmit, onCancel }) {
  const [formError, setFormError] = useState(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { newPassword: '', confirmPassword: '' } })

  async function submit(values) {
    setFormError(null)
    try {
      await onSubmit(values)
    } catch (error) {
      const problem = normalizeError(error)
      const shown = applyFieldErrors(problem.fieldErrors, setError, ['newPassword', 'confirmPassword'])
      if (!shown) setFormError(problem.message)
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate>
      <DialogHeader>
        <DialogTitle>Reset password</DialogTitle>
        <DialogDescription>
          Set a temporary password for {personName}. Their sessions end now, and they must choose their own password at the next login.
        </DialogDescription>
      </DialogHeader>
      <DialogBody className="flex flex-col gap-4">
        {formError ? <Alert variant="danger">{formError}</Alert> : null}
        <FormField id="reset-new" label="Temporary password" error={errors.newPassword && errors.newPassword.message} hint={PASSWORD_HINT} required>
          <PasswordInput autoComplete="new-password" {...fieldA11y('reset-new', errors.newPassword, PASSWORD_HINT)} {...register('newPassword')} />
        </FormField>
        <FormField id="reset-confirm" label="Confirm password" error={errors.confirmPassword && errors.confirmPassword.message} required>
          <PasswordInput autoComplete="new-password" {...fieldA11y('reset-confirm', errors.confirmPassword)} {...register('confirmPassword')} />
        </FormField>
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : null}
          Reset password
        </Button>
      </DialogFooter>
    </form>
  )
}

// onSubmit({ newPassword, confirmPassword }) must call the API and throw on failure.
export function ResetPasswordDialog({ open, onOpenChange, personName, onSubmit }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>{open ? <ResetForm personName={personName} onSubmit={onSubmit} onCancel={() => onOpenChange(false)} /> : null}</DialogContent>
    </Dialog>
  )
}
