'use client'

import React from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Container,
  Card,
  CardContent,
  Chip,
  useTheme,
} from '@mui/material'
import { Brightness4, Brightness7, SportsSoccer } from '@mui/icons-material'
import { useTheme as useMuiTheme } from '@mui/material/styles'
import { useAccount } from '@/store/account'
import DarkModeToggle from './DarkModeToggle'

export default function AppHeader() {
  const theme = useMuiTheme()
  const { account } = useAccount()

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <AppBar position="static" elevation={0} sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between', py: 1 }}>
          {/* Logo + Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SportsSoccer sx={{ color: 'primary.main', fontSize: 32 }} />
            <Typography variant="h6" component="div" sx={{ color: 'text.primary', fontWeight: 600 }}>
              GenLayer Football Bets
            </Typography>
          </Box>

          {/* Right side: Wallet + Theme toggle */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {account?.address && (
              <Chip
                label={formatAddress(account.address)}
                variant="outlined"
                size="small"
                sx={{ 
                  fontFamily: 'monospace',
                  bgcolor: 'primary.50',
                  borderColor: 'primary.200',
                  color: 'primary.700',
                }}
              />
            )}
            
            <DarkModeToggle />
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  )
}

export function HeroCard() {
  const { account } = useAccount()
  
  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Card elevation={0} sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            GenLayer Football Bets
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            {account?.address 
              ? "Welcome back! You can create bets, resolve games, and climb the leaderboard."
              : "Connect your wallet to start betting on football games. You can browse without a wallet; connect to create or resolve."
            }
          </Typography>
        </CardContent>
      </Card>
    </Container>
  )
}
