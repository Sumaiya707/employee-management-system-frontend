import { Toaster } from 'sonner'
import { useTheme } from '@/app/themeContext'

// Sonner toasts, matched to the light/dark theme and the app's colours.
export function AppToaster() {
  const { resolved } = useTheme()
  return (
    <Toaster
      theme={resolved}
      position="top-right"
      closeButton
      toastOptions={{
        classNames: {
          toast: '!rounded-md !border !border-border !bg-popover !text-popover-foreground !shadow-lg',
          description: '!text-muted-foreground',
          error: '[&_[data-icon]]:!text-danger',
          success: '[&_[data-icon]]:!text-success',
        },
      }}
    />
  )
}
