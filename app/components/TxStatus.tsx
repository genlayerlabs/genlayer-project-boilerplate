'use client'

import React from 'react'
import { Box, Stepper, Step, StepLabel, Typography, Chip, LinearProgress } from '@mui/material'
import { CheckCircle, HourglassEmpty, Error } from '@mui/icons-material'

export type TxStatus = 'pending' | 'accepted' | 'finalized' | 'failed'

interface TxStatusProps {
  status: TxStatus
  txHash?: string
  showProgress?: boolean
  compact?: boolean
}

const getStepIndex = (status: TxStatus): number => {
  switch (status) {
    case 'pending': return 0
    case 'accepted': return 1
    case 'finalized': return 2
    case 'failed': return -1
    default: return 0
  }
}

const getStatusColor = (status: TxStatus): 'default' | 'primary' | 'success' | 'error' => {
  switch (status) {
    case 'pending': return 'default'
    case 'accepted': return 'primary'
    case 'finalized': return 'success'
    case 'failed': return 'error'
    default: return 'default'
  }
}

const getStatusIcon = (status: TxStatus) => {
  switch (status) {
    case 'pending': return <HourglassEmpty />
    case 'accepted': return <HourglassEmpty />
    case 'finalized': return <CheckCircle />
    case 'failed': return <Error />
    default: return <HourglassEmpty />
  }
}

export default function TxStatusComponent({ status, txHash, showProgress = true, compact = false }: TxStatusProps) {
  const stepIndex = getStepIndex(status)
  const statusColor = getStatusColor(status)
  const statusIcon = getStatusIcon(status)

  if (compact) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          icon={statusIcon}
          label={status.toUpperCase()}
          color={statusColor}
          size="small"
          variant="filled"
        />
        {showProgress && status !== 'failed' && (
          <LinearProgress
            variant="determinate"
            value={stepIndex === -1 ? 0 : (stepIndex + 1) * 33.33}
            sx={{ width: 60, height: 4 }}
          />
        )}
      </Box>
    )
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Stepper activeStep={stepIndex} orientation="horizontal">
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
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          TX: {txHash.slice(0, 10)}...{txHash.slice(-8)}
        </Typography>
      )}
      
      <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          icon={statusIcon}
          label={status.toUpperCase()}
          color={statusColor}
          size="small"
          variant="filled"
        />
        {showProgress && status !== 'failed' && (
          <LinearProgress
            variant="determinate"
            value={stepIndex === -1 ? 0 : (stepIndex + 1) * 33.33}
            sx={{ flexGrow: 1, height: 4 }}
          />
        )}
      </Box>
    </Box>
  )
}