import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2Icon } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { FormField } from '@/components/FormField'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { applyFieldErrors, normalizeError } from '@/lib/apiError'
import { errorAt, fieldA11y } from '@/lib/form'
import { addressField, emergencyContactField, requiredPhone } from '@/lib/validation'
import { useUpdateProfileMutation } from './profileApi'

// Same fields and rules as the backend's updateProfileSchema.
const contactSchema = z.object({
  phone: requiredPhone,
  address: addressField,
  emergencyContact: emergencyContactField,
})

function contactDefaults(employee) {
  const contact = employee.emergencyContact || {}
  return {
    phone: employee.phone || '',
    address: employee.address || '',
    emergencyContact: { name: contact.name || '', phone: contact.phone || '', relationship: contact.relationship || '' },
  }
}

// PATCH /api/profile: own phone, address and emergency contact. Only changed
// fields are sent; everything else on the record is managed by HR.
export function ContactForm({ employee }) {
  const [updateProfile, { isLoading }] = useUpdateProfileMutation()
  const [formError, setFormError] = useState(null)
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, dirtyFields, isDirty },
  } = useForm({ resolver: zodResolver(contactSchema), defaultValues: contactDefaults(employee) })

  async function onSubmit(values) {
    setFormError(null)
    const changes = {}
    if (dirtyFields.phone) changes.phone = values.phone
    if (dirtyFields.address) changes.address = values.address
    if (dirtyFields.emergencyContact) changes.emergencyContact = values.emergencyContact
    try {
      const result = await updateProfile(changes).unwrap()
      reset(contactDefaults(result.data.employee))
      toast.success('Contact details saved')
    } catch (error) {
      const problem = normalizeError(error)
      const shown = applyFieldErrors(problem.fieldErrors, setError, ['phone', 'address', 'emergencyContact'])
      if (!shown) setFormError(problem.message)
    }
  }

  const fieldError = (path) => errorAt(errors, path)

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {formError ? <Alert variant="danger">{formError}</Alert> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="phone" label="Phone" error={fieldError('phone')} required>
          <Input type="tel" autoComplete="tel" {...fieldA11y('phone', fieldError('phone'))} {...register('phone')} />
        </FormField>
        <FormField id="address" label="Address" error={fieldError('address')} className="sm:col-span-2">
          <Textarea rows={2} autoComplete="street-address" {...fieldA11y('address', fieldError('address'))} {...register('address')} />
        </FormField>
      </div>
      <fieldset className="grid gap-4 rounded-md border p-4 sm:grid-cols-3">
        <legend className="px-1 text-[13px] font-medium">Emergency contact</legend>
        <FormField id="ec-name" label="Name" error={fieldError('emergencyContact.name')}>
          <Input {...fieldA11y('ec-name', fieldError('emergencyContact.name'))} {...register('emergencyContact.name')} />
        </FormField>
        <FormField id="ec-phone" label="Phone" error={fieldError('emergencyContact.phone')}>
          <Input type="tel" {...fieldA11y('ec-phone', fieldError('emergencyContact.phone'))} {...register('emergencyContact.phone')} />
        </FormField>
        <FormField id="ec-relationship" label="Relationship" error={fieldError('emergencyContact.relationship')}>
          <Input {...fieldA11y('ec-relationship', fieldError('emergencyContact.relationship'))} {...register('emergencyContact.relationship')} />
        </FormField>
      </fieldset>
      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isLoading || !isDirty}>
          {isLoading ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : null}
          {isLoading ? 'Saving…' : 'Save changes'}
        </Button>
        {isDirty ? (
          <Button variant="ghost" onClick={() => reset()} disabled={isLoading}>
            Discard
          </Button>
        ) : null}
      </div>
    </form>
  )
}
