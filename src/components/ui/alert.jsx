import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const alertVariants = cva('flex gap-3 rounded-md border px-3.5 py-3 text-sm [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0', {
  variants: {
    variant: {
      info: 'border-accent/25 bg-accent-soft text-accent-soft-foreground',
      danger: 'border-danger/25 bg-danger-soft text-danger',
      warning: 'border-warning/25 bg-warning-soft text-warning',
      success: 'border-success/25 bg-success-soft text-success',
      neutral: 'bg-muted text-foreground',
    },
  },
  defaultVariants: { variant: 'info' },
})

// role="alert" makes screen readers announce errors as soon as they appear.
export function Alert({ className, variant, live = false, ...props }) {
  const role = variant === 'danger' || live ? 'alert' : 'status'
  return <div role={role} className={cn(alertVariants({ variant }), className)} {...props} />
}
