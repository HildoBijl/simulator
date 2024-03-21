import { createTheme } from '@mui/material/styles';

import './main.css'

export const createCustomTheme = ({ prefersDarkMode }) => createTheme({
  palette: {
    primary: {
      main: '#e2001a',
    },
    secondary: {
      main: '#213547',
    },
    mode: prefersDarkMode ? 'dark' : 'light',
  },
})
