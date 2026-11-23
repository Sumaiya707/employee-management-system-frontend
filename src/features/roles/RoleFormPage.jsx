// Note: fields that must not change use readOnly, not disabled: React Hook
// Form leaves disabled inputs out of the submitted values.
//
// Create a custom role (/roles/new) or view / edit a role (/roles/:id).
// Rules from the backend: the Super Admin role cannot be edited; system roles
// (HR, Employee) keep their name; the key never changes; Super-Admin-only
// permissions (users:*, roles:*) cannot be given to any other role.
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeftIcon, Loader2Icon, LockIcon } from 'lucide-react'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { FormField } from '@/components/FormField'
import { PageHeader } from '@/components/PageHeader'
import { ErrorState, LoadingBlock } from '@/components/QueryState'
import { ActiveBadge } from '@/components/StatusBadges'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, NativeSelect, Textarea } from '@/components/ui/input'
import { useSession } from '@/features/auth/useSession'
import { applyFieldErrors, normalizeError } from '@/lib/apiError'
import { fieldA11y } from '@/lib/form'
import { useCreateRoleMutation, useGetPermissionCatalogueQuery, useGetRoleQuery, useUpdateRoleMutation } from './rolesApi'
import { RoleTypeBadge } from './RoleTypeBadge'

const schema = z.object({
  name: z.string().trim().min(2, 'Role name must be at least 2 characters').max(50, 'Role name must be at most 50 characters'),
  key: z
    .string()
    .trim()
    .regex(/^[a-z][a-z0-9_]{1,29}$/, 'Key: 2-30 lowercase letters, numbers and _, starting with a letter'),
  description: z.string().trim().max(200, 'Description must be at most 200 characters'),
  dataScope: z.enum(['all', 'self']),
  permissionKeys: z.array(z.string()),
})

const MODULE_LABELS = {
  activity: 'Activity log',
  attendance: 'Attendance',
  dashboard: 'Dashboard',
  departments: 'Departments',
  designations: 'Designations',
  employees: 'Employees',
  leave: 'Leave',
  profile: 'My profile',
  reports: 'Reports',
  roles: 'Roles & permissions',
  users: 'User accounts',
}

function PermissionPicker({ catalogue, register, readOnly, isSuperAdminRole, selected }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {catalogue.modules.map((group) => (
        <fieldset key={group.module} className="rounded-md border p-4">
          <legend className="px-1 text-[13px] font-semibold">{MODULE_LABELS[group.module] || group.module}</legend>
          <ul className="mt-1 flex flex-col gap-2.5">
            {group.permissions.map((permission) => {
              const locked = permission.superAdminOnly

              let checkbox
              if (isSuperAdminRole || locked) {
                // Shown only, never part of the form: ticked for the Super Admin
                // role (it has every permission), never for Super-Admin-only
                // permissions on other roles.
                const checked = isSuperAdminRole || selected.includes(permission.key)
                checkbox = (
                  <input
                    id={'perm-' + permission.key}
                    type="checkbox"
                    value={permission.key}
                    className="mt-0.5 size-4 shrink-0"
                    disabled={true}
                    checked={checked}
                    readOnly={true}
                  />
                )
              } else {
                // A normal form checkbox; it can only be clicked when the role is editable.
                checkbox = (
                  <input
                    id={'perm-' + permission.key}
                    type="checkbox"
                    value={permission.key}
                    className="mt-0.5 size-4 shrink-0"
                    disabled={readOnly}
                    {...register('permissionKeys')}
                  />
                )
              }

              return (
                <li key={permission.key} className="flex items-start gap-2.5">
                  {checkbox}
                  <label htmlFor={'perm-' + permission.key} className="text-sm leading-snug">
                    <code className="text-xs">{permission.key}</code>
                    <span className="block text-xs text-muted-foreground">{permission.description}</span>
                    {locked && !isSuperAdminRole ? (
                      <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <LockIcon className="size-3" aria-hidden="true" />
                        Super Admin only
                      </span>
                    ) : null}
                  </label>
                </li>
              )
            })}
          </ul>
        </fieldset>
      ))}
    </div>
  )
}

function RoleForm({ role, catalogue }) {
  const { can, user } = useSession()
  const navigate = useNavigate()
  const isEdit = Boolean(role)
  const isSuperAdminRole = Boolean(role && role.isSuperAdmin)
  const isSystemRole = Boolean(role && role.isSystem)
  const isOwnRole = Boolean(role && user.role && user.role.id === role.id)
  const readOnly = !can('roles:manage') || isSuperAdminRole || isOwnRole
  const [createRole] = useCreateRoleMutation()
  const [updateRole] = useUpdateRoleMutation()
  const [formError, setFormError] = useState(null)

  // Everything that differs between creating and editing.
  let initial = { name: '', key: '', description: '', dataScope: 'self', permissionKeys: ['dashboard:view', 'profile:view'] }
  let keyHint = 'e.g. senior_hr. Cannot be changed later.'
  let keyClass = 'font-mono'
  let submitText = 'Create role'
  if (isEdit) {
    initial = { name: role.name, key: role.key, description: role.description || '', dataScope: role.dataScope, permissionKeys: role.permissions }
    keyHint = 'The key never changes'
    keyClass = 'bg-muted font-mono text-muted-foreground'
    submitText = 'Save changes'
  }

  // System roles (HR, Employee) keep their name.
  let nameHint
  let nameClass
  if (isSystemRole) {
    nameHint = 'System role names cannot be changed'
    nameClass = 'bg-muted text-muted-foreground'
  }

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: initial })
  const selected = useWatch({ control, name: 'permissionKeys' }) || []

  async function onSubmit(values) {
    setFormError(null)
    try {
      if (isEdit) {
        const changes = {}
        if (!role.isSystem && values.name.trim() !== role.name) changes.name = values.name.trim()
        if (values.description.trim() !== (role.description || '')) changes.description = values.description.trim()
        if (values.dataScope !== role.dataScope) changes.dataScope = values.dataScope

        // The permissions changed if the number is different, or if any ticked
        // permission was not in the role before. (The order does not matter.)
        let permissionsChanged = values.permissionKeys.length !== role.permissions.length
        for (const key of values.permissionKeys) {
          if (!role.permissions.includes(key)) {
            permissionsChanged = true
          }
        }
        if (permissionsChanged) changes.permissionKeys = values.permissionKeys

        if (Object.keys(changes).length === 0) {
          toast.info('No changes to save')
          return
        }
        await updateRole({ id: role.id, changes: changes }).unwrap()
        toast.success('Role updated')
      } else {
        const created = await createRole(values).unwrap()
        toast.success('Role created')
        navigate('/roles/' + created.id, { replace: true })
      }
    } catch (error) {
      const problem = normalizeError(error)
      const shown = applyFieldErrors(problem.fieldErrors, setError, ['name', 'key', 'description', 'dataScope'])

      // The message above the form. A permission problem comes first; then a
      // general note if field errors are shown; otherwise the backend's message.
      let message = problem.message
      if (shown) {
        message = 'Please correct the highlighted fields.'
      }
      if (problem.fieldErrors.permissionKeys) {
        message = problem.fieldErrors.permissionKeys
      }
      setFormError(message)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      {formError ? <Alert variant="danger">{formError}</Alert> : null}
      {isSuperAdminRole ? <Alert variant="info">The Super Admin role always has every permission and cannot be edited.</Alert> : null}
      {isOwnRole && !isSuperAdminRole ? <Alert variant="info">This is your own role, so you cannot change it.</Alert> : null}

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormField id="name" label="Role name" error={errors.name && errors.name.message} hint={nameHint} required>
            <Input disabled={readOnly} readOnly={isSystemRole} className={nameClass} {...fieldA11y('name', errors.name, nameHint)} {...register('name')} />
          </FormField>
          <FormField id="key" label="Key" error={errors.key && errors.key.message} hint={keyHint} required>
            <Input disabled={readOnly} readOnly={isEdit} className={keyClass} {...fieldA11y('key', errors.key, keyHint)} {...register('key')} />
          </FormField>
          <FormField id="description" label="Description" error={errors.description && errors.description.message} className="sm:col-span-2">
            <Textarea rows={2} disabled={readOnly} maxLength={200} {...fieldA11y('description', errors.description)} {...register('description')} />
          </FormField>
          <FormField id="dataScope" label="Data scope" hint="Which records the role's permissions reach">
            <NativeSelect disabled={readOnly} {...fieldA11y('dataScope', errors.dataScope, 'hint')} {...register('dataScope')}>
              <option value="self">Own records only</option>
              <option value="all">Whole organisation</option>
            </NativeSelect>
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Permissions</CardTitle>
            <CardDescription>{isSuperAdminRole ? 'Every permission.' : selected.length + ' of ' + catalogue.total + ' selected'}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <PermissionPicker catalogue={catalogue} register={register} readOnly={readOnly} isSuperAdminRole={isSuperAdminRole} selected={selected} />
        </CardContent>
        {!readOnly ? (
          <CardFooter className="justify-end">
            <Button asChild variant="outline">
              <Link to="/roles">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : null}
              {submitText}
            </Button>
          </CardFooter>
        ) : null}
      </Card>
    </form>
  )
}

export default function RoleFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const role = useGetRoleQuery(id, { skip: !isEdit })
  const catalogue = useGetPermissionCatalogueQuery()

  const back = (
    <Link to="/roles" className="mb-3 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground">
      <ArrowLeftIcon className="size-3.5" aria-hidden="true" />
      Roles & Permissions
    </Link>
  )
  const loading = catalogue.isLoading || (isEdit && role.isLoading)

  // Which request failed, if any: the permission list first, then the role.
  let failed = null
  if (catalogue.isError) {
    failed = catalogue
  } else if (isEdit && role.isError) {
    failed = role
  }

  // Page title and text: "New role", or the role's name and user count once loaded.
  let title = 'New role'
  let description = 'Custom roles can be assigned to HR and administrator accounts.'
  if (isEdit) {
    title = 'Role'
    description = undefined
    if (role.data) {
      title = role.data.name
      description = role.data.userCount + ' user(s) have this role.'
    }
  }

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        actions={
          role.data ? (
            <div className="flex gap-2">
              <RoleTypeBadge role={role.data} />
              <ActiveBadge isActive={role.data.isActive} />
            </div>
          ) : null
        }
      >
        {back}
      </PageHeader>
      {loading ? <LoadingBlock /> : null}
      {failed ? <ErrorState error={failed.error} onRetry={failed.refetch} /> : null}
      {!loading && !failed && catalogue.data ? <RoleForm key={isEdit ? role.data.id + role.data.updatedAt : 'new'} role={isEdit ? role.data : null} catalogue={catalogue.data} /> : null}
    </>
  )
}
