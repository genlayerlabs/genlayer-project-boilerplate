'use client'

import { ThemeProvider, createTheme } from '@mui/material/styles'
import { Box, Typography, Button, Container } from '@mui/material'
import { useRouter } from 'next/navigation'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb',
    },
  },
})

export default function NotFound() {
  const router = useRouter()

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h1" component="h1" gutterBottom>
          404
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom>
          Page Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          The page you're looking for doesn't exist.
        </Typography>
        <Button
          variant="contained"
          onClick={() => router.push('/')}
          sx={{ px: 4 }}
        >
          Go Home
        </Button>
      </Container>
    </ThemeProvider>
  )
}

