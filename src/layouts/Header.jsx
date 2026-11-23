import { ChevronDownIcon, IdCardIcon, Loader2Icon, LogOutIcon, MenuIcon } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { BrandMark } from '@/components/BrandMark'
import { ThemeToggle } from '@/components/ThemeToggle'
import { UserAvatar } from '@/components/UserAvatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, SheetContent } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useLogoutMutation } from '@/features/auth/authApi'
import { useSession } from '@/features/auth/useSession'
import { normalizeError } from '@/lib/apiError'
import { fullName } from '@/lib/format'
import { SidebarAccount, SidebarNav } from './Sidebar'

function UserMenu() {
  const { user, can } = useSession()
  const navigate = useNavigate()
  const [logout, { isLoading }] = useLogoutMutation()

  // The session is cleared only after the backend confirms the logout.
  async function handleLogout(event) {
    event.preventDefault()
    try {
      await logout().unwrap()
    } catch (error) {
      toast.error('Could not log out', { description: normalizeError(error).message })
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-10 gap-2.5 px-2" aria-label={'Account menu for ' + fullName(user)}>
          <UserAvatar person={user} />
          <span className="hidden min-w-0 flex-col items-start text-left leading-tight sm:flex">
            <span className="max-w-40 truncate text-[13px] font-medium">{fullName(user)}</span>
            <span className="max-w-40 truncate text-xs font-normal text-muted-foreground">{user.role ? user.role.name : ''}</span>
          </span>
          <ChevronDownIcon className="hidden text-muted-foreground sm:block" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60">
        <DropdownMenuLabel className="font-normal">
          <span className="block truncate text-sm font-medium text-foreground">{fullName(user)}</span>
          <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {can('profile:view') ? (
          <DropdownMenuItem onSelect={() => navigate('/profile')}>
            <IdCardIcon aria-hidden="true" />
            My profile
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem onSelect={handleLogout} disabled={isLoading}>
          {isLoading ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : <LogOutIcon aria-hidden="true" />}
          {isLoading ? 'Logging out…' : 'Log out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function Header() {
  const { user } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-20 flex h-15 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur-sm sm:px-6">
      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open navigation menu">
          <MenuIcon aria-hidden="true" />
        </Button>
        <SheetContent title="Navigation">
          <div className="flex h-15 shrink-0 items-center border-b px-5">
            <BrandMark showDescription />
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-5">
            <SidebarNav onNavigate={() => setMenuOpen(false)} />
          </div>
          <div className="border-t p-3">
            <SidebarAccount />
          </div>
        </SheetContent>
      </Dialog>

      <div className="lg:hidden">
        <BrandMark />
      </div>

      <div className="hidden items-center gap-2 lg:flex">
        <Badge variant="outline">{user.role ? user.role.name : ''}</Badge>
        <span className="text-[13px] text-muted-foreground">{user.role && user.role.dataScope === 'all' ? 'Organisation-wide access' : 'Personal workspace'}</span>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  )
}
