import { Suspense } from 'react'
import { Outlet } from 'react-router'
import { LoadingBlock } from '@/components/QueryState'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

// The signed-in application: sidebar (desktop) or drawer (mobile), header, page.
export function AppLayout() {
  return (
    <div className="min-h-svh bg-background">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="flex min-h-svh flex-col lg:pl-60">
        <Header />
        <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8 lg:py-8">
          <Suspense fallback={<LoadingBlock />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
