'use client'

import React, { useState, useEffect } from 'react'
import { IconButton, Tooltip } from '@mui/material'
import { Brightness4, Brightness7 } from '@mui/icons-material'
import { ThemeProvider, createTheme } from '@mui/material/styles'

interface DarkModeToggleProps {
  onToggle?: (isDark: boolean) => void
}

export default function DarkModeToggle({ onToggle }: DarkModeToggleProps) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('theme-mode')
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const darkMode = savedMode === 'dark' || (!savedMode && prefersDark)
      setIsDark(darkMode)
    }
  }, [])

  const toggleDarkMode = () => {
    const newMode = !isDark
    setIsDark(newMode)
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme-mode', newMode ? 'dark' : 'light')
    }
    
    onToggle?.(newMode)
  }

  return (
    <Tooltip title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
      <IconButton onClick={toggleDarkMode} color="inherit">
        {isDark ? <Brightness7 /> : <Brightness4 />}
      </IconButton>
    </Tooltip>
  )
}

