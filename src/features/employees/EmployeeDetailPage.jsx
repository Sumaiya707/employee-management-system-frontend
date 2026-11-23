import { ArrowLeftIcon, KeyRoundIcon, PencilIcon, PowerIcon } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { DetailList } from '@/components/DetailList'
import { PageHeader } from '@/components/PageHeader'
import { ErrorState, LoadingBlock } from '@/components/QueryState'
import { ResetPasswordDialog } from '@/components/ResetPasswordDialog'
import { ActiveBadge, EmploymentStatusBadge } from '@/components/StatusBadges'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSession } from '@/features/auth/useSession'
import { normalizeError } from '@/lib/apiError'
import { EMPLOYMENT_TYPE_LABELS, GENDER_LABELS, assignmentName, formatDate, formatDateTime, fullName, labelFor } from '@/lib/format'
import { useGetEmployeeQuery, useResetEmployeePasswordMutation, useSetEmployeeStatusMutation } from './employeesApi'

function BackLink() {
  return (
    <Link to="/employees" className="mb-3 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground">
      <ArrowLeftIcon className="size-3.5" aria-hidden="true" />
      Employees
    </Link>
  )
}

export default function EmployeeDetailPage() {
  const { id } = useParams()
  const { can } = useSession()
  const employeeQuery = useGetEmployeeQuery(id)
  const [setStatus, statusState] = useSetEmployeeStatusMutation()
  const [resetPassword] = useResetEmployeePasswordMutation()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)

  // While loading, or if loading failed, show the page header with the back
  // link and, below it, the loading placeholder or the error message.
  if (employeeQuery.isLoading || employeeQuery.isError) {
    let stateContent
    if (employeeQuery.isLoading) {
      stateContent = <LoadingBlock />
    } else {
      stateContent = <ErrorState error={employeeQuery.error} onRetry={employeeQuery.refetch} />
    }

    return (
      <>
        <PageHeader title="Employee">
          <BackLink />
        </PageHeader>
        {stateContent}
      </>
    )
  }

  const employee = employeeQuery.data
  const account = employee.account
  const contact = employee.emergencyContact || {}
  const name = fullName(employee)

  // Texts for the activate / deactivate confirmation dialog.
  let dialogTitle = 'Activate ' + name + '?'
  let dialogDescription = 'The record and its login account are enabled again, so this person can log in.'
  let dialogButtonText = 'Activate'
  if (employee.isActive) {
    dialogTitle = 'Deactivate ' + name + '?'
    dialogDescription =
      'The record and its login account are disabled and any open sessions end immediately. The record is kept and can be activated again.'
    dialogButtonText = 'Deactivate'
  }

  async function toggleStatus() {
    try {
      const result = await setStatus({ id: employee.id, isActive: !employee.isActive }).unwrap()
      toast.success(result.isActive ? 'Employee activated' : 'Employee deactivated', {
        description: result.isActive ? name + ' can log in again.' : name + ' can no longer log in.',
      })
      setConfirmOpen(false)
    } catch (error) {
      toast.error('Status not changed', { description: normalizeError(error).message })
    }
  }

  async function submitReset(values) {
    await resetPassword({ id: employee.id, ...values }).unwrap()
    toast.success('Password reset', { description: name + ' must choose a new password at the next login.' })
    setResetOpen(false)
  }

  return (
    <>
      <PageHeader
        title={name}
        description={'#' + employee.employeeCode + ' · ' + employee.jobTitle}
        actions={
          <>
            {can('employees:password') ? (
              <Button variant="outline" onClick={() => setResetOpen(true)}>
                <KeyRoundIcon aria-hidden="true" />
                Reset password
              </Button>
            ) : null}
            {can('employees:deactivate') ? (
              <Button variant={employee.isActive ? 'destructive-outline' : 'outline'} onClick={() => setConfirmOpen(true)}>
                <PowerIcon aria-hidden="true" />
                {employee.isActive ? 'Deactivate' : 'Activate'}
              </Button>
            ) : null}
            {can('employees:update') ? (
              <Button asChild>
                <Link to={'/employees/' + employee.id + '/edit'}>
                  <PencilIcon aria-hidden="true" />
                  Edit
                </Link>
              </Button>
            ) : null}
          </>
        }
      >
        <BackLink />
      </PageHeader>

      <div className="mb-6 flex flex-wrap gap-2">
        <EmploymentStatusBadge status={employee.employmentStatus} />
        <ActiveBadge isActive={employee.isActive} activeText="Record active" inactiveText="Record inactive" />
        {account && account.mustChangePassword ? <Badge variant="warning">Password change pending</Badge> : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Employment</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailList
                items={[
                  { label: 'Employee ID', value: '#' + employee.employeeCode },
                  { label: 'Department', value: assignmentName(employee.department) },
                  { label: 'Designation', value: assignmentName(employee.designation) },
                  { label: 'Job title', value: employee.jobTitle },
                  { label: 'Employment type', value: labelFor(EMPLOYMENT_TYPE_LABELS, employee.employmentType) },
                  { label: 'Job status', value: <EmploymentStatusBadge status={employee.employmentStatus} /> },
                  { label: 'Joining date', value: formatDate(employee.joiningDate) },
                ]}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Personal and contact</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailList
                items={[
                  { label: 'Email', value: employee.email },
                  { label: 'Phone', value: employee.phone },
                  { label: 'Gender', value: labelFor(GENDER_LABELS, employee.gender) },
                  { label: 'Date of birth', value: employee.dateOfBirth ? formatDate(employee.dateOfBirth) : null },
                  { label: 'Address', value: employee.address, wide: true },
                  { label: 'Emergency contact', value: contact.name ? contact.name + (contact.relationship ? ' (' + contact.relationship + ')' : '') : null },
                  { label: 'Emergency phone', value: contact.phone },
                ]}
              />
            </CardContent>
          </Card>
        </div>
        <Card className="self-start">
          <CardHeader>
            <div>
              <CardTitle>Login account</CardTitle>
              <CardDescription>Created together with this record. Uses the employee email.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {account ? (
              <DetailList
                className="sm:grid-cols-1"
                items={[
                  { label: 'Login email', value: account.email },
                  { label: 'Login access', value: <ActiveBadge isActive={account.isActive} activeText="Enabled" inactiveText="Disabled" /> },
                  { label: 'Password', value: account.mustChangePassword ? 'Temporary: must be changed at next login' : 'Set by the employee' },
                  { label: 'Last login', value: account.lastLoginAt ? formatDateTime(account.lastLoginAt) : 'Never' },
                  { label: 'Record created', value: formatDateTime(employee.createdAt) },
                ]}
              />
            ) : (
              <p className="text-sm text-muted-foreground">No login account is linked.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={dialogTitle}
        description={dialogDescription}
        confirmText={dialogButtonText}
        destructive={employee.isActive}
        isWorking={statusState.isLoading}
        onConfirm={toggleStatus}
      />
      <ResetPasswordDialog open={resetOpen} onOpenChange={setResetOpen} personName={name} onSubmit={submitReset} />
    </>
  )
}
