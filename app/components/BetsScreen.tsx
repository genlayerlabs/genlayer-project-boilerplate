'use client'

import React, { useEffect, useState } from 'react'
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
} from '@mui/material'
import {
  Add,
  CheckCircle,
  HourglassEmpty,
  CheckCircleOutline,
  Close,
  Visibility,
} from '@mui/icons-material'
import { FootballBets } from '@/services/FootballBets'
import { onAccountChanged } from '@/services/genlayer'
import { useAccount } from '@/store/account'
import CreateBetDialog from './CreateBetDialog'
import AddressAvatar from './AddressAvatar'
import PointsProgress from './PointsProgress'
import LoadingSkeleton from './LoadingSkeleton'
import EmptyState from './EmptyState'

type BetRow = {
  user: string
  gameDate: string
  team1: string
  team2: string
  predicted: string
  resolved: boolean
  correct: boolean | null
  betId: string
}

type LeaderRow = { address: string; points: number }

// Status Chips
const StatusChip = ({ resolved }: { resolved: boolean }) => (
  <Chip
    icon={resolved ? <CheckCircle /> : <HourglassEmpty />}
    label={resolved ? 'Resolved' : 'Pending'}
    color={resolved ? 'success' : 'warning'}
    size="small"
    variant="filled"
  />
)

const ResultChip = ({ correct }: { correct: boolean | null }) => {
  if (correct === null) return <Typography variant="body2" color="text.secondary">—</Typography>
  
  return (
    <Chip
      icon={correct ? <CheckCircleOutline /> : <Close />}
      label={correct ? 'Correct' : 'Wrong'}
      color={correct ? 'primary' : 'error'}
      size="small"
      variant="filled"
    />
  )
}

export default function BetsScreen() {
  const { account } = useAccount()
  const [bets, setBets] = useState<BetRow[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fb, setFb] = useState<FootballBets | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [creatingBet, setCreatingBet] = useState(false)

  useEffect(() => {
    const contractAddress = typeof window !== 'undefined' 
      ? (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x2146690DCB6b857e375cA51D449e4400570e7c76")
      : "0x2146690DCB6b857e375cA51D449e4400570e7c76"
    const studioUrl = typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_STUDIO_URL : undefined
    
    const footballBets = new FootballBets(contractAddress, null, studioUrl)
    setFb(footballBets)
    
    const off = onAccountChanged((addr?: string | null) => {
      if (footballBets) {
        footballBets.updateAccount(addr ? { address: addr } : null)
      }
      refresh(footballBets)
    })
    refresh(footballBets)
    return () => { try { off?.(); } catch { /* noop */ } }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refresh = async (footballBets: FootballBets) => {
    try {
      setLoading(true)
      setError(null)
      console.log('Refreshing data from contract...')
      
      const [betsData, leaderboardData] = await Promise.all([
        footballBets.getBets(),
        footballBets.getLeaderboard()
      ])
      
      console.log('Bets data:', betsData)
      console.log('Leaderboard data:', leaderboardData)
      
      const rows = mapBets(betsData)
      const leaders = mapLeaderboard(leaderboardData)
      setBets(rows)
      setLeaderboard(leaders)
    } catch (e: any) {
      console.error('Failed to refresh data:', e)
      setError('Failed to load data from contract')
    } finally {
      setLoading(false)
    }
  }

  const mapBets = (betsData: any[]): BetRow[] => {
    const rows: BetRow[] = betsData.map((b: any) => ({
      user: b.owner,
      gameDate: b.game_date,
      team1: b.team1,
      team2: b.team2,
      predicted: normPred(b.predicted_winner),
      resolved: !!b.has_resolved,
      correct: b.has_resolved 
        ? (String(b.real_winner) === String(b.predicted_winner))
        : null,
      betId: b.id,
    }))
    
    return rows.sort((a, b) => (a.gameDate < b.gameDate ? 1 : -1))
  }

  const mapLeaderboard = (leaderboardData: any[]): LeaderRow[] => {
    const rows = leaderboardData.map((entry: any) => ({
      address: entry.address,
      points: Number(entry.points),
    }))
    rows.sort((a, b) => b.points - a.points)
    return rows
  }

  const normPred = (p: string) => {
    if (p === "0") return "Draw"
    if (p === "1") return "Team1"
    if (p === "2") return "Team2"
    return p
  }

  const onCreateBet = async (data: { gameDate: string; team1: string; team2: string; predicted: string }) => {
    if (!fb) return
    
    setCreatingBet(true)
    try {
      await fb.createBetTx(data.gameDate, data.team1, data.team2, data.predicted)
      if (fb) await refresh(fb)
      setError(null)
    } catch (e) {
      console.error("Failed to create bet:", e)
      setError("Failed to create bet")
    } finally {
      setCreatingBet(false)
    }
  }

  const onResolve = async (betId: string) => {
    if (!fb) return
    try {
      await fb.resolveBetTx(betId)
      if (fb) await refresh(fb)
    } catch (e) {
      console.error("Failed to resolve bet:", e)
      setError("Failed to resolve bet")
    }
  }

  if (loading && bets.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
          <Box sx={{ flex: { xs: 1, lg: 2 } }}>
            <Card>
              <CardHeader title="Bets" />
              <CardContent>
                <LoadingSkeleton variant="table" rows={5} />
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ flex: { xs: 1, lg: 1 } }}>
            <Card>
              <CardHeader title="Leaderboard" />
              <CardContent>
                <LoadingSkeleton variant="list" rows={5} />
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
        {/* Bets Section */}
        <Box sx={{ flex: { xs: 1, lg: 2 } }}>
          <Card>
            <CardHeader
              title="Bets"
              action={
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setShowCreateDialog(true)}
                  disabled={!account?.address}
                >
                  Create Bet
                </Button>
              }
            />
            <CardContent sx={{ p: 0 }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Game Date</TableCell>
                      <TableCell>Team 1</TableCell>
                      <TableCell>Team 2</TableCell>
                      <TableCell>Predicted Winner</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Result</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} sx={{ p: 0 }}>
                          <EmptyState 
                            type="bets" 
                            onCreateBet={() => setShowCreateDialog(true)}
                            showCreateButton={!!account?.address}
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      bets.map((b) => (
                        <TableRow key={b.betId} hover>
                          <TableCell>
                            <AddressAvatar address={b.user} size={24} />
                          </TableCell>
                          <TableCell>{b.gameDate}</TableCell>
                          <TableCell>{b.team1}</TableCell>
                          <TableCell>{b.team2}</TableCell>
                          <TableCell>{b.predicted}</TableCell>
                          <TableCell>
                            <StatusChip resolved={b.resolved} />
                          </TableCell>
                          <TableCell>
                            <ResultChip correct={b.correct} />
                          </TableCell>
                          <TableCell>
                            {account?.address ? (
                              <Tooltip title="Resolve bet">
                                <IconButton
                                  size="small"
                                  onClick={() => onResolve(b.betId)}
                                  disabled={b.resolved}
                                >
                                  <Visibility />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                Connect to act
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>

        {/* Leaderboard Section */}
        <Box sx={{ flex: { xs: 1, lg: 1 } }}>
          <Card>
            <CardHeader title="Leaderboard" />
            <CardContent sx={{ p: 0 }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Rank</TableCell>
                      <TableCell>Address</TableCell>
                      <TableCell>Points</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {leaderboard.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} sx={{ p: 0 }}>
                          <EmptyState type="leaderboard" />
                        </TableCell>
                      </TableRow>
                    ) : (
                      leaderboard.map((row, idx) => {
                        const maxPoints = leaderboard.length > 0 ? leaderboard[0].points : 100
                        return (
                          <TableRow key={row.address} hover>
                            <TableCell>
                              <Chip
                                label={idx + 1}
                                size="small"
                                color={idx < 3 ? (idx === 0 ? 'warning' : idx === 1 ? 'default' : 'primary') : 'default'}
                                variant={idx < 3 ? 'filled' : 'outlined'}
                                sx={{ fontWeight: 'bold' }}
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AddressAvatar address={row.address} size={24} />
                                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                  {`${row.address.slice(0, 6)}...${row.address.slice(-4)}`}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ minWidth: 120 }}>
                              <PointsProgress 
                                points={row.points} 
                                maxPoints={maxPoints}
                                showValue={true}
                              />
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <CreateBetDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSubmit={onCreateBet}
        loading={creatingBet}
      />
    </Container>
  )
}