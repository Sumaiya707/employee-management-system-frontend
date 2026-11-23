import { initials } from '@/lib/format'
import { cn } from '@/lib/utils'

// Initials only: the backend stores no profile pictures.
export function UserAvatar({ person, className }) {
  return (
    <span
      aria-hidden="true"
      className={cn('flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent-soft-foreground', className)}
    >
      {initials(person)}
    </span>
  )
}
