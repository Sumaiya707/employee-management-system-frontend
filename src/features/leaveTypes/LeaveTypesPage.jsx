// Leave types list (GET /api/leave-types). Only the Super Admin can open this
// page (RequireSuperAdmin in src/routes/router.jsx), so every action is shown.
import { PencilIcon, PlusIcon, PowerIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/ListToolbar'
import { PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/Pagination'
import { EmptyState, ErrorState, LoadingRows } from '@/components/QueryState'
import { ActiveBadge } from '@/components/StatusBadges'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useListParams } from '@/hooks/useListParams'
import { normalizeError } from '@/lib/apiError'
import { allowanceText, paidText } from '@/lib/format'
import { LeaveTypeFormDialog } from './LeaveTypeFormDialog'
import { useListLeaveTypesQuery, useSetLeaveTypeStatusMutation } from './leaveTypesApi'

const DEFAULTS = { search: '', status: '', sort: 'name' }

export default function LeaveTypesPage() {
  const { params, setParam, clear } = useListParams(DEFAULTS)
  // Used as the search box key: "Clear filters" adds 1, which gives a fresh, empty box.
  const [searchResetCount, setSearchResetCount] = useState(0)
  const leaveTypes = useListLeaveTypesQuery({ ...params, limit: 15 })
  const [setStatus, statusState] = useSetLeaveTypeStatusMutation()

  const [formState, setFormState] = useState({ open: false, leaveType: null })
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
    dialogDescription = 'Employees can no longer choose it for new requests. Existing requests keep it.'
    dialogButtonText = 'Deactivate'
  } else if (statusTarget) {
    dialogTitle = 'Activate ' + statusTarget.name + '?'
    dialogDescription = 'Employees can choose it for new leave requests again.'
    dialogButtonText = 'Activate'
  }

  async function confirmStatus() {
    try {
      const updated = await setStatus({ id: statusTarget.id, isActive: !statusTarget.isActive }).unwrap()
      if (updated.isActive) {
        toast.success('Leave type activated')
      } else {
        toast.success('Leave type deactivated')
      }
      setStatusTarget(null)
    } catch (error) {
      toast.error('Status not changed', { description: normalizeError(error).message })
    }
  }

  const addButton = (
    <Button onClick={() => setFormState({ open: true, leaveType: null })}>
      <PlusIcon aria-hidden="true" />
      Add Leave Type
    </Button>
  )

  return (
    <>
      <PageHeader title="Leave Types" description="The kinds of leave employees can request, with their payment type and allowance." actions={addButton} />
      <Card>
        <ListToolbar showClear={filtered} onClear={clearFilters}>
          <SearchBox key={searchResetCount} value={params.search} onChange={(value) => setParam('search', value)} placeholder="Search leave types" label="Search leave types" />
          <FilterSelect
            id="leave-type-status"
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

        {leaveTypes.isLoading ? <LoadingRows /> : null}
        {leaveTypes.isError ? <ErrorState error={leaveTypes.error} onRetry={leaveTypes.refetch} /> : null}
        {leaveTypes.data && leaveTypes.data.items.length === 0 && filtered ? (
          <EmptyState filtered title="No matching leave types" text="Try a different search or clear the filters." />
        ) : null}
        {leaveTypes.data && leaveTypes.data.items.length === 0 && !filtered ? (
          <EmptyState title="No leave types yet" text="Add the leave types your company offers. Employees can request leave only after that." />
        ) : null}
        {leaveTypes.data && leaveTypes.data.items.length > 0 ? (
          <div aria-busy={leaveTypes.isFetching}>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Leave type</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Allowance</TableHead>
                  <TableHead>Requests</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className={leaveTypes.isFetching ? 'opacity-60' : undefined}>
                {leaveTypes.data.items.map((leaveType) => (
                  <TableRow key={leaveType.id}>
                    <TableCell>
                      <p className="font-medium">{leaveType.name}</p>
                      {leaveType.description ? <p className="max-w-xs truncate text-xs text-muted-foreground">{leaveType.description}</p> : null}
                    </TableCell>
                    <TableCell>
                      <Badge variant={leaveType.isPaid ? 'success' : 'neutral'}>{paidText(leaveType.isPaid)}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{allowanceText(leaveType)}</TableCell>
                    <TableCell className="tabular-nums">{leaveType.requestCount}</TableCell>
                    <TableCell>
                      <ActiveBadge isActive={leaveType.isActive} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setFormState({ open: true, leaveType: leaveType })}>
                          <PencilIcon aria-hidden="true" />
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setStatusTarget(leaveType)}>
                          <PowerIcon aria-hidden="true" />
                          {leaveType.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination meta={leaveTypes.data.meta} onPageChange={(page) => setParam('page', page)} isFetching={leaveTypes.isFetching} />
          </div>
        ) : null}
      </Card>

      <LeaveTypeFormDialog
        open={formState.open}
        leaveType={formState.leaveType}
        onOpenChange={(open) => {
          if (!open) {
            setFormState({ open: false, leaveType: null })
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
