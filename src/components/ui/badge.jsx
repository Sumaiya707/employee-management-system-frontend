import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva('inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium', {
  variants: {
    variant: {
      neutral: 'bg-muted text-muted-foreground',
      accent: 'bg-accent-soft text-accent-soft-foreground',
      success: 'bg-success-soft text-success',
      warning: 'bg-warning-soft text-warning',
      danger: 'bg-danger-soft text-danger',
      outline: 'border text-muted-foreground',
    },
  },
  defaultVariants: { variant: 'neutral' },
})

// dot: shows a small status dot before the text.
export function Badge({ className, variant, dot = false, children, ...props }) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot ? <span aria-hidden="true" className="size-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  )
}
