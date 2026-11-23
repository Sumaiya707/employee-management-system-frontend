import { CircleAlertIcon, RefreshCwIcon } from 'lucide-react'
import { BrandMark } from '@/components/BrandMark'
import { Button } from '@/components/ui/button'

// Shown if a page crashes or its code cannot be loaded (for example after a
// new version was deployed). No technical details are shown to the user.
export function RouteErrorPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-5 bg-background px-4 text-center">
      <BrandMark />
      <div role="alert" className="max-w-sm">
        <CircleAlertIcon className="mx-auto mb-3 size-6 text-danger" aria-hidden="true" />
        <p className="font-medium">Something went wrong</p>
        <p className="mt-1 text-sm text-muted-foreground">This page could not be displayed. Reload the page to try again.</p>
      </div>
      <Button variant="outline" onClick={() => window.location.reload()}>
        <RefreshCwIcon aria-hidden="true" />
        Reload page
      </Button>
    </div>
  )
}
