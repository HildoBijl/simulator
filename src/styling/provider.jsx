import { useMemo } from 'react'
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'

import { createCustomTheme } from './theme'

export function ThemeProvider({ children }) {
	const mode = useMediaQuery('(prefers-color-scheme: dark)') ? 'dark' : 'light'
	const theme = useMemo(() => createCustomTheme({ mode }), [mode])

	return <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
}
