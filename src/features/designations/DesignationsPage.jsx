// Designations list (GET /api/designations). Everyone with designations:view sees
// the list; only designations:manage shows the add, edit and status buttons.
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
import { DesignationFormDialog } from './DesignationFormDialog'
import { useListDesignationsQuery, useSetDesignationStatusMutation } from './designationsApi'

const DEFAULTS = { search: '', status: '', sort: 'name' }

export default function DesignationsPage() {
  const { can } = useSession()
  const canManage = can('designations:manage')
  const { params, setParam, clear } = useListParams(DEFAULTS)
  // Used as the search box key: "Clear filters" adds 1, which gives a fresh, empty box.
  const [searchResetCount, setSearchResetCount] = useState(0)
  const designations = useListDesignationsQuery({ ...params, limit: 15 })
  const [setStatus, statusState] = useSetDesignationStatusMutation()

  const [formState, setFormState] = useState({ open: false, designation: null })
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
    dialogDescription = 'Employees who already have this designation keep it, but it can no longer be given to other employees.'
    dialogButtonText = 'Deactivate'
  } else if (statusTarget) {
    dialogTitle = 'Activate ' + statusTarget.name + '?'
    dialogDescription = 'The designation can be assigned to employees again.'
    dialogButtonText = 'Activate'
  }

  async function confirmStatus() {
    try {
      const updated = await setStatus({ id: statusTarget.id, isActive: !statusTarget.isActive }).unwrap()
      if (updated.isActive) {
        toast.success('Designation activated')
      } else {
        toast.success('Designation deactivated')
      }
      setStatusTarget(null)
    } catch (error) {
      toast.error('Status not changed', { description: normalizeError(error).message })
    }
  }

  let addButton = null
  if (canManage) {
    addButton = (
      <Button onClick={() => setFormState({ open: true, designation: null })}>
        <PlusIcon aria-hidden="true" />
        Add Designation
      </Button>
    )
  }

  return (
    <>
      <PageHeader title="Designations" description="Official job positions that can be given to employees in any department." actions={addButton} />
      <Card>
        <ListToolbar showClear={filtered} onClear={clearFilters}>
          <SearchBox key={searchResetCount} value={params.search} onChange={(value) => setParam('search', value)} placeholder="Search designations" label="Search designations" />
          <FilterSelect
            id="designation-status"
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

        {designations.isLoading ? <LoadingRows /> : null}
        {designations.isError ? <ErrorState error={designations.error} onRetry={designations.refetch} /> : null}
        {designations.data && designations.data.items.length === 0 && filtered ? (
          <EmptyState filtered title="No matching designations" text="Try a different search or clear the filters." />
        ) : null}
        {designations.data && designations.data.items.length === 0 && !filtered ? (
          <EmptyState title="No designations yet" text={canManage ? 'Add the first designation, then assign employees to it.' : 'Designations will appear here.'} />
        ) : null}
        {designations.data && designations.data.items.length > 0 ? (
          <div aria-busy={designations.isFetching}>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Designation</TableHead>
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
              <TableBody className={designations.isFetching ? 'opacity-60' : undefined}>
                {designations.data.items.map((designation) => (
                  <TableRow key={designation.id}>
                    <TableCell className="font-medium">{designation.name}</TableCell>
                    <TableCell className="max-w-sm text-muted-foreground">{designation.description || '—'}</TableCell>
                    <TableCell className="tabular-nums">{designation.employeeCount}</TableCell>
                    <TableCell>
                      <ActiveBadge isActive={designation.isActive} />
                    </TableCell>
                    {canManage ? (
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setFormState({ open: true, designation: designation })}>
                            <PencilIcon aria-hidden="true" />
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setStatusTarget(designation)}>
                            <PowerIcon aria-hidden="true" />
                            {designation.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination meta={designations.data.meta} onPageChange={(page) => setParam('page', page)} isFetching={designations.isFetching} />
          </div>
        ) : null}
      </Card>

      <DesignationFormDialog
        open={formState.open}
        designation={formState.designation}
        onOpenChange={(open) => {
          if (!open) {
            setFormState({ open: false, designation: null })
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
