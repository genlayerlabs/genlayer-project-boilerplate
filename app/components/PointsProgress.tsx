'use client'

import React from 'react'
import { LinearProgress, Box, Typography, Tooltip } from '@mui/material'

interface PointsProgressProps {
  points: number
  maxPoints?: number
  showValue?: boolean
  height?: number
}

export default function PointsProgress({ 
  points, 
  maxPoints, 
  showValue = true, 
  height = 8 
}: PointsProgressProps) {
  // Calculate percentage for progress bar
  const percentage = maxPoints ? (points / maxPoints) * 100 : Math.min(points * 10, 100)
  
  // Determine color based on points
  const getProgressColor = () => {
    if (points >= 100) return 'success'
    if (points >= 50) return 'primary'
    if (points >= 20) return 'warning'
    return 'error'
  }

  const progressColor = getProgressColor()

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <LinearProgress
          variant="determinate"
          value={percentage}
          color={progressColor}
          sx={{
            flexGrow: 1,
            height,
            borderRadius: height / 2,
            backgroundColor: 'rgba(0,0,0,0.1)',
            '& .MuiLinearProgress-bar': {
              borderRadius: height / 2,
            },
          }}
        />
        {showValue && (
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 'fit-content' }}>
            {points}
          </Typography>
        )}
      </Box>
      {maxPoints && (
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
          {percentage.toFixed(1)}% of max
        </Typography>
      )}
    </Box>
  )
}

