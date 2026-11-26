// Create (POST /api/employees) or edit (PATCH /api/employees/:id) an employee.
// Creating also creates the linked Employee login account (rule E1): the
// account uses the employee email, gets the Employee role and must change the
// temporary password at first login.
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeftIcon, Loader2Icon } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { FormField, FormSection } from '@/components/FormField'
import { PageHeader } from '@/components/PageHeader'
import { PasswordInput } from '@/components/PasswordInput'
import { ErrorState, LoadingBlock } from '@/components/QueryState'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Input, NativeSelect, Textarea } from '@/components/ui/input'
import { useListDepartmentsQuery } from '@/features/departments/departmentsApi'
import { useListDesignationsQuery } from '@/features/designations/designationsApi'
import { applyFieldErrors, normalizeError } from '@/lib/apiError'
import { EMPLOYMENT_TYPE_LABELS, GENDER_LABELS, STATUS_CHOICE_LABELS, fullName, toDateInput } from '@/lib/format'
import { errorAt, fieldA11y } from '@/lib/form'
import {
  PASSWORD_HINT,
  addressField,
  emailField,
  emergencyContactField,
  nameField,
  optionalPastDate,
  requiredDate,
  requiredPhone,
  strongPassword,
} from '@/lib/validation'
import { useCreateEmployeeMutation, useGetEmployeeQuery, useUpdateEmployeeMutation } from './employeesApi'

function choice(labels, message) {
  return z.string().refine((value) => Object.keys(labels).includes(value), message)
}

// Edit form rules (same rules as the backend's employee.validators.js).
const editSchema = z.object({
  firstName: nameField('First name'),
  lastName: nameField('Last name'),
  email: emailField,
  gender: choice(GENDER_LABELS, 'Select a gender'),
  phone: requiredPhone,
  // Department is optional: '' means "not assigned" (sent to the backend as null).
  department: z.string(),
  // Designation is required: it is the employee's position. '' (nothing chosen)
  // shows the message below and the form is not sent.
  designation: z.string().min(1, 'Select a designation'),
  employmentType: choice(EMPLOYMENT_TYPE_LABELS, 'Select an employment type'),
  // Only Active, Resigned or Terminated ("On leave" is shown automatically).
  employmentStatus: choice(STATUS_CHOICE_LABELS, 'Select a job status'),
  joiningDate: requiredDate('Joining date'),
  address: addressField,
  dateOfBirth: optionalPastDate,
  emergencyContact: emergencyContactField,
})

// Create form rules: all edit rules, plus two fields that exist only when
// creating (Employee ID, temporary password). Login access is not a separate
// field: it follows the job status.
const createSchema = editSchema.extend({
  employeeCode: z
    .string()
    .trim()
    .regex(/^[0-9]{1,20}$/, 'Employee ID may contain only digits (at most 20)'),
  password: strongPassword,
})

const EMPTY = {
  employeeCode: '',
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  gender: '',
  phone: '',
  department: '',
  designation: '',
  employmentType: '',
  employmentStatus: 'active',
  joiningDate: '',
  address: '',
  dateOfBirth: '',
  emergencyContact: { name: '', phone: '', relationship: '' },
}

// The stored job status as a dropdown value. An old stored "on_leave" (from
// before "On leave" became automatic) is shown as "active", the only matching choice.
function statusChoiceFrom(employmentStatus) {
  if (employmentStatus === 'resigned' || employmentStatus === 'terminated') {
    return employmentStatus
  }
  return 'active'
}

function valuesFrom(employee) {
  const contact = employee.emergencyContact || {}
  let departmentId = ''
  if (employee.department) {
    departmentId = employee.department.id
  }
  let designationId = ''
  if (employee.designation) {
    designationId = employee.designation.id
  }
  return {
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    gender: employee.gender || '',
    phone: employee.phone || '',
    department: departmentId,
    designation: designationId,
    employmentType: employee.employmentType || '',
    employmentStatus: statusChoiceFrom(employee.employmentStatus),
    joiningDate: toDateInput(employee.joiningDate),
    address: employee.address || '',
    dateOfBirth: toDateInput(employee.dateOfBirth),
    emergencyContact: { name: contact.name || '', phone: contact.phone || '', relationship: contact.relationship || '' },
  }
}

const FORM_FIELDS = Object.keys(EMPTY)

// The hint under the job status dropdown.
const STATUS_HINT = 'Resigned or Terminated blocks login. On leave is shown automatically from approved leave.'

function OptionList({ labels, placeholder }) {
  return (
    <>
      {placeholder ? <option value="">{placeholder}</option> : null}
      {Object.entries(labels).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </>
  )
}

// The choices of the department or designation dropdown:
//   listQuery  the result of useListDepartmentsQuery / useListDesignationsQuery (active ones only)
//   current    the employee's current department or designation (null when creating)
// The current one is always kept in the list, even if it became inactive,
// so the edit form still shows what the employee has now.
function assignmentOptions(listQuery, current) {
  const options = []
  let currentIsListed = false
  if (listQuery.data) {
    for (const item of listQuery.data.items) {
      options.push({ id: item.id, name: item.name })
      if (current && item.id === current.id) {
        currentIsListed = true
      }
    }
  }
  if (current && !currentIsListed) {
    let name = current.name
    if (!current.isActive) {
      name = name + ' (inactive)'
    }
    options.push({ id: current.id, name: name })
  }
  return options
}

// The first, empty choice of a department or designation dropdown.
function emptyChoiceText(listQuery, loadingText, noneText) {
  if (listQuery.isLoading) {
    return loadingText
  }
  return noneText
}

// The hint under a department or designation dropdown, if something needs explaining.
function assignmentHint(listQuery, options, failedText, emptyText) {
  if (listQuery.isError) {
    return failedText
  }
  if (listQuery.data && options.length === 0) {
    return emptyText
  }
  return undefined
}

function EmployeeForm({ employee }) {
  const isEdit = Boolean(employee)
  const navigate = useNavigate()
  // Only active departments and designations can be newly assigned.
  const departments = useListDepartmentsQuery({ status: 'active', limit: 100, sort: 'name' })
  const designations = useListDesignationsQuery({ status: 'active', limit: 100, sort: 'name' })
  const [createEmployee] = useCreateEmployeeMutation()
  const [updateEmployee] = useUpdateEmployeeMutation()
  const [formError, setFormError] = useState(null)

  // Everything that differs between creating and editing.
  let schema = createSchema
  let startValues = EMPTY
  let identityText = 'The Employee ID is permanent and is never reused.'
  let emailHint = 'Also the login email'
  let cancelLink = '/employees'
  let submitText = 'Create employee'
  if (isEdit) {
    schema = editSchema
    startValues = valuesFrom(employee)
    identityText = 'The Employee ID never changes.'
    emailHint = 'Also changes the login email'
    cancelLink = '/employees/' + employee.id
    submitText = 'Save changes'
  }

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, dirtyFields, isSubmitting, isDirty },
  } = useForm({ resolver: zodResolver(schema), defaultValues: startValues })

  // The error message of each field (undefined while the field is valid).
  const errorText = {
    employeeCode: errorAt(errors, 'employeeCode'),
    firstName: errorAt(errors, 'firstName'),
    lastName: errorAt(errors, 'lastName'),
    gender: errorAt(errors, 'gender'),
    dateOfBirth: errorAt(errors, 'dateOfBirth'),
    department: errorAt(errors, 'department'),
    designation: errorAt(errors, 'designation'),
    joiningDate: errorAt(errors, 'joiningDate'),
    employmentType: errorAt(errors, 'employmentType'),
    employmentStatus: errorAt(errors, 'employmentStatus'),
    email: errorAt(errors, 'email'),
    phone: errorAt(errors, 'phone'),
    address: errorAt(errors, 'address'),
    contactName: errorAt(errors, 'emergencyContact.name'),
    contactRelationship: errorAt(errors, 'emergencyContact.relationship'),
    contactPhone: errorAt(errors, 'emergencyContact.phone'),
    password: errorAt(errors, 'password'),
  }

  let currentDepartment = null
  let currentDesignation = null
  if (isEdit) {
    currentDepartment = employee.department
    currentDesignation = employee.designation
  }
  const departmentOptions = assignmentOptions(departments, currentDepartment)
  const designationOptions = assignmentOptions(designations, currentDesignation)
  const departmentHint = assignmentHint(departments, departmentOptions, 'Departments could not be loaded.', 'No active departments yet.')
  const designationHint = assignmentHint(designations, designationOptions, 'Designations could not be loaded.', 'No active designations yet.')

  async function onSubmit(values) {
    setFormError(null)
    try {
      if (isEdit) {
        // PATCH accepts only changed fields; an empty date of birth clears it.
        const changes = {}
        for (const key of Object.keys(dirtyFields)) {
          changes[key] = values[key]
        }
        if ('dateOfBirth' in changes && changes.dateOfBirth === '') changes.dateOfBirth = null
        // An empty department choice removes it (null). The designation can never
        // be empty here: the form rules above require one.
        if ('department' in changes && changes.department === '') changes.department = null
        if (Object.keys(changes).length === 0) {
          navigate('/employees/' + employee.id)
          return
        }
        await updateEmployee({ id: employee.id, changes: changes }).unwrap()
        toast.success('Employee updated')
        navigate('/employees/' + employee.id)
      } else {
        const body = { ...values }
        if (body.dateOfBirth === '') delete body.dateOfBirth
        if (body.department === '') body.department = null
        const created = await createEmployee(body).unwrap()
        toast.success('Employee created', { description: 'Login account ' + created.email + ' must change the temporary password at first login.' })
        navigate('/employees/' + created.id)
      }
    } catch (error) {
      const problem = normalizeError(error)
      const shown = applyFieldErrors(problem.fieldErrors, setError, FORM_FIELDS)
      setFormError(shown ? 'Please correct the highlighted fields.' : problem.message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Card>
        <CardContent className="flex flex-col gap-8 p-5 sm:p-6">
          {formError ? <Alert variant="danger">{formError}</Alert> : null}

          <FormSection title="Identity" description={identityText}>
            {isEdit ? (
              <FormField id="employeeCode" label="Employee ID" error={errorText.employeeCode}>
                <Input id="employeeCode" value={'#' + employee.employeeCode} disabled readOnly />
              </FormField>
            ) : (
              <FormField id="employeeCode" label="Employee ID" error={errorText.employeeCode} hint="Digits only, e.g. 0042" required>
                <Input inputMode="numeric" {...fieldA11y('employeeCode', errorText.employeeCode, 'Digits only, e.g. 0042')} {...register('employeeCode')} />
              </FormField>
            )}
            <div className="hidden sm:block" />
            <FormField id="firstName" label="First name" error={errorText.firstName} required>
              <Input autoComplete="off" {...fieldA11y('firstName', errorText.firstName)} {...register('firstName')} />
            </FormField>
            <FormField id="lastName" label="Last name" error={errorText.lastName} required>
              <Input autoComplete="off" {...fieldA11y('lastName', errorText.lastName)} {...register('lastName')} />
            </FormField>
            <FormField id="gender" label="Gender" error={errorText.gender} required>
              <NativeSelect {...fieldA11y('gender', errorText.gender)} {...register('gender')}>
                <OptionList labels={GENDER_LABELS} placeholder="Select…" />
              </NativeSelect>
            </FormField>
            <FormField id="dateOfBirth" label="Date of birth" error={errorText.dateOfBirth}>
              <Input type="date" {...fieldA11y('dateOfBirth', errorText.dateOfBirth)} {...register('dateOfBirth')} />
            </FormField>
          </FormSection>

          <FormSection title="Employment">
            <FormField id="department" label="Department" error={errorText.department} hint={departmentHint}>
              <NativeSelect {...fieldA11y('department', errorText.department, departmentHint)} {...register('department')}>
                <option value="">{emptyChoiceText(departments, 'Loading departments…', 'No department')}</option>
                {departmentOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField id="designation" label="Designation" error={errorText.designation} hint={designationHint} required>
              <NativeSelect {...fieldA11y('designation', errorText.designation, designationHint)} {...register('designation')}>
                <option value="">{emptyChoiceText(designations, 'Loading designations…', 'Select a designation…')}</option>
                {designationOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField id="joiningDate" label="Joining date" error={errorText.joiningDate} required>
              <Input type="date" {...fieldA11y('joiningDate', errorText.joiningDate)} {...register('joiningDate')} />
            </FormField>
            <FormField id="employmentType" label="Employment type" error={errorText.employmentType} required>
              <NativeSelect {...fieldA11y('employmentType', errorText.employmentType)} {...register('employmentType')}>
                <OptionList labels={EMPLOYMENT_TYPE_LABELS} placeholder="Select…" />
              </NativeSelect>
            </FormField>
            {/* The job status decides login access: Resigned or Terminated blocks it. */}
            <FormField id="employmentStatus" label="Job status" error={errorText.employmentStatus} hint={STATUS_HINT} required>
              <NativeSelect {...fieldA11y('employmentStatus', errorText.employmentStatus, STATUS_HINT)} {...register('employmentStatus')}>
                <OptionList labels={STATUS_CHOICE_LABELS} />
              </NativeSelect>
            </FormField>
          </FormSection>

          <FormSection title="Contact">
            <FormField id="email" label="Email" error={errorText.email} hint={emailHint} required>
              <Input type="email" autoComplete="off" {...fieldA11y('email', errorText.email, emailHint)} {...register('email')} />
            </FormField>
            <FormField id="phone" label="Phone" error={errorText.phone} required>
              <Input type="tel" {...fieldA11y('phone', errorText.phone)} {...register('phone')} />
            </FormField>
            <FormField id="address" label="Address" error={errorText.address} className="sm:col-span-2">
              <Textarea rows={2} {...fieldA11y('address', errorText.address)} {...register('address')} />
            </FormField>
            <FormField id="ec-name" label="Emergency contact name" error={errorText.contactName}>
              <Input {...fieldA11y('ec-name', errorText.contactName)} {...register('emergencyContact.name')} />
            </FormField>
            <FormField id="ec-relationship" label="Relationship" error={errorText.contactRelationship}>
              <Input {...fieldA11y('ec-relationship', errorText.contactRelationship)} {...register('emergencyContact.relationship')} />
            </FormField>
            <FormField id="ec-phone" label="Emergency contact phone" error={errorText.contactPhone}>
              <Input type="tel" {...fieldA11y('ec-phone', errorText.contactPhone)} {...register('emergencyContact.phone')} />
            </FormField>
          </FormSection>

          {!isEdit ? (
            <FormSection title="Login account" description="The employee logs in with the email above and must replace this temporary password at first login.">
              <FormField id="password" label="Temporary password" error={errorText.password} hint={PASSWORD_HINT} required>
                <PasswordInput autoComplete="new-password" {...fieldA11y('password', errorText.password, PASSWORD_HINT)} {...register('password')} />
              </FormField>
            </FormSection>
          ) : null}
        </CardContent>
        <CardFooter className="justify-end">
          <Button asChild variant="outline">
            <Link to={cancelLink}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting || (isEdit && !isDirty)}>
            {isSubmitting ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : null}
            {submitText}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}

export default function EmployeeFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const employeeQuery = useGetEmployeeQuery(id, { skip: !isEdit })

  // The back link differs between creating and editing.
  let backTo = '/employees'
  let backText = 'Employees'
  if (isEdit) {
    backTo = '/employees/' + id
    backText = 'Back to employee'
  }
  const back = (
    <Link to={backTo} className="mb-3 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground">
      <ArrowLeftIcon className="size-3.5" aria-hidden="true" />
      {backText}
    </Link>
  )

  // Editing: while the employee loads, or if loading failed, show the page
  // title and back link with the loading placeholder or the error message.
  if (isEdit && (employeeQuery.isLoading || employeeQuery.isError)) {
    let stateContent
    if (employeeQuery.isLoading) {
      stateContent = <LoadingBlock />
    } else {
      stateContent = <ErrorState error={employeeQuery.error} onRetry={employeeQuery.refetch} />
    }
    return (
      <>
        <PageHeader title="Edit employee">{back}</PageHeader>
        {stateContent}
      </>
    )
  }

  // Creating: an empty form. Editing: the form filled with the loaded employee.
  if (!isEdit) {
    return (
      <>
        <PageHeader title="New employee" description="Creates the employee record and its login account together.">
          {back}
        </PageHeader>
        <EmployeeForm key="new" employee={null} />
      </>
    )
  }

  const employee = employeeQuery.data
  return (
    <>
      <PageHeader title={'Edit ' + fullName(employee)} description="Changes to name and email are copied to the login account.">
        {back}
      </PageHeader>
      <EmployeeForm key={employee.id} employee={employee} />
    </>
  )
}
