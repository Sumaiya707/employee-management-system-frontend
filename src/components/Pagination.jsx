import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Uses the backend's meta: { page, limit, total, totalPages }.
export function Pagination({ meta, onPageChange, isFetching = false }) {
  if (!meta || meta.total === 0) {
    return null
  }
  const first = (meta.page - 1) * meta.limit + 1
  const last = Math.min(meta.page * meta.limit, meta.total)
  return (
    <nav aria-label="Pagination" className="flex flex-col gap-3 border-t px-4 py-3 text-[13px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <p aria-live="polite">
        Showing <span className="font-medium text-foreground">{first}</span>–<span className="font-medium text-foreground">{last}</span> of{' '}
        <span className="font-medium text-foreground">{meta.total}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onPageChange(meta.page - 1)} disabled={meta.page <= 1 || isFetching}>
          <ChevronLeftIcon aria-hidden="true" />
          Previous
        </Button>
        <span className="px-1 tabular-nums">
          Page {meta.page} of {Math.max(meta.totalPages, 1)}
        </span>
        <Button variant="outline" size="sm" onClick={() => onPageChange(meta.page + 1)} disabled={meta.page >= meta.totalPages || isFetching}>
          Next
          <ChevronRightIcon aria-hidden="true" />
        </Button>
      </div>
    </nav>
  )
}
