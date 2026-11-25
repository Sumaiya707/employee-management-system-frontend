// Route protection. Hiding a sidebar link is never the only protection: every
// page route is wrapped here, and the backend checks every request again.
import { Loader2Icon, RefreshCwIcon, WifiOffIcon } from 'lucide-react'
import { Suspense } from 'react'
import { useDispatch } from 'react-redux'
import { Navigate, Outlet, useLocation } from 'react-router'
import { BrandMark } from '@/components/BrandMark'
import { Button } from '@/components/ui/button'
import { homePathFor } from '@/config/navigation'
import { useGetMeQuery } from '@/features/auth/authApi'
import { retrySessionCheck } from '@/features/auth/authSlice'
import { useSession } from '@/features/auth/useSession'
import { ForbiddenPage } from '@/pages/StatusPages'

function FullPageMessage({ children }) {
  return <div className="flex min-h-svh flex-col items-center justify-center gap-5 bg-background px-4 text-center">{children}</div>
}

// Root of every route: restores the session with GET /api/auth/me once, and
// re-checks it when the window gets focus again (picks up permission changes).
export function SessionGate() {
  const dispatch = useDispatch()
  const { status } = useSession()
  const me = useGetMeQuery(undefined, { skip: status === 'guest', refetchOnFocus: true })

  if (status === 'checking') {
    return (
      <FullPageMessage>
        <BrandMark />
        <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
          Checking your session…
        </p>
      </FullPageMessage>
    )
  }

  if (status === 'unreachable') {
    return (
      <FullPageMessage>
        <BrandMark />
        <div role="alert" className="max-w-sm">
          <WifiOffIcon className="mx-auto mb-3 size-6 text-muted-foreground" aria-hidden="true" />
          <p className="font-medium">The server cannot be reached</p>
          <p className="mt-1 text-sm text-muted-foreground">PeopleDesk could not contact the server. Check your connection, or try again in a moment.</p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            dispatch(retrySessionCheck())
            me.refetch()
          }}
        >
          <RefreshCwIcon aria-hidden="true" />
          Try again
        </Button>
      </FullPageMessage>
    )
  }

  return (
    <Suspense
      fallback={
        <FullPageMessage>
          <Loader2Icon className="size-5 animate-spin text-muted-foreground" aria-label="Loading" />
        </FullPageMessage>
      }
    >
      <Outlet />
    </Suspense>
  )
}

// Only for logged-in users. While mustChangePassword is true, only the
// change-password page is available (the backend enforces the same rule P1).
export function RequireAuth() {
  const { status, user } = useSession()
  const location = useLocation()

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  if (user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />
  }
  return <Outlet />
}

// Login page: a logged-in user goes straight to the app.
export function GuestOnly({ children }) {
  const { status, user } = useSession()
  const location = useLocation()
  if (status === 'authenticated') {
    if (user.mustChangePassword) {
      return <Navigate to="/change-password" replace />
    }
    const from = location.state && location.state.from
    return <Navigate to={from && from !== '/login' ? from : homePathFor(user)} replace />
  }
  return children
}

// A page that needs one backend permission.
export function RequirePermission({ permission, children }) {
  const { can } = useSession()
  if (!can(permission)) {
    return <ForbiddenPage />
  }
  return children
}

// A page only the Super Admin may open (the Leave Setup pages). The backend
// checks the same rule (middlewares/requireSuperAdmin.js).
export function RequireSuperAdmin({ children }) {
  const { isSuperAdmin } = useSession()
  if (!isSuperAdmin) {
    return <ForbiddenPage />
  }
  return children
}

export function HomeRedirect() {
  const { user } = useSession()
  return <Navigate to={homePathFor(user)} replace />
}
