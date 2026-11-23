import { SearchIcon, XIcon } from 'lucide-react'
import { useEffect, useEffectEvent, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input, NativeSelect } from '@/components/ui/input'
import { cn } from '@/lib/utils'

// How long typing must pause before the search is applied.
const SEARCH_DELAY_MS = 350

// Search box that waits for typing to pause before asking the backend.
//   value     the search currently in the address bar
//   onChange  writes a new search into the address bar
// Pages give this box a `key`; changing the key ("Clear filters") makes React
// start a fresh box, which also drops any half-typed text.
export function SearchBox({ value, onChange, placeholder, label = 'Search' }) {
  // What is typed in the box. While typing it can be ahead of the address bar.
  const [text, setText] = useState(value)
  // The typed text once typing has paused: this is what gets searched.
  const [waitedText, setWaitedText] = useState(value)

  // Copy the typed text into waitedText once typing pauses.
  useEffect(() => {
    const timer = setTimeout(() => setWaitedText(text), SEARCH_DELAY_MS)
    return () => clearTimeout(timer)
  }, [text])

  // When the search in the address bar changes, decide whether the box must
  // follow it. React's recommended way to update state when a prop changes:
  // compare with the value from the previous render (no effect needed).
  const [previousValue, setPreviousValue] = useState(value)
  if (value !== previousValue) {
    setPreviousValue(value)
    // If it is not our own search arriving there, it changed from outside
    // (for example "Clear filters"): show it in the box.
    if (value !== waitedText.trim()) {
      setText(value)
      setWaitedText(value)
    }
  }

  // Writes the search into the address bar if it is different. This is an
  // "effect event": it always sees the newest value and onChange, but it does
  // not make the effect below run again when they change.
  const applySearch = useEffectEvent((searchText) => {
    if (searchText !== value) {
      onChange(searchText)
    }
  })

  // Runs only when the paused text changes.
  useEffect(() => {
    applySearch(waitedText.trim())
  }, [waitedText])

  return (
    <div className="relative w-full sm:w-64">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <Input type="search" value={text} onChange={(event) => setText(event.target.value)} placeholder={placeholder} aria-label={label} maxLength={100} className="pl-9" />
    </div>
  )
}

// A labelled filter <select>. options: [{ value, label }]
export function FilterSelect({ id, label, value, onChange, options, className }) {
  return (
    <div className={cn('w-full sm:w-auto', className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <NativeSelect id={id} value={value} onChange={(event) => onChange(event.target.value)} className="sm:w-44">
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </NativeSelect>
    </div>
  )
}

export function ListToolbar({ children, onClear, showClear }) {
  return (
    <div className="flex flex-col gap-2 border-b p-4 sm:flex-row sm:flex-wrap sm:items-center">
      {children}
      {showClear ? (
        <Button variant="ghost" size="sm" onClick={onClear} className="self-start sm:self-auto">
          <XIcon aria-hidden="true" />
          Clear filters
        </Button>
      ) : null}
    </div>
  )
}
