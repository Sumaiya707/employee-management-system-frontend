// Dashboard building blocks: number cards, the card grid, titled section
// boxes and the small "View all" link used in section headers.
import { ArrowRightIcon } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function StatCard({ label, value, hint, icon: Icon, to }) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] text-muted-foreground">{label}</p>
        {Icon ? (
          <span className="flex size-8 items-center justify-center rounded-md border text-muted-foreground">
            <Icon className="size-4" aria-hidden="true" />
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-[26px] leading-none font-semibold tracking-tight tabular-nums">{value}</p>
      {hint ? <p className="mt-2 text-xs text-muted-foreground">{hint}</p> : null}
    </>
  )
  if (to) {
    return (
      <Link to={to} className="block rounded-lg border bg-card p-5 transition-colors hover:border-input hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
        {body}
      </Link>
    )
  }
  return <Card className="p-5">{body}</Card>
}

export function StatGrid({ children, className }) {
  return <div className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-4', className)}>{children}</div>
}

export function SectionCard({ title, description, action, children, className, contentClassName }) {
  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        {action}
      </CardHeader>
      <CardContent className={cn('flex-1', contentClassName)}>{children}</CardContent>
    </Card>
  )
}

export function ViewAllLink({ to, children = 'View all' }) {
  return (
    <Button asChild variant="ghost" size="sm" className="-mr-2 text-muted-foreground">
      <Link to={to}>
        {children}
        <ArrowRightIcon aria-hidden="true" />
      </Link>
    </Button>
  )
}
