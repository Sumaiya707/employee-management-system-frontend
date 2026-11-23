import { useSelector } from 'react-redux'
import { dataScope, hasPermission } from '@/lib/permissions'
import { selectAuth } from './authSlice'

// The current session plus permission helpers, for any component.
export function useSession() {
  const auth = useSelector(selectAuth)
  const user = auth.user
  return {
    status: auth.status,
    user: user,
    notice: auth.notice,
    can: (key) => hasPermission(user, key),
    scope: dataScope(user),
    isSuperAdmin: Boolean(user && user.role && user.role.isSuperAdmin),
  }
}
