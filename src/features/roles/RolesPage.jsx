import { ChevronRightIcon, PlusIcon, PowerIcon } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
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
import { useListRolesQuery, useSetRoleStatusMutation } from './rolesApi'
import { RoleTypeBadge } from './RoleTypeBadge'

const DEFAULTS = { search: '', status: '', sort: 'name' }

export default function RolesPage() {
  const { can } = useSession()
  const navigate = useNavigate()
  const { params, setParam, clear } = useListParams(DEFAULTS)
  // Used as the search box key: "Clear filters" adds 1, which gives a fresh, empty box.
  const [searchResetCount, setSearchResetCount] = useState(0)
  const roles = useListRolesQuery({ ...params, limit: 20 })
  const [setStatus, statusState] = useSetRoleStatusMutation()
  const [statusTarget, setStatusTarget] = useState(null)
  const filtered = Boolean(params.search || params.status)

  // Title of the confirmation dialog, e.g. "Deactivate Senior HR?"
  let dialogTitle = ''
  if (statusTarget && statusTarget.isActive) {
    dialogTitle = 'Deactivate ' + statusTarget.name + '?'
  } else if (statusTarget) {
    dialogTitle = 'Activate ' + statusTarget.name + '?'
  }

  async function confirmStatus() {
    try {
      const result = await setStatus({ id: statusTarget.id, isActive: !statusTarget.isActive }).unwrap()
      toast.success(result.message, result.data && result.data.affectedUsers ? { description: result.data.affectedUsers + ' user(s) affected.' } : undefined)
      setStatusTarget(null)
    } catch (error) {
      toast.error('Status not changed', { description: normalizeError(error).message })
    }
  }

  return (
    <>
      <PageHeader
        title="Roles & Permissions"
        description="What each role may do. Changes apply on each affected user's next request."
        actions={
          can('roles:manage') ? (
            <Button asChild>
              <Link to="/roles/new">
                <PlusIcon aria-hidden="true" />
                New role
              </Link>
            </Button>
          ) : null
        }
      />
      <Card>
        <ListToolbar
          showClear={filtered}
          onClear={() => {
            clear(['search', 'status'])
            setSearchResetCount((count) => count + 1)
          }}
        >
          <SearchBox key={searchResetCount} value={params.search} onChange={(value) => setParam('search', value)} placeholder="Search role name" label="Search roles" />
          <FilterSelect
            id="role-status"
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

        {roles.isLoading ? <LoadingRows /> : null}
        {roles.isError ? <ErrorState error={roles.error} onRetry={roles.refetch} /> : null}
        {roles.data && roles.data.items.length === 0 ? <EmptyState filtered={filtered} title="No matching roles" /> : null}
        {roles.data && roles.data.items.length > 0 ? (
          <div aria-busy={roles.isFetching}>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Role</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Data scope</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className={roles.isFetching ? 'opacity-60' : undefined}>
                {roles.data.items.map((role) => (
                  <TableRow key={role.id} className="cursor-pointer" onClick={() => navigate('/roles/' + role.id)}>
                    <TableCell className="max-w-72 whitespace-normal">
                      <Link to={'/roles/' + role.id} onClick={(event) => event.stopPropagation()} className="font-medium hover:underline">
                        {role.name}
                      </Link>
                      {role.description ? <p className="text-xs text-muted-foreground">{role.description}</p> : null}
                    </TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{role.key}</code>
                    </TableCell>
                    <TableCell>
                      <RoleTypeBadge role={role} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{role.dataScope === 'all' ? 'Organisation' : 'Own records'}</TableCell>
                    <TableCell className="tabular-nums">{role.isSuperAdmin ? 'All' : role.permissions.length}</TableCell>
                    <TableCell className="tabular-nums">{role.userCount}</TableCell>
                    <TableCell>
                      <ActiveBadge isActive={role.isActive} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {can('roles:manage') && !role.isSystem ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(event) => {
                              event.stopPropagation()
                              setStatusTarget(role)
                            }}
                          >
                            <PowerIcon aria-hidden="true" />
                            {role.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        ) : null}
                        <ChevronRightIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination meta={roles.data.meta} onPageChange={(page) => setParam('page', page)} isFetching={roles.isFetching} />
          </div>
        ) : null}
      </Card>

      <ConfirmDialog
        open={Boolean(statusTarget)}
        onOpenChange={(open) => !open && setStatusTarget(null)}
        title={dialogTitle}
        description={
          statusTarget && statusTarget.isActive
            ? 'Users with this role (' + statusTarget.userCount + ') are logged out on their next request and cannot log in. The role can no longer be assigned.'
            : 'Users with this role can log in again, and the role can be assigned.'
        }
        confirmText={statusTarget && statusTarget.isActive ? 'Deactivate' : 'Activate'}
        destructive={Boolean(statusTarget && statusTarget.isActive)}
        isWorking={statusState.isLoading}
        onConfirm={confirmStatus}
      />
    </>
  )
}
