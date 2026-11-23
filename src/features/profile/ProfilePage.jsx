import { DetailList } from '@/components/DetailList'
import { PageHeader } from '@/components/PageHeader'
import { ErrorState, LoadingBlock } from '@/components/QueryState'
import { ActiveBadge, EmploymentStatusBadge } from '@/components/StatusBadges'
import { UserAvatar } from '@/components/UserAvatar'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChangePasswordForm } from '@/features/auth/ChangePasswordForm'
import { useSession } from '@/features/auth/useSession'
import { EMPLOYMENT_TYPE_LABELS, GENDER_LABELS, formatDate, formatDateTime, fullName, labelFor } from '@/lib/format'
import { ContactForm } from './ContactForm'
import { useGetProfileQuery } from './profileApi'

export default function ProfilePage() {
  const { can } = useSession()
  const profile = useGetProfileQuery()

  // While loading, or if loading failed, show the page title and, below it,
  // the loading placeholder or the error message.
  if (profile.isLoading || profile.isError) {
    let stateContent
    if (profile.isLoading) {
      stateContent = <LoadingBlock />
    } else {
      stateContent = <ErrorState error={profile.error} onRetry={profile.refetch} />
    }

    return (
      <>
        <PageHeader title="My Profile" />
        {stateContent}
      </>
    )
  }

  const { account, employee } = profile.data
  const contact = employee ? employee.emergencyContact || {} : {}

  return (
    <>
      <PageHeader title="My Profile" description="Your account and the employee information held about you." />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <Card>
            <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <UserAvatar person={account} className="size-14 text-lg" />
              <div className="min-w-0 flex-1">
                <p className="text-lg font-semibold">{fullName(account)}</p>
                <p className="truncate text-sm text-muted-foreground">{account.email}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="accent">{account.role ? account.role.name : ''}</Badge>
                  {employee ? <EmploymentStatusBadge status={employee.employmentStatus} /> : null}
                </div>
              </div>
            </CardContent>
          </Card>

          {employee ? (
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Employment details</CardTitle>
                  <CardDescription>Managed by HR. Contact HR if something is wrong.</CardDescription>
                </div>
                <ActiveBadge isActive={employee.isActive} activeText="Record active" inactiveText="Record inactive" />
              </CardHeader>
              <CardContent>
                <DetailList
                  items={[
                    { label: 'Employee ID', value: '#' + employee.employeeCode },
                    { label: 'Department', value: employee.department ? employee.department.name : null },
                    { label: 'Designation', value: employee.designation ? employee.designation.name : null },
                    { label: 'Job title', value: employee.jobTitle },
                    { label: 'Employment type', value: labelFor(EMPLOYMENT_TYPE_LABELS, employee.employmentType) },
                    { label: 'Joining date', value: formatDate(employee.joiningDate) },
                    { label: 'Gender', value: labelFor(GENDER_LABELS, employee.gender) },
                    { label: 'Date of birth', value: employee.dateOfBirth ? formatDate(employee.dateOfBirth) : null },
                  ]}
                />
              </CardContent>
            </Card>
          ) : (
            <Alert variant="neutral">Your account is not linked to an employee record, so there are no employment or contact details to show.</Alert>
          )}

          {employee ? (
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Contact details</CardTitle>
                  <CardDescription>{can('profile:update') ? 'You can update these yourself.' : 'Your contact information on file.'}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {can('profile:update') ? (
                  <ContactForm employee={employee} />
                ) : (
                  <DetailList
                    items={[
                      { label: 'Phone', value: employee.phone },
                      { label: 'Address', value: employee.address, wide: true },
                      { label: 'Emergency contact', value: [contact.name, contact.relationship, contact.phone].filter(Boolean).join(' · ') },
                    ]}
                  />
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailList
                className="sm:grid-cols-1"
                items={[
                  { label: 'Login email', value: account.email },
                  { label: 'Role', value: account.role ? account.role.name : null },
                  { label: 'Last login', value: formatDateTime(account.lastLoginAt) },
                  { label: 'Account created', value: formatDate(account.createdAt) },
                ]}
              />
            </CardContent>
          </Card>
          {can('profile:update') ? (
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Change password</CardTitle>
                  <CardDescription>Your other signed-in sessions will be logged out.</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <ChangePasswordForm />
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  )
}
