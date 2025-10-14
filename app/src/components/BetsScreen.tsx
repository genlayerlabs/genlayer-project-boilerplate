'use client'

import React, { useEffect, useState, memo, useCallback, useMemo, lazy, Suspense } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Container,
  Stepper,
  Step,
  StepLabel,
  Backdrop,
  Snackbar,
} from '@mui/material'
import {
  Add,
  CheckCircle,
  HourglassEmpty,
  CheckCircleOutline,
  Close,
  Visibility,
  Warning,
} from '@mui/icons-material'
import { FootballBets } from '../services/FootballBets'
import { useAccount } from '../store/account'
import { onAccountChanged, getRouterState, onRouterChanged } from '../services/genlayer'

// Lazy load only heavy components that are not immediately visible
const CreateBetDialog = lazy(() => import('./CreateBetDialog'))
    // ContractCompatibilityBanner removed

// Keep lightweight components as normal imports for faster initial render
import AddressAvatar from './AddressAvatar'
import PointsProgress from './PointsProgress'
import LoadingSkeleton from './LoadingSkeleton'
import EmptyState from './EmptyState'

type BetRow = {
  id: string
  owner: string
  has_resolved: boolean
  game_date: string
  team1: string
  team2: string
  predicted_winner: string
  real_winner: string
  real_score: string
}

type LeaderboardRow = {
  address: string
  points: number
  rank?: number
}

type TransactionStatus = 'idle' | 'requested' | 'accepted' | 'finalized' | 'error'

const BetsScreen = memo(function BetsScreen() {
  // State management
  const [bets, setBets] = useState<BetRow[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [txStatus, setTxStatus] = useState<TransactionStatus>('idle')
  const [txHash, setTxHash] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  })

  // Router state
  const [routerState, setRouterState] = useState<any>({
    localAddress: null,
    sessionAddress: null,
    externalEvmAddress: null,
    isConnectedLocal: false,
    isConnectedSession: false,
    isConnectedExternal: false,
    primaryOnchainEngine: null,
  })

  const account = useAccount()

  // Memoized values
  const canWriteOnchain = useMemo(() => 
    routerState.isConnectedLocal || routerState.isConnectedSession, 
    [routerState.isConnectedLocal, routerState.isConnectedSession]
  )

  const footballBets = useMemo(() => new FootballBets(), [])

  // Optimized handlers with useCallback
  const showSnackbar = useCallback((message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity })
  }, [])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [betsData, leaderboardData] = await Promise.all([
        footballBets.getBets(),
        footballBets.getLeaderboard()
      ])
      setBets(betsData as BetRow[])
      setLeaderboard(leaderboardData as LeaderboardRow[])
    } catch (error) {
      console.error('Failed to fetch data:', error)
      showSnackbar('Failed to fetch data', 'error')
    } finally {
      setLoading(false)
    }
  }, [footballBets, showSnackbar])

  const onCreateBet = useCallback(async (betData: any) => {
    if (!canWriteOnchain) {
      showSnackbar('Please connect wallet or authorize session', 'error')
      return
    }

    setTxStatus('requested')
    setCreateDialogOpen(false)

    try {
      const hash = await footballBets.createBet(
        betData.gameDate,
        betData.team1,
        betData.team2,
        betData.predictedWinner
      )
      
      setTxHash(hash)
      setTxStatus('accepted')
      showSnackbar('Bet created! Waiting for finalization...', 'success')

      // Wait for finalization
      await footballBets.waitForTransactionReceipt({ hash })
      setTxStatus('finalized')
      showSnackbar('Bet created successfully!', 'success')
      
      // Refresh data
      await fetchData()
    } catch (error) {
      console.error('Failed to create bet:', error)
      setTxStatus('error')
      showSnackbar('Failed to create bet', 'error')
    }
  }, [canWriteOnchain, footballBets, showSnackbar, fetchData])

  const onResolve = useCallback(async (betId: string) => {
    if (!canWriteOnchain) {
      showSnackbar('Please connect wallet or authorize session', 'error')
      return
    }

    setTxStatus('requested')
    setTxHash(betId)

    try {
      const hash = await footballBets.resolveBetTx(betId)
      setTxStatus('accepted')
      showSnackbar('Bet resolution submitted! Waiting for finalization...', 'success')

      // Wait for finalization
      await footballBets.waitForTransactionReceipt({ hash })
      setTxStatus('finalized')
      showSnackbar('Bet resolved successfully!', 'success')
      
      // Refresh data
      await fetchData()
    } catch (error) {
      console.error('Failed to resolve bet:', error)
      setTxStatus('error')
      showSnackbar('Failed to resolve bet', 'error')
    }
  }, [canWriteOnchain, footballBets, showSnackbar, fetchData])

  // Router state management
  useEffect(() => {
    const updateRouterState = () => {
      const state = getRouterState()
      setRouterState(state)
    }
    
    updateRouterState()
    const unsubscribe = onRouterChanged(updateRouterState)
    
    return unsubscribe
  }, [])

  // Account change handler
  useEffect(() => {
    const unsubscribe = onAccountChanged((newAccount) => {
      if (newAccount?.address) {
        fetchData()
      }
    })
    
    return unsubscribe
  }, [fetchData])

  // Initial data fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Suspense fallback={<CircularProgress />}>
          <LoadingSkeleton />
        </Suspense>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* ContractCompatibilityBanner removed */}
      
      {/* Header with wallet status */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Football Bets
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Place bets on football matches and compete on the leaderboard
        </Typography>
        
        {/* Wallet status */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          {routerState.localAddress && (
            <Chip 
              icon={<CheckCircle />} 
              label={`Local: ${String(routerState.localAddress).slice(0, 6)}...${String(routerState.localAddress).slice(-4)}`} 
              color="primary" 
            />
          )}
          {routerState.sessionAddress && (
            <Chip 
              icon={<CheckCircle />} 
              label={`Session: ${String(routerState.sessionAddress).slice(0, 6)}...${String(routerState.sessionAddress).slice(-4)}`} 
              color="secondary" 
            />
          )}
          {routerState.externalEvmAddress && (
            <Chip 
              icon={<CheckCircle />} 
              label={`EVM: ${String(routerState.externalEvmAddress).slice(0, 6)}...${String(routerState.externalEvmAddress).slice(-4)}`} 
              color="success" 
            />
          )}
        </Box>
        
        {/* Action buttons */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
            disabled={!canWriteOnchain}
          >
            Create Bet
          </Button>
          {!canWriteOnchain && (
            <Tooltip title="Connect wallet or authorize session to create bets">
              <span>
                <Button variant="outlined" disabled>
                  Create Bet (Connect Wallet)
                </Button>
              </span>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Bets Table */}
      <Card sx={{ mb: 4 }}>
        <CardHeader title="Active Bets" />
        <CardContent>
          {bets.length === 0 ? (
            <Suspense fallback={<CircularProgress />}>
              <EmptyState
                type="bets"
                onCreateBet={() => setCreateDialogOpen(true)}
                showCreateButton={canWriteOnchain}
              />
            </Suspense>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Game</TableCell>
                    <TableCell>Prediction</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bets.map((bet) => (
                    <TableRow key={bet.id}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {bet.team1} vs {bet.team2}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(bet.game_date).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          Winner: {bet.predicted_winner}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={bet.has_resolved ? <CheckCircleOutline /> : <HourglassEmpty />}
                          label={bet.has_resolved ? 'Resolved' : 'Pending'}
                          color={bet.has_resolved ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="View Details">
                            <IconButton size="small">
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          {!bet.has_resolved && canWriteOnchain && (
                            <Tooltip title="Resolve Bet">
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => onResolve(bet.id)}
                                color="primary"
                                startIcon={<CheckCircle />}
                              >
                                Resolve
                              </Button>
                            </Tooltip>
                          )}
                          {!bet.has_resolved && !canWriteOnchain && (
                            <Tooltip title="Connect wallet to resolve bets">
                              <Button
                                variant="outlined"
                                size="small"
                                disabled
                                startIcon={<CheckCircle />}
                              >
                                Resolve
                              </Button>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card>
        <CardHeader title="Leaderboard" />
        <CardContent>
          {leaderboard.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No players yet. Create your first bet to get started!
            </Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Rank</TableCell>
                    <TableCell>Player</TableCell>
                    <TableCell>Points</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaderboard.map((row, index) => (
                    <TableRow key={row.address}>
                      <TableCell>
                        <Typography variant="h6" color="primary">
                          #{index + 1}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Suspense fallback={<CircularProgress size={20} />}>
                            <AddressAvatar address={row.address} />
                          </Suspense>
                          <Typography variant="body2">
                            {row.address.slice(0, 6)}...{row.address.slice(-4)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Suspense fallback={<CircularProgress size={20} />}>
                          <PointsProgress points={row.points} />
                        </Suspense>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Transaction Status */}
      {txStatus !== 'idle' && (
        <Box sx={{ mt: 4 }}>
          <Alert severity={txStatus === 'error' ? 'error' : 'info'} sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Transaction Status
            </Typography>
            <Stepper activeStep={txStatus === 'requested' ? 0 : txStatus === 'accepted' ? 1 : txStatus === 'finalized' ? 2 : 3}>
              <Step>
                <StepLabel>Requested</StepLabel>
              </Step>
              <Step>
                <StepLabel>Accepted</StepLabel>
              </Step>
              <Step>
                <StepLabel>Finalized</StepLabel>
              </Step>
            </Stepper>
            {txHash && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Transaction Hash: {txHash}
              </Typography>
            )}
          </Alert>
        </Box>
      )}

      {/* Loading Backdrop */}
      <Backdrop open={txStatus === 'requested'} sx={{ zIndex: 9999 }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Processing Transaction...
          </Typography>
        </Box>
      </Backdrop>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Lazy load dialog */}
      <Suspense fallback={null}>
        <CreateBetDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onSubmit={onCreateBet}
        />
      </Suspense>
    </Container>
  )
})

export default BetsScreen