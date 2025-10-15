'use client'

import React from 'react'
import { ThemeProvider, CssBaseline, AppBar, Toolbar, Typography, Container } from '@mui/material'
import { appTheme } from '../lib/theme'
import { EVMProviderWrapper } from './EVMProviderWrapper'

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'background.default', color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider', height: 56, justifyContent: 'center' }}>
        <Toolbar sx={{ minHeight: 56 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>Football Bets</Typography>
        </Toolbar>
      </AppBar>
      <EVMProviderWrapper>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          {children}
        </Container>
      </EVMProviderWrapper>
    </ThemeProvider>
  )
}



