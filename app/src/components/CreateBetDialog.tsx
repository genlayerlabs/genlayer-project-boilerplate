'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'

interface CreateBetDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: { gameDate: string; team1: string; team2: string; predicted: string }) => Promise<void>
  loading?: boolean
}

export default function CreateBetDialog({ open, onClose, onSubmit, loading = false }: CreateBetDialogProps) {
  const [formData, setFormData] = useState({
    gameDate: '',
    team1: '',
    team2: '',
    predicted: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.gameDate) {
      newErrors.gameDate = 'Game date is required'
    }
    
    if (!formData.team1.trim()) {
      newErrors.team1 = 'Team 1 is required'
    }
    
    if (!formData.team2.trim()) {
      newErrors.team2 = 'Team 2 is required'
    }
    
    if (formData.team1.trim() === formData.team2.trim() && formData.team1.trim()) {
      newErrors.team2 = 'Team names must be different'
    }
    
    if (!formData.predicted) {
      newErrors.predicted = 'Please select a predicted winner'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    
    try {
      await onSubmit(formData)
      setFormData({ gameDate: '', team1: '', team2: '', predicted: '' })
      setErrors({})
      onClose()
    } catch (error) {
      console.error('Failed to create bet:', error)
    }
  }

  const handleClose = () => {
    setFormData({ gameDate: '', team1: '', team2: '', predicted: '' })
    setErrors({})
    onClose()
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Bet</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              fullWidth
              label="Game Date"
              type="date"
              value={formData.gameDate}
              onChange={(e) => setFormData({ ...formData, gameDate: e.target.value })}
              error={!!errors.gameDate}
              helperText={errors.gameDate || 'Format: YYYY-MM-DD'}
              InputLabelProps={{ shrink: true }}
            />
            
            <TextField
              fullWidth
              label="Team 1"
              value={formData.team1}
              onChange={(e) => setFormData({ ...formData, team1: e.target.value })}
              error={!!errors.team1}
              helperText={errors.team1}
              placeholder="Enter team name"
            />
            
            <TextField
              fullWidth
              label="Team 2"
              value={formData.team2}
              onChange={(e) => setFormData({ ...formData, team2: e.target.value })}
              error={!!errors.team2}
              helperText={errors.team2}
              placeholder="Enter team name"
            />
            
            <FormControl fullWidth error={!!errors.predicted}>
              <InputLabel>Predicted Winner</InputLabel>
              <Select
                value={formData.predicted}
                onChange={(e) => setFormData({ ...formData, predicted: e.target.value })}
                label="Predicted Winner"
              >
                <MenuItem value="0">Draw</MenuItem>
                <MenuItem value="1">Team 1</MenuItem>
                <MenuItem value="2">Team 2</MenuItem>
              </Select>
              {errors.predicted && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {errors.predicted}
                </Alert>
              )}
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={loading}
            startIcon={loading ? <div className="spinner" /> : undefined}
          >
            {loading ? 'Creating...' : 'Create Bet'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  )
}

