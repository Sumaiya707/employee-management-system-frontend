import { useEffect } from 'react'
import { pageTitle } from '@/config/brand'

// Page title, optional description and actions; also sets the browser tab title.
// documentTitle: browser tab text when it should differ from the heading.
export function PageHeader({ title, documentTitle, description, actions, children }) {
  const tabTitle = documentTitle || title
  useEffect(() => {
    document.title = pageTitle(tabTitle)
  }, [tabTitle])

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {children}
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-[22px]">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
