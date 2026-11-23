import { CircleAlertIcon } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

// Label + control + hint + error. The control itself gets its id and aria
// attributes from fieldA11y() in src/lib/form.js.
export function FormField({ id, label, error, hint, required = false, className, children }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label ? (
        <Label htmlFor={id}>
          {label}
          {required ? (
            <span className="text-danger" aria-hidden="true">
              {' '}
              *
            </span>
          ) : null}
        </Label>
      ) : null}
      {children}
      {hint && !error ? (
        <p id={id + '-hint'} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {hint && error ? (
        <p id={id + '-hint'} className="sr-only">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={id + '-error'} className="flex items-start gap-1.5 text-xs text-danger">
          <CircleAlertIcon className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  )
}

// A titled group of fields inside a form.
export function FormSection({ title, description, children, className }) {
  return (
    <section className={cn('grid gap-5 border-t pt-6 first:border-t-0 first:pt-0 lg:grid-cols-[220px_1fr]', className)}>
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        {description ? <p className="mt-1 text-[13px] text-muted-foreground">{description}</p> : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  )
}
