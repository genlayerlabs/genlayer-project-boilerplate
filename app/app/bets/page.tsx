"use client";

import { ThemeProvider, createTheme } from '@mui/material/styles'
import { Box } from '@mui/material'
import { AccountProvider } from '@/store/account'
import AppHeader, { HeroCard } from '@/components/AppHeader'
import ConnectWallet from '@/components/ConnectWallet'
import BetsScreen from '@/components/BetsScreen'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb',
    },
    success: {
      main: '#16a34a',
    },
    warning: {
      main: '#d97706',
    },
    error: {
      main: '#dc2626',
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
  },
})

export default function BetsPage() {
  return (
    <ThemeProvider theme={theme}>
      <AccountProvider>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <AppHeader />
          <HeroCard />
          <ConnectWallet />
          <BetsScreen />
        </Box>
      </AccountProvider>
    </ThemeProvider>
  );
}