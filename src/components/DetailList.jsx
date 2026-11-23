import { cn } from '@/lib/utils'

// Read-only label/value pairs. items: [{ label, value, wide? }]
export function DetailList({ items, className }) {
  return (
    <dl className={cn('grid gap-x-6 gap-y-5 sm:grid-cols-2', className)}>
      {items.map((item) => (
        <div key={item.label} className={cn('min-w-0', item.wide && 'sm:col-span-2')}>
          <dt className="text-xs text-muted-foreground">{item.label}</dt>
          <dd className="mt-1 text-sm break-words text-foreground">{item.value === null || item.value === undefined || item.value === '' ? '—' : item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
