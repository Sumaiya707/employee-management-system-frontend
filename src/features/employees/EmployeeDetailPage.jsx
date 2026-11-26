import { ArrowLeftIcon, KeyRoundIcon, PencilIcon } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { toast } from 'sonner'
import { DetailList } from '@/components/DetailList'
import { PageHeader } from '@/components/PageHeader'
import { ErrorState, LoadingBlock } from '@/components/QueryState'
import { ResetPasswordDialog } from '@/components/ResetPasswordDialog'
import { ActiveBadge, EmploymentStatusBadge } from '@/components/StatusBadges'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSession } from '@/features/auth/useSession'
import { LeaveBalanceTable } from '@/features/leave/LeaveBalanceTable'
import { EMPLOYMENT_TYPE_LABELS, GENDER_LABELS, assignmentName, formatDate, formatDateTime, fullName, labelFor } from '@/lib/format'
import { useGetEmployeeQuery, useResetEmployeePasswordMutation } from './employeesApi'

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
  const { can, scope } = useSession()
  const employeeQuery = useGetEmployeeQuery(id)
  const [resetPassword] = useResetEmployeePasswordMutation()
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
  // The header line under the name: "#01 · Software Engineer" (the designation is
  // the position). An older record without a designation shows only "#01".
  let headerText = '#' + employee.employeeCode
  if (employee.designation) {
    headerText = headerText + ' · ' + employee.designation.name
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
        description={headerText}
        actions={
          <>
            {can('employees:password') ? (
              <Button variant="outline" onClick={() => setResetOpen(true)}>
                <KeyRoundIcon aria-hidden="true" />
                Reset password
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

      {/* currentStatus: Active, On leave (approved leave today), Resigned or Terminated.
          Login access is changed only through the job status on the Edit page. */}
      <div className="mb-6 flex flex-wrap gap-2">
        <EmploymentStatusBadge status={employee.currentStatus} />
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
                  { label: 'Employment type', value: labelFor(EMPLOYMENT_TYPE_LABELS, employee.employmentType) },
                  { label: 'Job status', value: <EmploymentStatusBadge status={employee.currentStatus} /> },
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
          {/* The employee's leave balance, for users who can see everyone's leave (HR, Super Admin). */}
          {can('leave:view') && scope === 'all' ? <LeaveBalanceTable employeeId={employee.id} /> : null}
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
                  // Read only: it follows the job status (Resigned or Terminated blocks login).
                  { label: 'Login access', value: <ActiveBadge isActive={account.isActive} activeText="Allowed" inactiveText="Blocked" /> },
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

      <ResetPasswordDialog open={resetOpen} onOpenChange={setResetOpen} personName={name} onSubmit={submitReset} />
    </>
  )
}
