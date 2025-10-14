"use client";

import { Box, Typography, Container } from '@mui/material'
import { AccountProvider } from '../../src/store/account'
import ConnectWallet from '../../src/components/ConnectWallet'
import BetsScreen from '../../src/components/BetsScreen'

export default function BetsPage() {
  return (
    <AccountProvider>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Football Bets
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            Decentralized football betting powered by GenLayer
          </Typography>
        </Box>
        <Box sx={{ mb: 6 }}>
          <ConnectWallet />
        </Box>
        <BetsScreen />
      </Container>
    </AccountProvider>
  );
}


