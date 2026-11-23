import { cn } from '@/lib/utils'

const fieldClasses =
  'w-full min-w-0 rounded-md border border-input bg-card px-3 text-sm text-foreground shadow-none outline-none transition-colors placeholder:text-muted-foreground/80 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-danger aria-invalid:focus-visible:ring-danger/25'

export function Input({ className, type = 'text', ...props }) {
  return <input data-slot="input" type={type} className={cn(fieldClasses, 'h-9 py-1', className)} {...props} />
}

export function Textarea({ className, rows = 3, ...props }) {
  return <textarea data-slot="textarea" rows={rows} className={cn(fieldClasses, 'min-h-20 resize-y py-2', className)} {...props} />
}

// A styled native <select>: fully keyboard and screen-reader accessible, and
// it works with React Hook Form's register() without extra code.
export function NativeSelect({ className, children, ...props }) {
  return (
    <select
      data-slot="select"
      className={cn(
        fieldClasses,
        'h-9 appearance-none bg-[length:16px] bg-[right_0.6rem_center] bg-no-repeat pr-9',
        "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}
