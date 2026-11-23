import { createContext, useContext } from 'react'

export const ThemeContext = createContext({ choice: 'system', resolved: 'light', setChoice: () => {} })

// { choice: "light" | "dark" | "system", resolved: "light" | "dark", setChoice }
export function useTheme() {
  return useContext(ThemeContext)
}
