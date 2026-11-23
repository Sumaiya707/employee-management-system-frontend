// Create (POST /api/designations) or edit (PATCH /api/designations/:id) a designation.
// A new designation is always active; the list page activates/deactivates it.
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
import { useCreateDesignationMutation, useUpdateDesignationMutation } from './designationsApi'

// The same rules as the backend's designation.validators.js.
const schema = z.object({
  name: z.string().trim().min(2, 'Designation name must be at least 2 characters').max(100, 'Designation name must be at most 100 characters'),
  description: z.string().trim().max(300, 'Description must be at most 300 characters'),
})

function DesignationForm({ designation, onDone, onCancel }) {
  const isEdit = Boolean(designation)
  const [createDesignation] = useCreateDesignationMutation()
  const [updateDesignation] = useUpdateDesignationMutation()
  const [formError, setFormError] = useState(null)

  let startValues = { name: '', description: '' }
  let title = 'New designation'
  let submitText = 'Create designation'
  if (isEdit) {
    startValues = { name: designation.name, description: designation.description || '' }
    title = 'Edit ' + designation.name
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
        await updateDesignation({ id: designation.id, changes: changes }).unwrap()
        toast.success('Designation updated')
      } else {
        const created = await createDesignation(values).unwrap()
        toast.success('Designation created', { description: created.name + ' can now be assigned to employees.' })
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
        <DialogDescription>Designations are official job positions. They can be used in any department.</DialogDescription>
      </DialogHeader>
      <DialogBody className="flex flex-col gap-4">
        {formError ? <Alert variant="danger">{formError}</Alert> : null}
        <FormField id="designation-name" label="Designation name" error={errors.name && errors.name.message} required>
          <Input autoComplete="off" {...fieldA11y('designation-name', errors.name)} {...register('name')} />
        </FormField>
        <FormField id="designation-description" label="Description" error={errors.description && errors.description.message}>
          <Textarea rows={3} {...fieldA11y('designation-description', errors.description)} {...register('description')} />
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

// designation: null → create; a designation object → edit.
export function DesignationFormDialog({ open, designation, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open ? (
          <DesignationForm
            key={designation ? designation.id : 'new'}
            designation={designation}
            onDone={() => onOpenChange(false)}
            onCancel={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
