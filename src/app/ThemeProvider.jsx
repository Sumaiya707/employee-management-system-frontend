import { useEffect, useMemo, useState } from 'react'
import { applyTheme, readThemeChoice, resolveTheme, saveThemeChoice } from '@/lib/theme'
import { ThemeContext } from './themeContext'

export function ThemeProvider({ children }) {
  const [choice, setChoiceState] = useState(readThemeChoice)
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)

  // Follow the operating system setting while "system" is chosen.
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (event) => setSystemDark(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const resolved = choice === 'system' ? (systemDark ? 'dark' : 'light') : resolveTheme(choice)

  useEffect(() => {
    applyTheme(resolved)
  }, [resolved])

  const value = useMemo(
    () => ({
      choice: choice,
      resolved: resolved,
      setChoice: (next) => {
        saveThemeChoice(next)
        setChoiceState(next)
      },
    }),
    [choice, resolved],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
