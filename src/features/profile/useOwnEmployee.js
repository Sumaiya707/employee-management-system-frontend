import { useSession } from '@/features/auth/useSession'
import { useGetProfileQuery } from './profileApi'

// The logged-in user's own employee record (or null), from GET /api/profile.
// Clocking in and requesting leave need an employee record, which HR and
// Super Admin accounts do not have, so self-service actions use this check
// instead of guessing from the role name.
export function useOwnEmployee() {
  const { can } = useSession()
  const allowed = can('profile:view')
  const profile = useGetProfileQuery(undefined, { skip: !allowed })
  return {
    employee: profile.data ? profile.data.employee : null,
    isLoading: allowed && profile.isLoading,
    known: !allowed || profile.isSuccess,
  }
}
