'use client'

import React from 'react'
import { Avatar, Tooltip } from '@mui/material'

interface AddressAvatarProps {
  address: string
  size?: number
  showTooltip?: boolean
}

// Simple deterministic avatar generator based on address
const generateAvatarColor = (address: string): string => {
  const colors = [
    '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
    '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
    '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
    '#ff5722', '#795548', '#607d8b'
  ]
  
  let hash = 0
  for (let i = 0; i < address.length; i++) {
    hash = address.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  return colors[Math.abs(hash) % colors.length]
}

const generateAvatarText = (address: string): string => {
  // Take first 2 characters after 0x
  return address.slice(2, 4).toUpperCase()
}

export default function AddressAvatar({ address, size = 40, showTooltip = true }: AddressAvatarProps) {
  const backgroundColor = generateAvatarColor(address)
  const text = generateAvatarText(address)
  
  const avatar = (
    <Avatar
      sx={{
        width: size,
        height: size,
        backgroundColor,
        fontSize: size * 0.4,
        fontWeight: 'bold',
        color: 'white',
      }}
    >
      {text}
    </Avatar>
  )

  if (showTooltip) {
    return (
      <Tooltip title={address} arrow>
        {avatar}
      </Tooltip>
    )
  }

  return avatar
}

