import { BRAND } from '@/config/brand'
import { cn } from '@/lib/utils'

// Text-based brand: a small "P" monogram and the product name.
export function BrandMark({ className, inverted = false, showDescription = false }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span
        aria-hidden="true"
        className={cn(
          'relative flex size-8 items-center justify-center rounded-md text-[15px] font-bold',
          inverted ? 'bg-white text-[#1f2328]' : 'bg-primary text-primary-foreground',
        )}
      >
        P
        <span className={cn('absolute right-1.5 bottom-1.5 size-1.5 rounded-[1px]', inverted ? 'bg-[#2f6470]' : 'bg-accent')} />
      </span>
      <span className="flex flex-col leading-tight">
        <span className={cn('text-[15px] font-semibold tracking-tight', inverted ? 'text-white' : 'text-foreground')}>{BRAND.name}</span>
        {showDescription ? (
          <span className={cn('text-[11px]', inverted ? 'text-white/70' : 'text-muted-foreground')}>{BRAND.description}</span>
        ) : null}
      </span>
    </div>
  )
}
