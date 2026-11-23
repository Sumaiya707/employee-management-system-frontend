import { Provider } from 'react-redux'
import { RouterProvider } from 'react-router/dom'
import { store } from '@/app/store'
import { ThemeProvider } from '@/app/ThemeProvider'
import { AppToaster } from '@/components/AppToaster'
import { router } from '@/routes/router'

// Application root: Redux store (session + RTK Query cache), light/dark theme,
// routes and toast notifications.
function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <RouterProvider router={router} />
        <AppToaster />
      </ThemeProvider>
    </Provider>
  )
}

export default App
