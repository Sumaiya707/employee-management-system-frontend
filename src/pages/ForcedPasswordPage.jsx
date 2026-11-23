import { KeyRoundIcon, Loader2Icon } from 'lucide-react'
import { useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { BrandMark } from '@/components/BrandMark'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { pageTitle } from '@/config/brand'
import { homePathFor } from '@/config/navigation'
import { useLogoutMutation } from '@/features/auth/authApi'
import { ChangePasswordForm } from '@/features/auth/ChangePasswordForm'
import { useSession } from '@/features/auth/useSession'
import { normalizeError } from '@/lib/apiError'

// Shown while the backend reports mustChangePassword: true (rule P1).
// Nothing else in the app opens until the password has been changed.
export default function ForcedPasswordPage() {
  const { user } = useSession()
  const navigate = useNavigate()
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation()

  useEffect(() => {
    document.title = pageTitle('Set a new password')
  }, [])

  if (!user.mustChangePassword) {
    return <Navigate to={homePathFor(user)} replace />
  }

  async function handleLogout() {
    try {
      await logout().unwrap()
    } catch (error) {
      toast.error('Could not log out', { description: normalizeError(error).message })
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex h-15 items-center justify-between border-b px-4 sm:px-6">
        <BrandMark />
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-start justify-center px-4 py-10 sm:items-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 sm:p-8">
            <div className="mb-6">
              <div className="mb-4 flex size-10 items-center justify-center rounded-full bg-accent-soft text-accent-soft-foreground">
                <KeyRoundIcon className="size-5" aria-hidden="true" />
              </div>
              <h1 className="text-xl font-semibold tracking-tight">Set a new password</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Your password was set by an administrator. Choose your own password to continue, {user.firstName}.
              </p>
            </div>
            <ChangePasswordForm submitText="Save new password" onDone={() => navigate(homePathFor(user), { replace: true })} />
            <div className="mt-6 border-t pt-4 text-sm text-muted-foreground">
              Not you?{' '}
              <Button variant="link" onClick={handleLogout} disabled={isLoggingOut}>
                {isLoggingOut ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : null}
                Log out
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
