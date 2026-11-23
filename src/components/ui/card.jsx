import { cn } from '@/lib/utils'

export function Card({ className, ...props }) {
  return <div data-slot="card" className={cn('rounded-lg border bg-card text-card-foreground', className)} {...props} />
}

export function CardHeader({ className, ...props }) {
  return <div data-slot="card-header" className={cn('flex flex-wrap items-start justify-between gap-3 px-5 pt-5', className)} {...props} />
}

export function CardTitle({ className, as: Heading = 'h2', ...props }) {
  return <Heading data-slot="card-title" className={cn('text-[15px] font-semibold leading-tight', className)} {...props} />
}

export function CardDescription({ className, ...props }) {
  return <p data-slot="card-description" className={cn('mt-1 text-[13px] text-muted-foreground', className)} {...props} />
}

export function CardContent({ className, ...props }) {
  return <div data-slot="card-content" className={cn('px-5 py-5', className)} {...props} />
}

export function CardFooter({ className, ...props }) {
  return <div data-slot="card-footer" className={cn('flex items-center gap-2 border-t px-5 py-3', className)} {...props} />
}
