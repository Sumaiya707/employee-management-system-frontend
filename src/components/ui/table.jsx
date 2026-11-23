import { cn } from '@/lib/utils'

// The wrapper scrolls sideways on small screens instead of cutting content off.
export function Table({ className, ...props }) {
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto">
      <table data-slot="table" className={cn('w-full caption-bottom border-collapse text-sm', className)} {...props} />
    </div>
  )
}

export function TableHeader({ className, ...props }) {
  return <thead data-slot="table-header" className={cn('bg-muted/50 [&_tr]:border-b', className)} {...props} />
}

export function TableBody({ className, ...props }) {
  return <tbody data-slot="table-body" className={cn('[&_tr:last-child]:border-0', className)} {...props} />
}

export function TableRow({ className, ...props }) {
  return <tr data-slot="table-row" className={cn('border-b transition-colors hover:bg-muted/40', className)} {...props} />
}

export function TableHead({ className, ...props }) {
  return (
    <th
      data-slot="table-head"
      scope="col"
      className={cn('h-10 whitespace-nowrap px-4 text-left align-middle text-xs font-medium text-muted-foreground', className)}
      {...props}
    />
  )
}

export function TableCell({ className, ...props }) {
  return <td data-slot="table-cell" className={cn('whitespace-nowrap px-4 py-3 align-middle', className)} {...props} />
}
