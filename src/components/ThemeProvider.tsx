'use client'

import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'

const theme = createTheme({
  palette: {
    mode: 'dark',
  },
})

// Create emotion cache
const cache = createCache({ key: 'css', prepend: true })

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <CacheProvider value={cache}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </CacheProvider>
  )
} 