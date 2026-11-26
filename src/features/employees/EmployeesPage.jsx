import { ChevronRightIcon, PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/ListToolbar'
import { PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/Pagination'
import { EmptyState, ErrorState, LoadingRows } from '@/components/QueryState'
import { EmploymentStatusBadge } from '@/components/StatusBadges'
import { UserAvatar } from '@/components/UserAvatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useSession } from '@/features/auth/useSession'
import { useListDepartmentsQuery } from '@/features/departments/departmentsApi'
import { useListParams } from '@/hooks/useListParams'
import { STATUS_CHOICE_LABELS, EMPLOYMENT_TYPE_LABELS, formatDate, fullName, labelFor } from '@/lib/format'
import { useListEmployeesQuery } from './employeesApi'

const DEFAULTS = { search: '', employmentStatus: '', departmentId: '', sort: 'employeeCode' }

const SORT_OPTIONS = [
  { value: 'employeeCode', label: 'Sort: Employee ID' },
  { value: 'firstName', label: 'Sort: First name' },
  { value: 'lastName', label: 'Sort: Last name' },
  { value: '-joiningDate', label: 'Sort: Newest joiners' },
  { value: 'joiningDate', label: 'Sort: Earliest joiners' },
]

export default function EmployeesPage() {
  const { can } = useSession()
  const navigate = useNavigate()
  const { params, setParam, clear } = useListParams(DEFAULTS)
  // Used as the search box key: "Clear filters" adds 1, which gives a fresh, empty box.
  const [searchResetCount, setSearchResetCount] = useState(0)
  const employees = useListEmployeesQuery({ ...params, limit: 10 })
  // The Department filter is shown only to users who may see departments.
  const canViewDepartments = can('departments:view')
  const departments = useListDepartmentsQuery({ limit: 100, sort: 'name' }, { skip: !canViewDepartments })

  const filtered = Boolean(params.search || params.employmentStatus || params.departmentId)

  // Choices for the Department filter: "All departments", then every department.
  const departmentOptions = [{ value: '', label: 'All departments' }]
  if (departments.data) {
    for (const department of departments.data.items) {
      departmentOptions.push({ value: department.id, label: department.name })
    }
  }

  function clearFilters() {
    clear(['search', 'employmentStatus', 'departmentId'])
    setSearchResetCount((count) => count + 1)
  }

  return (
    <>
      <PageHeader
        title="Employees"
        description="Employee records and their linked login accounts."
        actions={
          can('employees:create') ? (
            <Button asChild>
              <Link to="/employees/new">
                <PlusIcon aria-hidden="true" />
                New employee
              </Link>
            </Button>
          ) : null
        }
      />
      <Card>
        <ListToolbar onClear={clearFilters} showClear={filtered}>
          <SearchBox key={searchResetCount} value={params.search} onChange={(value) => setParam('search', value)} placeholder="Search ID, name or email" label="Search employees" />
          <FilterSelect
            id="filter-employment"
            label="Employment status"
            value={params.employmentStatus}
            onChange={(value) => setParam('employmentStatus', value)}
            options={[{ value: '', label: 'Any job status' }, ...Object.entries(STATUS_CHOICE_LABELS).map(([value, label]) => ({ value, label }))]}
          />
          {canViewDepartments ? (
            <FilterSelect
              id="filter-department"
              label="Department"
              value={params.departmentId}
              onChange={(value) => setParam('departmentId', value)}
              options={departmentOptions}
            />
          ) : null}
          <FilterSelect id="sort" label="Sort order" value={params.sort} onChange={(value) => setParam('sort', value)} options={SORT_OPTIONS} className="sm:ml-auto" />
        </ListToolbar>

        {employees.isLoading ? <LoadingRows /> : null}
        {employees.isError ? <ErrorState error={employees.error} onRetry={employees.refetch} /> : null}
        {employees.data && employees.data.items.length === 0 ? (
          filtered ? (
            <EmptyState filtered title="No matching employees" text="Try a different search or clear the filters." />
          ) : (
            <EmptyState
              title="No employees yet"
              text={can('employees:create') ? 'Create the first employee record and its login account.' : 'Employee records will appear here.'}
              action={
                can('employees:create') ? (
                  <Button asChild size="sm">
                    <Link to="/employees/new">New employee</Link>
                  </Button>
                ) : null
              }
            />
          )
        ) : null}
        {employees.data && employees.data.items.length > 0 ? (
          <div aria-busy={employees.isFetching}>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Job status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>
                    <span className="sr-only">Open</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className={employees.isFetching ? 'opacity-60' : undefined}>
                {employees.data.items.map((employee) => (
                  <TableRow key={employee.id} className="cursor-pointer" onClick={() => navigate('/employees/' + employee.id)}>
                    <TableCell className="font-medium tabular-nums">#{employee.employeeCode}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <UserAvatar person={employee} />
                        <div className="min-w-0">
                          <Link
                            to={'/employees/' + employee.id}
                            onClick={(event) => event.stopPropagation()}
                            className="font-medium hover:underline focus-visible:underline focus-visible:outline-none"
                          >
                            {fullName(employee)}
                          </Link>
                          <p className="text-xs text-muted-foreground">{employee.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{employee.department ? employee.department.name : '—'}</TableCell>
                    {/* The position: the designation name ("—" for an older record without one). */}
                    <TableCell>{employee.designation ? employee.designation.name : '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{labelFor(EMPLOYMENT_TYPE_LABELS, employee.employmentType)}</TableCell>
                    <TableCell>
                      {/* currentStatus shows "On leave" automatically during approved leave. */}
                      <EmploymentStatusBadge status={employee.currentStatus} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(employee.joiningDate)}</TableCell>
                    <TableCell className="text-right">
                      <ChevronRightIcon className="ml-auto size-4 text-muted-foreground" aria-hidden="true" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination meta={employees.data.meta} onPageChange={(page) => setParam('page', page)} isFetching={employees.isFetching} />
          </div>
        ) : null}
      </Card>
    </>
  )
}
