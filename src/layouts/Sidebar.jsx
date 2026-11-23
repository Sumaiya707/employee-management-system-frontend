import { NavLink } from 'react-router'
import { BrandMark } from '@/components/BrandMark'
import { UserAvatar } from '@/components/UserAvatar'
import { visibleNavigation } from '@/config/navigation'
import { useSession } from '@/features/auth/useSession'
import { fullName } from '@/lib/format'
import { cn } from '@/lib/utils'

// Navigation built from the user's backend permissions (src/config/navigation.js).
export function SidebarNav({ onNavigate }) {
  const { user, scope } = useSession()
  const sections = visibleNavigation(user, scope)
  return (
    <nav aria-label="Main" className="flex flex-col gap-6">
      {sections.map((section) => (
        <div key={section.title}>
          <p className="mb-1.5 px-3 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{section.title}</p>
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex h-9 items-center gap-3 rounded-md px-3 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                      isActive ? 'bg-accent-soft font-medium text-accent-soft-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive ? <span aria-hidden="true" className="absolute top-2 bottom-2 left-0 w-0.5 rounded-full bg-accent" /> : null}
                      <item.icon className="size-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{item.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}

export function SidebarAccount() {
  const { user } = useSession()
  return (
    <div className="flex items-center gap-3 rounded-md border bg-card px-3 py-2.5">
      <UserAvatar person={user} />
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium">{fullName(user)}</p>
        <p className="truncate text-xs text-muted-foreground">{user.role ? user.role.name : ''}</p>
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r bg-sidebar lg:flex">
      <div className="flex h-15 shrink-0 items-center border-b px-5">
        <BrandMark showDescription />
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-5">
        <SidebarNav />
      </div>
      <div className="border-t p-3">
        <SidebarAccount />
      </div>
    </aside>
  )
}
