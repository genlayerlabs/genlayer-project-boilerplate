'use client'

import React from 'react'
import { Skeleton, Box, Card, CardContent, CardHeader } from '@mui/material'

interface LoadingSkeletonProps {
  variant?: 'table' | 'card' | 'list'
  rows?: number
}

export default function LoadingSkeleton({ variant = 'table', rows = 5 }: LoadingSkeletonProps) {
  if (variant === 'table') {
    return (
      <Box sx={{ width: '100%' }}>
        {/* Table header skeleton */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Skeleton variant="rectangular" width="20%" height={40} />
          <Skeleton variant="rectangular" width="25%" height={40} />
          <Skeleton variant="rectangular" width="25%" height={40} />
          <Skeleton variant="rectangular" width="15%" height={40} />
          <Skeleton variant="rectangular" width="15%" height={40} />
        </Box>
        
        {/* Table rows skeleton */}
        {Array.from({ length: rows }).map((_, index) => (
          <Box key={index} sx={{ display: 'flex', gap: 2, mb: 1 }}>
            <Skeleton variant="rectangular" width="20%" height={32} />
            <Skeleton variant="rectangular" width="25%" height={32} />
            <Skeleton variant="rectangular" width="25%" height={32} />
            <Skeleton variant="rectangular" width="15%" height={32} />
            <Skeleton variant="rectangular" width="15%" height={32} />
          </Box>
        ))}
      </Box>
    )
  }

  if (variant === 'card') {
    return (
      <Card>
        <CardHeader
          avatar={<Skeleton variant="circular" width={40} height={40} />}
          title={<Skeleton variant="text" width="60%" />}
          subheader={<Skeleton variant="text" width="40%" />}
        />
        <CardContent>
          <Skeleton variant="text" width="100%" />
          <Skeleton variant="text" width="80%" />
          <Skeleton variant="rectangular" width="100%" height={60} sx={{ mt: 2 }} />
        </CardContent>
      </Card>
    )
  }

  if (variant === 'list') {
    return (
      <Box sx={{ width: '100%' }}>
        {Array.from({ length: rows }).map((_, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Skeleton variant="circular" width={40} height={40} />
            <Box sx={{ flexGrow: 1 }}>
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" />
            </Box>
            <Skeleton variant="rectangular" width={60} height={24} />
          </Box>
        ))}
      </Box>
    )
  }

  return null
}

