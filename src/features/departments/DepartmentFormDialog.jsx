// Create (POST /api/departments) or edit (PATCH /api/departments/:id) a department.
// A new department is always active; the list page activates/deactivates it.
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
import { fieldA11y } from '@/lib/form'
import { useCreateDepartmentMutation, useUpdateDepartmentMutation } from './departmentsApi'

// The same rules as the backend's department.validators.js.
const schema = z.object({
  name: z.string().trim().min(2, 'Department name must be at least 2 characters').max(100, 'Department name must be at most 100 characters'),
  description: z.string().trim().max(300, 'Description must be at most 300 characters'),
})

function DepartmentForm({ department, onDone, onCancel }) {
  const isEdit = Boolean(department)
  const [createDepartment] = useCreateDepartmentMutation()
  const [updateDepartment] = useUpdateDepartmentMutation()
  const [formError, setFormError] = useState(null)

  let startValues = { name: '', description: '' }
  let title = 'New department'
  let submitText = 'Create department'
  if (isEdit) {
    startValues = { name: department.name, description: department.description || '' }
    title = 'Edit ' + department.name
    submitText = 'Save changes'
  }

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: startValues })

  async function onSubmit(values) {
    setFormError(null)
    try {
      if (isEdit) {
        // PATCH sends only the fields that were changed.
        const changes = {}
        for (const key of Object.keys(dirtyFields)) {
          changes[key] = values[key]
        }
        if (Object.keys(changes).length === 0) {
          onDone()
          return
        }
        await updateDepartment({ id: department.id, changes: changes }).unwrap()
        toast.success('Department updated')
      } else {
        const created = await createDepartment(values).unwrap()
        toast.success('Department created', { description: created.name + ' can now be assigned to employees.' })
      }
      onDone()
    } catch (error) {
      const problem = normalizeError(error)
      const shown = applyFieldErrors(problem.fieldErrors, setError, ['name', 'description'])
      if (!shown) {
        setFormError(problem.message)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>Departments group employees by the part of the organisation they work in.</DialogDescription>
      </DialogHeader>
      <DialogBody className="flex flex-col gap-4">
        {formError ? <Alert variant="danger">{formError}</Alert> : null}
        <FormField id="department-name" label="Department name" error={errors.name && errors.name.message} required>
          <Input autoComplete="off" {...fieldA11y('department-name', errors.name)} {...register('name')} />
        </FormField>
        <FormField id="department-description" label="Description" error={errors.description && errors.description.message}>
          <Textarea rows={3} {...fieldA11y('department-description', errors.description)} {...register('description')} />
        </FormField>
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

// department: null → create; a department object → edit.
export function DepartmentFormDialog({ open, department, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open ? (
          <DepartmentForm
            key={department ? department.id : 'new'}
            department={department}
            onDone={() => onOpenChange(false)}
            onCancel={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
