"use client";

import { Box, Typography } from '@mui/material'
import React from 'react'
import { AccountProvider } from '@/store/account'
import ConnectWallet from '@/components/ConnectWallet'
import BetsScreen from '@/components/BetsScreen'

export default function BetsPage() {
  return (
    <AccountProvider>
      <Box sx={{
        py: 3,
        display: 'grid',
        gap: 3,
        gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }
      }}>
        <Box>
          <BetsScreen />
        </Box>
        <Box>
          <ConnectWallet />
        </Box>
      </Box>
    </AccountProvider>
  );
}