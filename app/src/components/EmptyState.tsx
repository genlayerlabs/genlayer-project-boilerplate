'use client'

import React from 'react'
import { Box, Typography, Button } from '@mui/material'
import { Add, SportsSoccer, EmojiEvents } from '@mui/icons-material'

interface EmptyStateProps {
  type: 'bets' | 'leaderboard'
  onCreateBet?: () => void
  showCreateButton?: boolean
}

export default function EmptyState({ type, onCreateBet, showCreateButton = true }: EmptyStateProps) {
  if (type === 'bets') {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <SportsSoccer sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No bets yet
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Be the first to create a bet and start earning points!
        </Typography>
        {showCreateButton && onCreateBet && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={onCreateBet}
            size="large"
          >
            Create First Bet
          </Button>
        )}
      </Box>
    )
  }

  if (type === 'leaderboard') {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <EmojiEvents sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No leaderboard data
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Start betting to see rankings!
        </Typography>
      </Box>
    )
  }

  return null
}

