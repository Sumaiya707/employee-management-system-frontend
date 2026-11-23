import { zodResolver } from '@hookform/resolvers/zod'
import { CheckIcon, CircleIcon, Loader2Icon } from 'lucide-react'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { FormField } from '@/components/FormField'
import { PasswordInput } from '@/components/PasswordInput'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { applyFieldErrors, normalizeError } from '@/lib/apiError'
import { fieldA11y } from '@/lib/form'
import { cn } from '@/lib/utils'
import { passwordProblems } from '@/lib/validation'
import { useChangePasswordMutation } from './authApi'

// Same rules as the backend's changePasswordSchema.
const schema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required').max(128, 'Password is too long'),
    newPassword: z.string().max(128, 'Password is too long'),
    confirmPassword: z.string().min(1, 'Please confirm the new password'),
  })
  .superRefine((data, ctx) => {
    const problems = passwordProblems(data.newPassword)
    if (problems.length > 0) {
      ctx.addIssue({ code: 'custom', path: ['newPassword'], message: 'New password needs ' + problems.join(', ') })
    } else if (data.newPassword === data.currentPassword) {
      ctx.addIssue({ code: 'custom', path: ['newPassword'], message: 'New password must be different from the current password' })
    }
    if (data.confirmPassword && data.newPassword !== data.confirmPassword) {
      ctx.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'Passwords do not match' })
    }
  })

const RULES = [
  { label: '12 or more characters', test: (value) => value.length >= 12 },
  { label: 'An uppercase letter', test: (value) => /[A-Z]/.test(value) },
  { label: 'A lowercase letter', test: (value) => /[a-z]/.test(value) },
  { label: 'A number', test: (value) => /[0-9]/.test(value) },
  { label: 'A symbol', test: (value) => /[^A-Za-z0-9]/.test(value) },
]

function PasswordRules({ value }) {
  return (
    <ul className="grid gap-1 text-xs sm:grid-cols-2" aria-label="Password requirements">
      {RULES.map((rule) => {
        const met = rule.test(value || '')
        return (
          <li key={rule.label} className={cn('flex items-center gap-1.5', met ? 'text-success' : 'text-muted-foreground')}>
            {met ? <CheckIcon className="size-3.5" aria-hidden="true" /> : <CircleIcon className="size-3" aria-hidden="true" />}
            {rule.label}
            <span className="sr-only">{met ? '(met)' : '(not met yet)'}</span>
          </li>
        )
      })}
    </ul>
  )
}

// PATCH /api/auth/password. Used on the forced change page and in My Profile.
export function ChangePasswordForm({ onDone, submitText = 'Change password' }) {
  const [changePassword, { isLoading }] = useChangePasswordMutation()
  const [formError, setFormError] = useState(null)
  const {
    register,
    handleSubmit,
    setError,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })
  const newPassword = useWatch({ control, name: 'newPassword' })

  async function onSubmit(values) {
    setFormError(null)
    try {
      const response = await changePassword(values).unwrap()
      reset()
      toast.success('Password changed', { description: response.message })
      if (onDone) onDone()
    } catch (error) {
      const problem = normalizeError(error)
      const shown = applyFieldErrors(problem.fieldErrors, setError, ['currentPassword', 'newPassword', 'confirmPassword'])
      if (!shown) setFormError(problem.message)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {formError ? <Alert variant="danger">{formError}</Alert> : null}
      <FormField id="currentPassword" label="Current password" error={errors.currentPassword && errors.currentPassword.message} required>
        <PasswordInput autoComplete="current-password" {...fieldA11y('currentPassword', errors.currentPassword)} {...register('currentPassword')} />
      </FormField>
      <FormField id="newPassword" label="New password" error={errors.newPassword && errors.newPassword.message} required>
        <PasswordInput autoComplete="new-password" {...fieldA11y('newPassword', errors.newPassword)} {...register('newPassword')} />
      </FormField>
      <PasswordRules value={newPassword} />
      <FormField id="confirmPassword" label="Confirm new password" error={errors.confirmPassword && errors.confirmPassword.message} required>
        <PasswordInput autoComplete="new-password" {...fieldA11y('confirmPassword', errors.confirmPassword)} {...register('confirmPassword')} />
      </FormField>
      <div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : null}
          {isLoading ? 'Saving…' : submitText}
        </Button>
      </div>
    </form>
  )
}
