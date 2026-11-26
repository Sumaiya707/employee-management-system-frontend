import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2Icon } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { FormField } from '@/components/FormField'
import { PasswordInput } from '@/components/PasswordInput'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input, NativeSelect } from '@/components/ui/input'
import { useListRolesQuery } from '@/features/roles/rolesApi'
import { applyFieldErrors, normalizeError } from '@/lib/apiError'
import { STATUS_CHOICE_LABELS, fullName } from '@/lib/format'
import { fieldA11y } from '@/lib/form'
import { PASSWORD_HINT, emailField, nameField, strongPassword } from '@/lib/validation'
import { useCreateUserMutation, useUpdateUserMutation } from './usersApi'

const baseFields = {
  firstName: nameField('First name'),
  lastName: nameField('Last name'),
  email: emailField,
  roleId: z.string().min(1, 'Select a role'),
}
const createSchema = z.object({ ...baseFields, password: strongPassword })
// Editing also has the account status (Active, Resigned or Terminated).
const editSchema = z.object({ ...baseFields, employmentStatus: z.enum(['active', 'resigned', 'terminated']) })

// The hint under the Status dropdown.
const STATUS_HINT = 'Resigned or Terminated blocks login at once and signs the person out. Active allows login again.'

function UserForm({ user, isSelf, onDone, onCancel }) {
  const isEdit = Boolean(user)
  // Roles that can be assigned here: active, and not the Employee role
  // (employee accounts are created with their employee record).
  const roles = useListRolesQuery({ status: 'active', limit: 100, sort: 'name' })
  const [createUser] = useCreateUserMutation()
  const [updateUser] = useUpdateUserMutation()
  const [formError, setFormError] = useState(null)

  // Create mode: empty form with a password. Edit mode: the user's current
  // values, no password field (passwords are reset separately).
  let schema = createSchema
  let startValues = { firstName: '', lastName: '', email: '', password: '', roleId: '' }
  let title = 'New login account'
  let description = 'For HR and administrator accounts. Employee accounts are created from the Employees page.'
  let submitText = 'Create account'
  if (isEdit) {
    let currentRoleId = ''
    if (user.role) {
      currentRoleId = user.role.id
    }
    schema = editSchema
    startValues = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roleId: currentRoleId,
      employmentStatus: user.employmentStatus || 'active',
    }
    title = 'Edit ' + fullName(user)
    description = 'Role changes apply on the user’s next request.'
    submitText = 'Save changes'
  }

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: startValues })

  // The Status dropdown is shown only when editing an HR account (or another
  // non-Super Admin account). Super Admin accounts always stay Active, so they
  // get no Status choice (the backend refuses it too).
  let showStatus = false
  if (isEdit && user.role && !user.role.isSuperAdmin) {
    showStatus = true
  }

  // The roles to choose from: every active role except Employee.
  const roleOptions = []
  let currentRoleIsListed = false
  if (roles.data) {
    for (const role of roles.data.items) {
      if (role.key !== 'employee') {
        roleOptions.push({ id: role.id, name: role.name })
        if (isEdit && user.role && role.id === user.role.id) {
          currentRoleIsListed = true
        }
      }
    }
  }
  // While editing, keep the user's current role in the list even if it is no
  // longer active, so the form still shows it.
  if (isEdit && user.role && !currentRoleIsListed) {
    roleOptions.push({ id: user.role.id, name: user.role.name + ' (inactive)' })
  }

  async function onSubmit(values) {
    setFormError(null)
    try {
      if (isEdit) {
        const changes = {}
        for (const key of Object.keys(dirtyFields)) changes[key] = values[key]
        if (Object.keys(changes).length === 0) {
          onDone()
          return
        }
        await updateUser({ id: user.id, changes: changes }).unwrap()
        toast.success('Account updated')
      } else {
        const created = await createUser(values).unwrap()
        toast.success('Account created', { description: created.email + ' must change the temporary password at first login.' })
      }
      onDone()
    } catch (error) {
      const problem = normalizeError(error)
      const shown = applyFieldErrors(problem.fieldErrors, setError, ['firstName', 'lastName', 'email', 'password', 'roleId', 'employmentStatus'])
      if (!shown) setFormError(problem.message)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogBody className="flex flex-col gap-4">
        {formError ? <Alert variant="danger">{formError}</Alert> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="u-first" label="First name" error={errors.firstName && errors.firstName.message} required>
            <Input {...fieldA11y('u-first', errors.firstName)} {...register('firstName')} />
          </FormField>
          <FormField id="u-last" label="Last name" error={errors.lastName && errors.lastName.message} required>
            <Input {...fieldA11y('u-last', errors.lastName)} {...register('lastName')} />
          </FormField>
        </div>
        <FormField id="u-email" label="Email" error={errors.email && errors.email.message} required>
          <Input type="email" autoComplete="off" {...fieldA11y('u-email', errors.email)} {...register('email')} />
        </FormField>
        <FormField
          id="u-role"
          label="Role"
          error={(errors.roleId && errors.roleId.message) || (roles.isError ? 'Roles could not be loaded.' : undefined)}
          hint={isSelf ? 'You cannot change your own role.' : undefined}
          required
        >
          {isSelf ? (
            // Shown read-only; the unchanged roleId stays in the form values.
            <Input id="u-role" value={user.role ? user.role.name : ''} readOnly disabled aria-describedby="u-role-hint" />
          ) : (
            <NativeSelect {...fieldA11y('u-role', errors.roleId)} {...register('roleId')}>
              <option value="">{roles.isLoading ? 'Loading roles…' : 'Select a role…'}</option>
              {roleOptions.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </NativeSelect>
          )}
        </FormField>
        {showStatus ? (
          <FormField id="u-status" label="Status" error={errors.employmentStatus && errors.employmentStatus.message} hint={STATUS_HINT} required>
            <NativeSelect {...fieldA11y('u-status', errors.employmentStatus, STATUS_HINT)} {...register('employmentStatus')}>
              {Object.entries(STATUS_CHOICE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NativeSelect>
          </FormField>
        ) : null}
        {!isEdit ? (
          <FormField id="u-password" label="Temporary password" error={errors.password && errors.password.message} hint={PASSWORD_HINT} required>
            <PasswordInput autoComplete="new-password" {...fieldA11y('u-password', errors.password, PASSWORD_HINT)} {...register('password')} />
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

// user: null → create; a user object → edit.
export function UserFormDialog({ open, user, isSelf, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open ? <UserForm key={user ? user.id : 'new'} user={user} isSelf={isSelf} onDone={() => onOpenChange(false)} onCancel={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  )
}
