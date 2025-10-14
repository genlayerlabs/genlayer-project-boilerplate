'use client'

import { Box, Typography, Button, Card, CardContent, Container, CircularProgress } from '@mui/material'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export const dynamic = 'force-dynamic'

export default function HomePage() {
  const [isNavigating, setIsNavigating] = useState(false)
  const router = useRouter()

  const handleNavigation = () => {
    setIsNavigating(true)
    router.push('/bets')
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          GenLayer Football Bets
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          Decentralized football betting powered by GenLayer
        </Typography>
        <Button
          variant="contained"
          size="large"
          sx={{ px: 4, py: 1.5 }}
          onClick={handleNavigation}
          disabled={isNavigating}
        >
          {isNavigating ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Loading...
            </>
          ) : (
            'Start Betting →'
          )}
        </Button>
      </Box>
      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' }, mt: 6 }}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" component="h2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              🏆 How it Works
            </Typography>
            <Box component="ul" sx={{ pl: 2, m: 0 }}>
              <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Create bets on upcoming football matches
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Predict the winner and earn points
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Resolve bets when matches finish
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                Climb the leaderboard
              </Typography>
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" component="h2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              🔐 Secure Wallet
            </Typography>
            <Box component="ul" sx={{ pl: 2, m: 0 }}>
              <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Local-first wallet system
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                AES-GCM encryption
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                No third-party dependencies
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                Export recovery phrases
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  )
}

export { default } from '../../app/page'


