import { KeyRoundIcon, MoreHorizontalIcon, PencilIcon, PlusIcon, PowerIcon } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { FilterSelect, ListToolbar, SearchBox } from '@/components/ListToolbar'
import { PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/Pagination'
import { EmptyState, ErrorState, LoadingRows } from '@/components/QueryState'
import { ResetPasswordDialog } from '@/components/ResetPasswordDialog'
import { ActiveBadge } from '@/components/StatusBadges'
import { UserAvatar } from '@/components/UserAvatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useSession } from '@/features/auth/useSession'
import { useListRolesQuery } from '@/features/roles/rolesApi'
import { useListParams } from '@/hooks/useListParams'
import { normalizeError } from '@/lib/apiError'
import { formatDate, formatDateTime, fullName } from '@/lib/format'
import { UserFormDialog } from './UserFormDialog'
import { useListUsersQuery, useResetUserPasswordMutation, useSetUserStatusMutation } from './usersApi'

const DEFAULTS = { search: '', role: '', status: '', sort: '-createdAt' }

// One row of the accounts table, with its "⋯" actions menu.
//   isSelf           this row is the logged-in user's own account
//   canUpdate        may edit accounts and reset passwords (users:update)
//   canChangeStatus  may activate / deactivate accounts (users:status)
//   onEdit, onResetPassword, onChangeStatus  open the matching dialog for this account
function UserRow({ account, isSelf, canUpdate, canChangeStatus, onEdit, onResetPassword, onChangeStatus }) {
  // Employee accounts are managed together with their employee record.
  const isEmployeeAccount = account.role && account.role.key === 'employee'

  let roleName = '—'
  let roleBadgeVariant = 'neutral'
  if (account.role) {
    roleName = account.role.name
    if (account.role.isSuperAdmin) {
      roleBadgeVariant = 'accent'
    }
  }

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <UserAvatar person={account} />
          <div className="min-w-0">
            <p className="font-medium">
              {fullName(account)}
              {isSelf ? <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span> : null}
            </p>
            <p className="text-xs text-muted-foreground">{account.email}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={roleBadgeVariant}>{roleName}</Badge>
      </TableCell>
      <TableCell>
        <ActiveBadge isActive={account.isActive} />
      </TableCell>
      <TableCell>
        {account.mustChangePassword ? <Badge variant="warning">Temporary</Badge> : <span className="text-muted-foreground">Set by user</span>}
      </TableCell>
      <TableCell className="text-muted-foreground">{account.lastLoginAt ? formatDateTime(account.lastLoginAt) : 'Never'}</TableCell>
      <TableCell className="text-muted-foreground">{formatDate(account.createdAt)}</TableCell>
      <TableCell className="text-right">
        {isEmployeeAccount ? (
          <Link to="/employees" className="text-xs text-accent hover:underline">
            Managed in Employees
          </Link>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={'Actions for ' + fullName(account)}>
                <MoreHorizontalIcon aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {canUpdate ? (
                <DropdownMenuItem onSelect={onEdit}>
                  <PencilIcon aria-hidden="true" />
                  Edit account
                </DropdownMenuItem>
              ) : null}
              {canUpdate && !isSelf ? (
                <DropdownMenuItem onSelect={onResetPassword}>
                  <KeyRoundIcon aria-hidden="true" />
                  Reset password
                </DropdownMenuItem>
              ) : null}
              {canChangeStatus && !isSelf ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem destructive={account.isActive} onSelect={onChangeStatus}>
                    <PowerIcon aria-hidden="true" />
                    {account.isActive ? 'Deactivate' : 'Activate'}
                  </DropdownMenuItem>
                </>
              ) : null}
              {isSelf ? (
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <KeyRoundIcon aria-hidden="true" />
                    Change my password
                  </Link>
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </TableCell>
    </TableRow>
  )
}

export default function UsersPage() {
  const { user: me, can } = useSession()
  const { params, setParam, clear } = useListParams(DEFAULTS)
  // Used as the search box key: "Clear filters" adds 1, which gives a fresh, empty box.
  const [searchResetCount, setSearchResetCount] = useState(0)
  const users = useListUsersQuery({ ...params, limit: 15 })
  const roles = useListRolesQuery({ limit: 100, sort: 'name' })
  const [setStatus, statusState] = useSetUserStatusMutation()
  const [resetPassword] = useResetUserPasswordMutation()

  const [formState, setFormState] = useState({ open: false, user: null })
  const [statusTarget, setStatusTarget] = useState(null)
  const [resetTarget, setResetTarget] = useState(null)

  const filtered = Boolean(params.search || params.role || params.status)

  // Choices for the Role filter: "All roles", then every role from the backend.
  const roleOptions = [{ value: '', label: 'All roles' }]
  if (roles.data) {
    for (const role of roles.data.items) {
      roleOptions.push({ value: role.key, label: role.name })
    }
  }

  // Title of the activate / deactivate confirmation dialog, e.g. "Deactivate Sara Lee?"
  let dialogTitle = ''
  if (statusTarget && statusTarget.isActive) {
    dialogTitle = 'Deactivate ' + fullName(statusTarget) + '?'
  } else if (statusTarget) {
    dialogTitle = 'Activate ' + fullName(statusTarget) + '?'
  }

  async function confirmStatus() {
    try {
      const updated = await setStatus({ id: statusTarget.id, isActive: !statusTarget.isActive }).unwrap()
      toast.success(updated.isActive ? 'Account activated' : 'Account deactivated')
      setStatusTarget(null)
    } catch (error) {
      toast.error('Status not changed', { description: normalizeError(error).message })
    }
  }

  async function submitReset(values) {
    await resetPassword({ id: resetTarget.id, ...values }).unwrap()
    toast.success('Password reset', { description: fullName(resetTarget) + ' must choose a new password at the next login.' })
    setResetTarget(null)
  }

  return (
    <>
      <PageHeader
        title="User Accounts"
        description="Login accounts for HR and administrators. Employee logins are managed with their employee record."
        actions={
          can('users:create') ? (
            <Button onClick={() => setFormState({ open: true, user: null })}>
              <PlusIcon aria-hidden="true" />
              New account
            </Button>
          ) : null
        }
      />
      <Card>
        <ListToolbar
          showClear={filtered}
          onClear={() => {
            clear(['search', 'role', 'status'])
            setSearchResetCount((count) => count + 1)
          }}
        >
          <SearchBox key={searchResetCount} value={params.search} onChange={(value) => setParam('search', value)} placeholder="Search name or email" label="Search accounts" />
          <FilterSelect id="user-role" label="Role" value={params.role} onChange={(value) => setParam('role', value)} options={roleOptions} />
          <FilterSelect
            id="user-status"
            label="Status"
            value={params.status}
            onChange={(value) => setParam('status', value)}
            options={[
              { value: '', label: 'All statuses' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
          <FilterSelect
            id="user-sort"
            label="Sort order"
            value={params.sort}
            onChange={(value) => setParam('sort', value)}
            options={[
              { value: '-createdAt', label: 'Newest first' },
              { value: 'createdAt', label: 'Oldest first' },
              { value: 'firstName', label: 'First name' },
              { value: 'lastName', label: 'Last name' },
              { value: '-lastLoginAt', label: 'Recent login' },
            ]}
            className="sm:ml-auto"
          />
        </ListToolbar>

        {users.isLoading ? <LoadingRows /> : null}
        {users.isError ? <ErrorState error={users.error} onRetry={users.refetch} /> : null}
        {users.data && users.data.items.length === 0 ? (
          <EmptyState filtered={filtered} title={filtered ? 'No matching accounts' : 'No accounts yet'} text={filtered ? 'Try a different search or clear the filters.' : undefined} />
        ) : null}
        {users.data && users.data.items.length > 0 ? (
          <div aria-busy={users.isFetching}>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Account</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Password</TableHead>
                  <TableHead>Last login</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className={users.isFetching ? 'opacity-60' : undefined}>
                {users.data.items.map((account) => (
                  <UserRow
                    key={account.id}
                    account={account}
                    isSelf={account.id === me.id}
                    canUpdate={can('users:update')}
                    canChangeStatus={can('users:status')}
                    onEdit={() => setFormState({ open: true, user: account })}
                    onResetPassword={() => setResetTarget(account)}
                    onChangeStatus={() => setStatusTarget(account)}
                  />
                ))}
              </TableBody>
            </Table>
            <Pagination meta={users.data.meta} onPageChange={(page) => setParam('page', page)} isFetching={users.isFetching} />
          </div>
        ) : null}
      </Card>

      <UserFormDialog
        open={formState.open}
        user={formState.user}
        isSelf={Boolean(formState.user && formState.user.id === me.id)}
        onOpenChange={(open) => !open && setFormState({ open: false, user: null })}
      />
      <ConfirmDialog
        open={Boolean(statusTarget)}
        onOpenChange={(open) => !open && setStatusTarget(null)}
        title={dialogTitle}
        description={
          statusTarget && statusTarget.isActive
            ? 'The account is blocked from logging in and all of its sessions end immediately.'
            : 'The account can log in again.'
        }
        confirmText={statusTarget && statusTarget.isActive ? 'Deactivate' : 'Activate'}
        destructive={Boolean(statusTarget && statusTarget.isActive)}
        isWorking={statusState.isLoading}
        onConfirm={confirmStatus}
      />
      <ResetPasswordDialog
        open={Boolean(resetTarget)}
        onOpenChange={(open) => !open && setResetTarget(null)}
        personName={resetTarget ? fullName(resetTarget) : ''}
        onSubmit={submitReset}
      />
    </>
  )
}
