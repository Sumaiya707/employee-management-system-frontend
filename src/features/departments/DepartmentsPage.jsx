// Departments list (GET /api/departments). Everyone with departments:view sees
// the list; only departments:manage shows the add, edit and status buttons.
import { PencilIcon, PlusIcon, PowerIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/ListToolbar'
import { PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/Pagination'
import { EmptyState, ErrorState, LoadingRows } from '@/components/QueryState'
import { ActiveBadge } from '@/components/StatusBadges'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useSession } from '@/features/auth/useSession'
import { useListParams } from '@/hooks/useListParams'
import { normalizeError } from '@/lib/apiError'
import { DepartmentFormDialog } from './DepartmentFormDialog'
import { useListDepartmentsQuery, useSetDepartmentStatusMutation } from './departmentsApi'

const DEFAULTS = { search: '', status: '', sort: 'name' }

export default function DepartmentsPage() {
  const { can } = useSession()
  const canManage = can('departments:manage')
  const { params, setParam, clear } = useListParams(DEFAULTS)
  // Used as the search box key: "Clear filters" adds 1, which gives a fresh, empty box.
  const [searchResetCount, setSearchResetCount] = useState(0)
  const departments = useListDepartmentsQuery({ ...params, limit: 15 })
  const [setStatus, statusState] = useSetDepartmentStatusMutation()

  const [formState, setFormState] = useState({ open: false, department: null })
  const [statusTarget, setStatusTarget] = useState(null)

  const filtered = Boolean(params.search || params.status)

  function clearFilters() {
    clear(['search', 'status'])
    setSearchResetCount((count) => count + 1)
  }

  // Texts of the activate / deactivate confirmation dialog.
  let dialogTitle = ''
  let dialogDescription = ''
  let dialogButtonText = ''
  if (statusTarget && statusTarget.isActive) {
    dialogTitle = 'Deactivate ' + statusTarget.name + '?'
    dialogDescription = 'Employees who already have this department keep it, but it can no longer be given to other employees.'
    dialogButtonText = 'Deactivate'
  } else if (statusTarget) {
    dialogTitle = 'Activate ' + statusTarget.name + '?'
    dialogDescription = 'The department can be assigned to employees again.'
    dialogButtonText = 'Activate'
  }

  async function confirmStatus() {
    try {
      const updated = await setStatus({ id: statusTarget.id, isActive: !statusTarget.isActive }).unwrap()
      if (updated.isActive) {
        toast.success('Department activated')
      } else {
        toast.success('Department deactivated')
      }
      setStatusTarget(null)
    } catch (error) {
      toast.error('Status not changed', { description: normalizeError(error).message })
    }
  }

  let addButton = null
  if (canManage) {
    addButton = (
      <Button onClick={() => setFormState({ open: true, department: null })}>
        <PlusIcon aria-hidden="true" />
        Add Department
      </Button>
    )
  }

  return (
    <>
      <PageHeader title="Departments" description="The parts of the organisation that employees belong to." actions={addButton} />
      <Card>
        <ListToolbar showClear={filtered} onClear={clearFilters}>
          <SearchBox key={searchResetCount} value={params.search} onChange={(value) => setParam('search', value)} placeholder="Search departments" label="Search departments" />
          <FilterSelect
            id="department-status"
            label="Status"
            value={params.status}
            onChange={(value) => setParam('status', value)}
            options={[
              { value: '', label: 'All statuses' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
        </ListToolbar>

        {departments.isLoading ? <LoadingRows /> : null}
        {departments.isError ? <ErrorState error={departments.error} onRetry={departments.refetch} /> : null}
        {departments.data && departments.data.items.length === 0 && filtered ? (
          <EmptyState filtered title="No matching departments" text="Try a different search or clear the filters." />
        ) : null}
        {departments.data && departments.data.items.length === 0 && !filtered ? (
          <EmptyState title="No departments yet" text={canManage ? 'Add the first department, then assign employees to it.' : 'Departments will appear here.'} />
        ) : null}
        {departments.data && departments.data.items.length > 0 ? (
          <div aria-busy={departments.isFetching}>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Department</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead>Status</TableHead>
                  {canManage ? (
                    <TableHead>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody className={departments.isFetching ? 'opacity-60' : undefined}>
                {departments.data.items.map((department) => (
                  <TableRow key={department.id}>
                    <TableCell className="font-medium">{department.name}</TableCell>
                    <TableCell className="max-w-sm text-muted-foreground">{department.description || '—'}</TableCell>
                    <TableCell className="tabular-nums">{department.employeeCount}</TableCell>
                    <TableCell>
                      <ActiveBadge isActive={department.isActive} />
                    </TableCell>
                    {canManage ? (
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setFormState({ open: true, department: department })}>
                            <PencilIcon aria-hidden="true" />
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setStatusTarget(department)}>
                            <PowerIcon aria-hidden="true" />
                            {department.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination meta={departments.data.meta} onPageChange={(page) => setParam('page', page)} isFetching={departments.isFetching} />
          </div>
        ) : null}
      </Card>

      <DepartmentFormDialog
        open={formState.open}
        department={formState.department}
        onOpenChange={(open) => {
          if (!open) {
            setFormState({ open: false, department: null })
          }
        }}
      />
      <ConfirmDialog
        open={Boolean(statusTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setStatusTarget(null)
          }
        }}
        title={dialogTitle}
        description={dialogDescription}
        confirmText={dialogButtonText}
        destructive={Boolean(statusTarget && statusTarget.isActive)}
        isWorking={statusState.isLoading}
        onConfirm={confirmStatus}
      />
    </>
  )
}
