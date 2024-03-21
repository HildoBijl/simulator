import { useMemo } from 'react'
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'

import { createCustomTheme } from './theme'

export function ThemeProvider({ children }) {
	const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
	const theme = useMemo(() => createCustomTheme({ prefersDarkMode }), [prefersDarkMode])

	return <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
}
