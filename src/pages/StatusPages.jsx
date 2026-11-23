import { CompassIcon, LockIcon } from 'lucide-react'
import { Link } from 'react-router'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

function StatusCard({ icon: Icon, title, text, action }) {
  return (
    <Card className="mx-auto mt-6 flex max-w-lg flex-col items-center px-6 py-12 text-center">
      <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <h1 className="text-lg font-semibold">{title}</h1>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{text}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </Card>
  )
}

export function ForbiddenPage() {
  return (
    <>
      <PageHeader title="Access denied" />
      <StatusCard
        icon={LockIcon}
        title="You do not have access to this page"
        text="Your role does not include the permission this page needs. If you think this is a mistake, contact your administrator."
        action={
          <Button asChild variant="outline">
            <Link to="/">Go to your start page</Link>
          </Button>
        }
      />
    </>
  )
}

export function NotFoundPage() {
  return (
    <>
      <PageHeader title="Page not found" />
      <StatusCard
        icon={CompassIcon}
        title="This page does not exist"
        text="The address may be mistyped, or the page may have moved."
        action={
          <Button asChild variant="outline">
            <Link to="/">Go to your start page</Link>
          </Button>
        }
      />
    </>
  )
}

// A logged-in user whose role has none of the pages' permissions.
export function NoAccessPage() {
  return (
    <>
      <PageHeader title="No pages available" />
      <StatusCard
        icon={LockIcon}
        title="Your account has no pages assigned yet"
        text="You are logged in, but your role does not include any page permissions. Contact your administrator."
      />
    </>
  )
}
