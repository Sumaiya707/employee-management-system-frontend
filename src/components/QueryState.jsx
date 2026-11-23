import { CircleAlertIcon, InboxIcon, LockIcon, RefreshCwIcon, SearchXIcon, WifiOffIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { normalizeError } from '@/lib/apiError'
import { cn } from '@/lib/utils'

export function LoadingRows({ rows = 5, className }) {
  return (
    <div className={cn('space-y-3 p-5', className)} role="status" aria-live="polite">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-9 w-full" />
      ))}
    </div>
  )
}

export function LoadingBlock({ className }) {
  return (
    <div className={cn('grid gap-4', className)} role="status" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-64" />
    </div>
  )
}

function StateBox({ icon: Icon, title, text, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {text ? <p className="mt-1 max-w-sm text-[13px] text-muted-foreground">{text}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export function EmptyState({ title = 'Nothing here yet', text, action, filtered = false, className }) {
  return <StateBox icon={filtered ? SearchXIcon : InboxIcon} title={title} text={text} action={action} className={className} />
}

// Shows a failed request in plain words, with "Try again" where it helps.
export function ErrorState({ error, onRetry, className }) {
  const problem = normalizeError(error)
  let icon = CircleAlertIcon
  let title = 'This could not be loaded'
  if (problem.status === 'network' || problem.status === 502 || problem.status === 504) {
    icon = WifiOffIcon
    title = 'The server could not be reached'
  } else if (problem.status === 403) {
    icon = LockIcon
    title = 'You do not have access to this'
  } else if (problem.status === 404) {
    icon = SearchXIcon
    title = 'Not found'
  }
  const canRetry = onRetry && problem.status !== 403 && problem.status !== 404
  return (
    <div role="alert">
      <StateBox
        icon={icon}
        title={title}
        text={problem.message}
        className={className}
        action={
          canRetry ? (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCwIcon aria-hidden="true" />
              Try again
            </Button>
          ) : null
        }
      />
    </div>
  )
}
